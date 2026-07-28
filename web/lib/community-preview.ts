import voiceCatalog from "@/data/voice-lines.json";
import { getHeroLines } from "@/lib/catalog";

const communityLines = Object.values(voiceCatalog.heroes)
  .flat()
  .filter((line) => line.captionPtBrSource === "community" && line.captionPtBr);

const translationMemory = new Map<string, string>();
const ambiguous = new Set<string>();
for (const line of communityLines) {
  const key = line.captionEn.trim().toLocaleLowerCase("en");
  const existing = translationMemory.get(key);
  if (existing && existing !== line.captionPtBr) ambiguous.add(key);
  else translationMemory.set(key, line.captionPtBr);
}
for (const key of ambiguous) translationMemory.delete(key);

export function getCommunityPreviews(heroId: string) {
  if (heroId === "announcer") return {};
  return Object.fromEntries(
    getHeroLines(heroId).flatMap((line) => {
      const shared = translationMemory.get(line.captionEn.trim().toLocaleLowerCase("en"));
      return shared ? [[line.id, shared]] : [];
    }),
  );
}
