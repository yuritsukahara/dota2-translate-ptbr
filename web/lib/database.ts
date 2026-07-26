import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { heroes, proposals, reviews, roles, votes } from "@/db/schema";
import axeLines from "@/data/axe-lines.json";
import { CURRENT_BUILD } from "./catalog";
import { runtimeEnv } from "./runtime-env";

export async function ensureCatalogSeeded() {
  const db = getDb();
  const [existing] = await db.select({ count: count() }).from(heroes).where(eq(heroes.id, "axe"));
  if ((existing?.count ?? 0) > 0) return;

  await db.insert(heroes).values({
    id: "axe",
    name: "Axe",
    voiceDirectory: "axe",
    voicePrefix: "axe_",
    scope: "base",
    buildId: CURRENT_BUILD,
  }).onConflictDoNothing();

  const binding = runtimeEnv.DB;
  const statements = axeLines.map((line) =>
    binding.prepare(
      `INSERT OR IGNORE INTO lines
       (id, hero_id, asset_path, category, placeholder_text, translation_status, audio_status, release_status, inventory_state)
       VALUES (?, 'axe', ?, ?, ?, ?, ?, ?, 'active')`,
    ).bind(
      line.id,
      line.assetPath,
      line.category,
      line.ptBrText,
      line.translationStatus,
      line.audioStatus,
      line.releaseStatus,
    ),
  );
  for (let index = 0; index < statements.length; index += 80) {
    await binding.batch(statements.slice(index, index + 80));
  }
}

export async function proposalVoteCount(proposalId: string) {
  const db = getDb();
  const [result] = await db.select({ value: count() }).from(votes).where(eq(votes.proposalId, proposalId));
  return result?.value ?? 0;
}

export async function hasRequiredRole(userId: string, accepted: string[]) {
  const db = getDb();
  const rows = await db.select({ role: roles.role }).from(roles).where(eq(roles.userId, userId));
  return rows.some((row) => accepted.includes(row.role));
}

export async function refreshEligibility(proposalId: string) {
  const db = getDb();
  const [proposal] = await db.select().from(proposals).where(eq(proposals.id, proposalId)).limit(1);
  if (!proposal || proposal.status !== "open" || !proposal.openedAt) return;
  const age = Date.now() - new Date(proposal.openedAt).getTime();
  const supports = await proposalVoteCount(proposalId);
  const competitors = await db
    .select({ id: proposals.id, supports: count(votes.userId) })
    .from(proposals)
    .leftJoin(votes, eq(votes.proposalId, proposals.id))
    .where(and(
      eq(proposals.lineId, proposal.lineId),
      eq(proposals.kind, proposal.kind),
      inArray(proposals.status, ["open", "eligible"]),
    ))
    .groupBy(proposals.id)
    .orderBy(desc(count(votes.userId)));
  const runnerUp = competitors.filter((item) => item.id !== proposalId)[0]?.supports ?? 0;
  const clearLead = supports - runnerUp >= 3 || (runnerUp > 0 && supports >= Math.ceil(runnerUp * 1.2)) || competitors.length === 1;
  const reviewRows = await db
    .select({ kind: reviews.kind, decision: reviews.decision })
    .from(reviews)
    .where(and(eq(reviews.proposalId, proposalId), eq(reviews.decision, "approve")));
  const kinds = new Set(reviewRows.map((review) => review.kind));
  if (age >= 7 * 86_400_000 && supports >= 10 && clearLead && kinds.has("language") && kinds.has("technical")) {
    await db.update(proposals).set({ status: "eligible", updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(proposals.id, proposalId));
  }
}
