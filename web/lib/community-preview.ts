import axeDrafts from "@/data/axe-lines.json";
import { getHeroLines } from "@/lib/catalog";

const axePreviews = new Map(
  axeDrafts
    .filter((line) => line.voiceScope === "spoken" && line.ptBrText)
    .map((line) => [line.id, line.ptBrText]),
);

const translationMemory = new Map<string, string>();
const ambiguous = new Set<string>();
for (const line of axeDrafts.filter((item) => item.voiceScope === "spoken" && item.ptBrText)) {
  const key = line.sourceText.trim().toLocaleLowerCase("en");
  const existing = translationMemory.get(key);
  if (existing && existing !== line.ptBrText) ambiguous.add(key);
  else translationMemory.set(key, line.ptBrText);
}
for (const key of ambiguous) translationMemory.delete(key);

export function getCommunityPreviews(heroId: string) {
  if (heroId === "announcer") return {};
  return Object.fromEntries(
    getHeroLines(heroId).flatMap((line) => {
      const direct = heroId === "axe" ? axePreviews.get(line.id) : null;
      const shared = translationMemory.get(line.captionEn.trim().toLocaleLowerCase("en"));
      const preview = direct || shared;
      return preview ? [[line.id, preview]] : [];
    }),
  );
}
