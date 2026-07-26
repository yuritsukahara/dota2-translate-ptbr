import type { OfficialVoiceLine } from "@/lib/catalog";
import { getAutomaticTranslations } from "@/lib/automatic-translations";
import { getCommunityPreviews } from "@/lib/community-preview";

export type CurrentTranslation = {
  text: string;
  source: "official" | "community" | "automatic";
};

export function getCurrentTranslations(sourceId: string, lines: OfficialVoiceLine[]) {
  const automatic = getAutomaticTranslations(sourceId);
  const community = getCommunityPreviews(sourceId);

  return Object.fromEntries(
    lines.flatMap((line) => {
      if (line.captionPtBr) {
        return [[line.id, { text: line.captionPtBr, source: "official" } satisfies CurrentTranslation]];
      }
      if (community[line.id]) {
        return [[line.id, { text: community[line.id], source: "community" } satisfies CurrentTranslation]];
      }
      if (automatic[line.id]) {
        return [[line.id, { text: automatic[line.id], source: "automatic" } satisfies CurrentTranslation]];
      }
      return [];
    }),
  ) as Record<string, CurrentTranslation>;
}

export function currentTranslationLabel(source: CurrentTranslation["source"]) {
  if (source === "official") return "caption oficial";
  if (source === "community") return "tradução da comunidade";
  return "tradução automática";
}

export function countTranslationSources(translations: Record<string, CurrentTranslation>) {
  const counts = { official: 0, community: 0, automatic: 0 };
  for (const translation of Object.values(translations)) counts[translation.source] += 1;
  return counts;
}
