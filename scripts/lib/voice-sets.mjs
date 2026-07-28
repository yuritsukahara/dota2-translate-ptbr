// Exceções confirmadas no inventário local do build 6869.
//
// Os arquivos de captions da Valve não usam uma convenção única: algumas
// vozes alternativas têm um prefixo próprio (`amp_*`), enquanto outras ficam
// aninhadas sob o prefixo da voz-base (`cm_wolf_*`, `drow_arc_*`). Manter este
// mapa explícito evita que uma persona ou Arcana seja contada no herói-base.

export const baseVoicePrefixes = {
  crystal_maiden: ["cm"],
  dragon_knight: ["dragon", "drag"],
  drow_ranger: ["drow", "dro"],
  earthshaker: ["erth"],
  juggernaut: ["jug", "jugg"],
  mirana: ["mir"],
  ogre_magi: ["ogmag"],
  phantom_assassin: ["phass"],
  queenofpain: ["pain"],
  razor: ["raz"],
  sand_king: ["skg", "sand"],
  skywrath_mage: ["drag"],
  spectre: ["spec"],
  storm_spirit: ["ss", "stormspirit"],
  vengefulspirit: ["vng"],
  skeleton_king: ["wraith"],
  zuus: ["zuus", "zeus"],
};

export const curatedVoiceVariants = [
  {
    id: "axe-automaton",
    heroId: "axe",
    prefixes: ["auto_axe"],
    name: "Axe Automaton — Persona",
    type: "persona",
  },
  {
    id: "bristleback-auto",
    heroId: "bristleback",
    prefixes: ["auto"],
    name: "Bristleback Automaton — Persona",
    type: "persona",
  },
  {
    id: "legion_commander-auto",
    heroId: "legion_commander",
    prefixes: ["auto"],
    name: "Legion Commander Automaton — Persona",
    type: "persona",
  },
  {
    id: "morphling-auto",
    heroId: "morphling",
    prefixes: ["auto"],
    name: "Morphling Automaton — Persona",
    type: "persona",
  },
  {
    id: "oracle-auto",
    heroId: "oracle",
    prefixes: ["auto"],
    name: "Oracle Automaton — Persona",
    type: "persona",
  },
  {
    id: "antimage-wei",
    heroId: "antimage",
    prefixes: ["amp"],
    name: "Wei — Persona da Anti-Mage",
    type: "persona",
  },
  {
    id: "crystal_maiden-blueheart",
    heroId: "crystal_maiden",
    prefixes: ["cm_wolf"],
    name: "Conduit of the Blueheart — Persona da Crystal Maiden",
    type: "persona",
  },
  {
    id: "dragon-knight-davion",
    heroId: "dragon_knight",
    prefixes: ["dk"],
    name: "Davion — Persona do Dragon Knight",
    type: "persona",
  },
  {
    id: "invoker-kid",
    heroId: "invoker",
    prefixes: ["kidvoker", "kidvo"],
    name: "Invoker Criança",
    type: "persona",
  },
  {
    id: "mirana-nightsilver",
    heroId: "mirana",
    prefixes: ["mira_per"],
    name: "Mirana de Nightsilver",
    type: "persona",
  },
  {
    id: "phantom-assassin-asan",
    heroId: "phantom_assassin",
    prefixes: ["pa_asan"],
    name: "Asan — Persona da Phantom Assassin",
    type: "persona",
  },
  {
    id: "pudge-toy-butcher",
    heroId: "pudge",
    prefixes: ["toy"],
    name: "Açougueiro de Brinquedo",
    type: "persona",
  },
  {
    id: "axe-jung",
    heroId: "axe",
    prefixes: ["jung"],
    name: "Fists of Axe Unleashed — variante de voz",
    type: "voice_variant",
  },
  {
    id: "dark_willow-helmet",
    heroId: "dark_willow",
    prefixes: ["helmet"],
    name: "Ardalan Arsonist — variante de voz da Dark Willow",
    type: "voice_variant",
  },
  {
    id: "drow_ranger-dro",
    heroId: "drow_ranger",
    prefixes: ["drow_arc"],
    name: "Drow Ranger — Arcana",
    type: "voice_variant",
  },
  {
    id: "earthshaker-erth",
    heroId: "earthshaker",
    prefixes: ["earth_arcana"],
    name: "Earthshaker — Arcana",
    type: "voice_variant",
  },
  {
    id: "faceless_void-fv",
    heroId: "faceless_void",
    prefixes: ["fv"],
    name: "Faceless Void — Arcana",
    type: "voice_variant",
  },
  {
    id: "juggernaut-jugsc",
    heroId: "juggernaut",
    prefixes: ["jug_arc", "jugsc_arc"],
    name: "Juggernaut — Arcana",
    type: "voice_variant",
  },
  {
    id: "legion_commander-arcana",
    heroId: "legion_commander",
    prefixes: ["legcom_dem", "legcom_econ"],
    name: "Legion Commander — Arcana",
    type: "voice_variant",
  },
  {
    id: "monkey_king-arcana",
    heroId: "monkey_king",
    prefixes: [
      "monkey_crown",
      "mk_arcana",
      "mk_crown",
      "mk_hero",
      "mk_takeover",
    ],
    name: "Monkey King — Arcana",
    type: "voice_variant",
  },
  {
    id: "nevermore-arcana",
    heroId: "nevermore",
    prefixes: ["nev_arc"],
    name: "Shadow Fiend — Arcana",
    type: "voice_variant",
  },
  {
    id: "ogre_magi-ogm",
    heroId: "ogre_magi",
    prefixes: ["ogm_arc", "ogr_mou"],
    name: "Ogre Magi — Arcana",
    type: "voice_variant",
  },
  {
    id: "phantom_assassin-arcana",
    heroId: "phantom_assassin",
    prefixes: ["phass_arc"],
    name: "Phantom Assassin — Arcana",
    type: "voice_variant",
  },
  {
    id: "pudge-arcana",
    heroId: "pudge",
    prefixes: ["pud_arc"],
    name: "Pudge — Arcana",
    type: "voice_variant",
  },
  {
    id: "queenofpain-pain",
    heroId: "queenofpain",
    prefixes: ["qop_arc", "qop_scream"],
    name: "Queen of Pain — Arcana",
    type: "voice_variant",
  },
  {
    id: "razor-rz",
    heroId: "razor",
    prefixes: ["rz_vsa", "razor_arc"],
    name: "Razor — Arcana",
    type: "voice_variant",
  },
  {
    id: "rubick-rub",
    heroId: "rubick",
    prefixes: ["rub"],
    name: "Rubick — Arcana",
    type: "voice_variant",
  },
  {
    id: "skywrath_mage-drag",
    heroId: "skywrath_mage",
    prefixes: ["skywrath_crown"],
    name: "Skywrath Mage — Arcana",
    type: "voice_variant",
  },
  {
    id: "spectre-spec",
    heroId: "spectre",
    prefixes: ["spectre_wwa", "fs_spectre_wwa"],
    name: "Spectre — Arcana",
    type: "voice_variant",
  },
  {
    id: "spectre-mercurials-call",
    heroId: "spectre",
    prefixes: ["spec_redux"],
    name: "Mercurial's Call — voz alternativa da Spectre",
    type: "voice_variant",
  },
  {
    id: "snapfire-helmet",
    heroId: "snapfire",
    prefixes: ["helmet"],
    name: "Ardalan Arms Race — variante de voz da Snapfire",
    type: "voice_variant",
  },
  {
    id: "sniper-helmet",
    heroId: "sniper",
    prefixes: ["helmet"],
    name: "Helm of the Ardalan Interdictor — variante de voz do Sniper",
    type: "voice_variant",
  },
  {
    id: "terrorblade-arcana",
    heroId: "terrorblade",
    prefixes: ["terr_shards"],
    name: "Terrorblade — Arcana",
    type: "voice_variant",
  },
  {
    id: "muerta-eth",
    heroId: "muerta",
    prefixes: ["eth"],
    name: "Muerta — forma etérea",
    type: "voice_variant",
  },
  {
    id: "techies-noba",
    heroId: "techies",
    prefixes: ["noba"],
    name: "Techies — variante de voz NOBA",
    type: "voice_variant",
  },
  {
    id: "skeleton_king-wraith",
    heroId: "skeleton_king",
    prefixes: ["skel_arc"],
    name: "Wraith King — Arcana",
    type: "voice_variant",
  },
  {
    id: "tiny-prestige",
    heroId: "tiny",
    prefixes: ["tiny_pres"],
    name: "Tiny — Prestígio",
    type: "voice_variant",
  },
  {
    id: "vengefulspirit-crownfall",
    heroId: "vengefulspirit",
    prefixes: ["venge_crown"],
    name: "Vengeful Spirit — Crownfall",
    type: "voice_variant",
  },
  {
    id: "vengefulspirit-imperia",
    heroId: "vengefulspirit",
    prefixes: ["imperia", "queen_imperia"],
    name: "Vengeful Spirit — Imperia",
    type: "voice_variant",
  },
  {
    id: "windrunner-wr",
    heroId: "windrunner",
    prefixes: ["wr"],
    name: "Windranger — Arcana",
    type: "voice_variant",
  },
  {
    id: "zuus-zeus",
    heroId: "zuus",
    prefixes: ["zuus_arc", "zeus_arc"],
    name: "Zeus — Arcana",
    type: "voice_variant",
  },
];

export function matchesVoicePrefix(stem, prefix) {
  return stem === prefix || stem.startsWith(`${prefix}_`);
}

export function curatedVariantsForHero(heroId) {
  return curatedVoiceVariants.filter((variant) => variant.heroId === heroId);
}

export function isCuratedVariantStem(heroId, stem) {
  return curatedVariantsForHero(heroId).some((variant) =>
    variant.prefixes.some((prefix) => matchesVoicePrefix(stem, prefix)),
  );
}
