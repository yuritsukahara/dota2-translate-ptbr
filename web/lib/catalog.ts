import heroCatalog from "@/data/heroes.json";
import voiceCatalog from "@/data/voice-lines.json";
import announcerCatalog from "@/data/announcer-lines.json";

export type Hero = (typeof heroCatalog.heroes)[number];
export type OfficialVoiceLine = {
  id: string;
  assetPath: string;
  category: string;
  captionToken: string;
  captionEn: string;
  captionPtBr: string | null;
  originalAudio: "dota_local";
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

export const getAxeLines = () => linesByHero.axe || [];
export const getLine = (id: string) => getAxeLines().find((line) => line.id === id);
export const getHero = (id: string) => heroes.find((hero) => hero.id === id);
export const getCaptionSource = (id: string) => captionSources.find((source) => source.id === id);
export const getHeroLines = (id: string) => id === "announcer" ? announcerLines : linesByHero[id] || [];
export const getHeroLine = (heroId: string, lineId: string) =>
  getHeroLines(heroId).find((line) => line.id === lineId);

export function categoryLabel(category: string) {
  const labels: Record<string, string> = {
    ability_battlehunger: "Fome de Batalha",
    ability_berserk: "Chamado do Berserker",
    ability_cullingblade: "Lâmina de Abate",
    ability_failure: "Habilidade falhou",
    ally: "Aliados",
    anger: "Raiva",
    attack: "Ataque",
    battlebegins: "Início da batalha",
    blink: "Translocação",
    blinkcull: "Translocação e abate",
    bottle: "Garrafa",
    cast: "Conjuração",
    death: "Morte",
    deny: "Negação",
    firstblood: "Primeiro sangue",
    happy: "Felicidade",
    kill: "Abate",
    killspecial: "Abate especial",
    laugh: "Risada",
    level: "Novo nível",
    move: "Movimento",
    nomana: "Sem mana",
    pain: "Dor",
    respawn: "Renascimento",
    rival: "Rivais",
    spawn: "Entrada",
    win: "Vitória",
  };
  return labels[category] || category.replaceAll("_", " ");
}

export function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}
