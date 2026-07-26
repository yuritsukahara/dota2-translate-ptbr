import axeDrafts from "@/data/axe-lines.json";

const previews = new Map(
  axeDrafts
    .filter((line) => line.voiceScope === "spoken" && line.ptBrText)
    .map((line) => [line.id, line.ptBrText]),
);

export function getCommunityPreviews(heroId: string) {
  if (heroId !== "axe") return {};
  return Object.fromEntries(previews);
}
