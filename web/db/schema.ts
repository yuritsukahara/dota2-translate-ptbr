import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
};

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  discordId: text("discord_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  verified: integer("verified", { mode: "boolean" }).notNull().default(false),
  discordCreatedAt: text("discord_created_at").notNull(),
  blockedAt: text("blocked_at"),
  ...timestamps,
});

export const roles = sqliteTable(
  "roles",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role", {
      enum: ["member", "translator", "actor", "language_reviewer", "audio_reviewer", "moderator", "admin"],
    }).notNull(),
    grantedAt: text("granted_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.userId, table.role] })],
);

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const heroes = sqliteTable("heroes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  voiceDirectory: text("voice_directory").notNull(),
  voicePrefix: text("voice_prefix").notNull(),
  scope: text("scope").notNull().default("base"),
  buildId: text("build_id").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const lines = sqliteTable(
  "lines",
  {
    id: text("id").primaryKey(),
    heroId: text("hero_id").notNull().references(() => heroes.id, { onDelete: "cascade" }),
    assetPath: text("asset_path").notNull().unique(),
    category: text("category").notNull(),
    placeholderText: text("placeholder_text").notNull(),
    translationStatus: text("translation_status").notNull().default("placeholder"),
    audioStatus: text("audio_status").notNull().default("missing"),
    releaseStatus: text("release_status").notNull().default("missing"),
    inventoryState: text("inventory_state").notNull().default("active"),
    ...timestamps,
  },
  (table) => [index("lines_hero_idx").on(table.heroId), index("lines_category_idx").on(table.category)],
);

export const proposals = sqliteTable(
  "proposals",
  {
    id: text("id").primaryKey(),
    lineId: text("line_id").notNull().references(() => lines.id, { onDelete: "cascade" }),
    authorId: text("author_id").notNull().references(() => users.id),
    kind: text("kind", { enum: ["translation", "audio"] }).notNull(),
    text: text("text"),
    translationProposalId: text("translation_proposal_id"),
    audioObjectKey: text("audio_object_key"),
    audioDurationMs: integer("audio_duration_ms"),
    audioSampleRate: integer("audio_sample_rate"),
    credit: text("credit"),
    license: text("license"),
    status: text("status", {
      enum: ["pending", "open", "eligible", "approved", "rejected", "withdrawn"],
    }).notNull().default("pending"),
    openedAt: text("opened_at"),
    decidedAt: text("decided_at"),
    ...timestamps,
  },
  (table) => [index("proposals_line_idx").on(table.lineId), index("proposals_status_idx").on(table.status)],
);

export const votes = sqliteTable(
  "votes",
  {
    proposalId: text("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.proposalId, table.userId] })],
);

export const reviews = sqliteTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    proposalId: text("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
    reviewerId: text("reviewer_id").notNull().references(() => users.id),
    kind: text("kind", { enum: ["language", "technical"] }).notNull(),
    decision: text("decision", { enum: ["approve", "request_changes", "reject"] }).notNull(),
    notes: text("notes").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("reviews_unique_kind").on(table.proposalId, table.kind)],
);

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  proposalId: text("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  reporterId: text("reporter_id").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const releases = sqliteTable("releases", {
  id: text("id").primaryKey(),
  version: text("version").notNull().unique(),
  buildId: text("build_id").notNull(),
  downloadUrl: text("download_url").notNull(),
  manifestUrl: text("manifest_url").notNull(),
  sha256: text("sha256").notNull(),
  signature: text("signature").notNull(),
  reviewedLines: integer("reviewed_lines").notNull(),
  totalLines: integer("total_lines").notNull(),
  publishedAt: text("published_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const auditEvents = sqliteTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id"),
    action: text("action").notNull(),
    subjectType: text("subject_type").notNull(),
    subjectId: text("subject_id").notNull(),
    metadata: text("metadata").notNull().default("{}"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("audit_subject_idx").on(table.subjectType, table.subjectId)],
);
