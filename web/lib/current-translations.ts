import type { OfficialVoiceLine } from "@/lib/catalog";
import { getAutomaticTranslations } from "@/lib/automatic-translations";
import { getCommunityPreviews } from "@/lib/community-preview";

export type CurrentTranslation = {
  text: string;
  source: "official" | "project" | "automatic";
};

export function getCurrentTranslations(sourceId: string, lines: OfficialVoiceLine[]) {
  const automatic = getAutomaticTranslations(sourceId);
  const project = getCommunityPreviews(sourceId);

  return Object.fromEntries(
    lines.flatMap((line) => {
      if (line.captionPtBr) {
        return [[line.id, { text: line.captionPtBr, source: "official" } satisfies CurrentTranslation]];
      }
      if (project[line.id]) {
        return [[line.id, { text: project[line.id], source: "project" } satisfies CurrentTranslation]];
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
  if (source === "project") return "tradução do projeto";
  return "tradução automática";
}
