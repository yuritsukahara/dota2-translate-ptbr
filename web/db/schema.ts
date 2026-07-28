import { sql } from "drizzle-orm";
import {
  index,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
};

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  steamId: text("steam_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  steamAccountCreatedAt: text("steam_account_created_at").notNull(),
  blockedAt: text("blocked_at"),
  ...timestamps,
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("sessions_user_idx").on(table.userId)],
);

export const petitionSignatures = sqliteTable(
  "petition_signatures",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
    statementVersion: text("statement_version").notNull().default("2026-07-26"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("petition_signatures_created_idx").on(table.createdAt)],
);

export const captionSuggestions = sqliteTable(
  "caption_suggestions",
  {
    id: text("id").primaryKey(),
    lineId: text("line_id").notNull(),
    heroId: text("hero_id").notNull(),
    authorId: text("author_id").notNull().references(() => users.id),
    text: text("text").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("caption_suggestions_line_idx").on(table.lineId),
    index("caption_suggestions_hero_idx").on(table.heroId),
  ],
);

export const voicePackSubmissions = sqliteTable(
  "voice_pack_submissions",
  {
    id: text("id").primaryKey(),
    heroId: text("hero_id").notNull(),
    authorId: text("author_id").notNull().references(() => users.id),
    credit: text("credit").notNull(),
    driveFolderUrl: text("drive_folder_url").notNull(),
    notes: text("notes").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("voice_pack_submissions_hero_idx").on(table.heroId),
    index("voice_pack_submissions_author_idx").on(table.authorId),
  ],
);

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
  (table) => [
    index("audit_actor_action_idx").on(table.actorId, table.action),
    index("audit_subject_idx").on(table.subjectType, table.subjectId),
  ],
);
