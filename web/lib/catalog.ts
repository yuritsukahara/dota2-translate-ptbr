import heroCatalog from "@/data/heroes.json";
import voiceCatalog from "@/data/voice-lines.json";
import announcerCatalog from "@/data/announcer-lines.json";
import personaCatalog from "@/data/personas.json";

export type Hero = (typeof heroCatalog.heroes)[number];
export type OfficialVoiceLine = {
  id: string;
  category: string;
  captionEn: string;
  captionPtBr: string | null;
  captionPtBrSource?: "official" | "community" | "automatic" | null;
  sourceStatus?: string;
  voiceScope?: string;
  voiceDirection?: string;
  translationStatus?: string;
  audioStatus?: string;
};

export type PersonaVariant = {
  id: string;
  heroId: string;
  heroName: string;
  name: string;
  type: "persona" | "voice_variant";
  prefixes: string[];
  imageUrl: string;
  iconUrl: string;
  imageAssetPath?: string | null;
  voiceDirectory: string;
  total: number;
  translated: number;
  officialBrazilianCaptions: number;
  reusedCaptions: number;
  audioAssets: number;
  lines: OfficialVoiceLine[];
};

const linesByHero = (
  voiceCatalog as { heroes: Record<string, OfficialVoiceLine[]> }
).heroes;
const announcerLines = announcerCatalog.lines as OfficialVoiceLine[];

export const CURRENT_BUILD = heroCatalog.build.clientVersion;
export const CURRENT_BUILD_DATE = heroCatalog.build.date;

export const heroes = [...heroCatalog.heroes].sort((left, right) =>
  left.name.localeCompare(right.name, "pt-BR")
);
export const personas = (
  personaCatalog as { variants: PersonaVariant[] }
).variants;

export type CaptionSource = {
  id: string;
  name: string;
  total: number;
  officialEnglishCaptions: number;
  officialBrazilianCaptions: number;
  kind: "hero" | "announcer";
};

export const announcerSource: CaptionSource = {
  id: "announcer",
  name: "Narrador padrão",
  total: announcerLines.length,
  officialEnglishCaptions: announcerLines.length,
  officialBrazilianCaptions: announcerLines.filter((line) => line.captionPtBr).length,
  kind: "announcer",
};

export const captionSources: CaptionSource[] = [
  announcerSource,
  ...heroes.map((hero) => ({ ...hero, kind: "hero" as const })),
];

export const getHero = (id: string) => heroes.find((hero) => hero.id === id);
export const getCaptionSource = (id: string) => captionSources.find((source) => source.id === id);
export const getHeroLines = (id: string) => id === "announcer" ? announcerLines : linesByHero[id] || [];
export const getHeroLine = (heroId: string, lineId: string) =>
  getHeroLines(heroId).find((line) => line.id === lineId);
export const getPersona = (id: string) =>
  personas.find((persona) => persona.id === id);
export const getPersonaLines = (id: string) =>
  getPersona(id)?.lines || [];
export const getVoicePackSource = (id: string) =>
  getHero(id) || getPersona(id);
export const getHeroPersonas = (heroId: string) =>
  personas.filter((persona) => persona.heroId === heroId);

export function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}
