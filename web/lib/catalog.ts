import axeLines from "@/data/axe-lines.json";

export type CatalogLine = (typeof axeLines)[number];

export const CURRENT_BUILD = "2026-07-23";

export const heroes = [
  {
    id: "axe",
    name: "Axe",
    subtitle: "Exército de um homem só",
    total: axeLines.length,
    translated: axeLines.filter((line) => line.translationStatus === "approved").length,
    recorded: axeLines.filter((line) => line.audioStatus === "recorded").length,
    reviewed: axeLines.filter((line) => line.releaseStatus === "included").length,
    active: true,
  },
  { id: "crystal_maiden", name: "Crystal Maiden", subtitle: "Próxima campanha", total: 0, translated: 0, recorded: 0, reviewed: 0, active: false },
  { id: "pudge", name: "Pudge", subtitle: "Inventário em preparação", total: 0, translated: 0, recorded: 0, reviewed: 0, active: false },
  { id: "juggernaut", name: "Juggernaut", subtitle: "Inventário em preparação", total: 0, translated: 0, recorded: 0, reviewed: 0, active: false },
] as const;

export const getAxeLines = () => axeLines as CatalogLine[];
export const getLine = (id: string) => axeLines.find((line) => line.id === id);

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
