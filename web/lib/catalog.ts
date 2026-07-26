import axeLines from "@/data/axe-lines.json";
import heroCatalog from "@/data/heroes.json";

export type CatalogLine = (typeof axeLines)[number];
export type Hero = (typeof heroCatalog.heroes)[number];

export const CURRENT_BUILD = heroCatalog.build.clientVersion;
export const CURRENT_BUILD_DATE = heroCatalog.build.date;

export const heroes = heroCatalog.heroes;

export const getAxeLines = () => axeLines as CatalogLine[];
export const getLine = (id: string) => axeLines.find((line) => line.id === id);
export const getHero = (id: string) => heroes.find((hero) => hero.id === id);
export const getHeroLines = (id: string) =>
  id === "axe" ? (axeLines as CatalogLine[]) : [];

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
