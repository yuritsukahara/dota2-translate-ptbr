import { strToU8, zipSync } from "fflate";
import { CURRENT_BUILD, type OfficialVoiceLine } from "@/lib/catalog";
import type { CurrentTranslation } from "@/lib/current-translations";

type VoicePackSource = {
  id: string;
  name: string;
};

function asSingleLine(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function windowsText(text: string) {
  return strToU8(`\uFEFF${text.replace(/\r?\n/g, "\r\n")}`);
}

export function isRequiredVoicePackLine(line: OfficialVoiceLine) {
  return Boolean(
    line.captionEn &&
      line.voiceScope !== "excluded_nonverbal" &&
      line.voiceScope !== "excluded_no_official_caption",
  );
}

export function buildVoicePackReadme(
  source: VoicePackSource,
  requiredLines: OfficialVoiceLine[],
) {
  return [
    `KIT DE GRAVAÇÃO — ${source.name.toLocaleUpperCase("pt-BR")}`,
    `Dublagem Brasileira Dota 2 · build ${CURRENT_BUILD}`,
    "",
    "COMO USAR",
    `1. Grave as ${requiredLines.length.toLocaleString("pt-BR")} falas listadas em CHECKLIST.txt.`,
    "2. Salve cada gravação na pasta wav usando exatamente o ID indicado.",
    "3. Marque [x] no checklist depois de gravar e conferir cada arquivo.",
    "4. Compartilhe a pasta completa pelo Google Drive como “Qualquer pessoa com o link — Leitor”.",
    "5. Envie o link na página de packs do projeto.",
    "",
    "FORMATO OBRIGATÓRIO",
    "- WAV PCM mono, 16-bit, 24 kHz ou 48 kHz.",
    "- Um arquivo por fala, sem música, efeitos ou redução agressiva de ruído.",
    `- Nome exato: wav/${requiredLines[0]?.id ?? `${source.id}_linha_01`}.wav`,
    "- Mantenha volume, distância do microfone e interpretação consistentes.",
    "- Não é necessário gravar gemidos ou sons não verbais que não aparecem no checklist.",
    "",
    "DIRETRIZES DE INTERPRETAÇÃO",
    "- Um único intérprete deve gravar todo o pack do personagem.",
    "- Preserve intenção, ritmo, personalidade e contexto da legenda; não traduza novamente o texto.",
    "- Pronuncie nomes de heróis, itens e habilidades como aparecem no universo de Dota 2.",
    "- Faça uma revisão de ruído, cortes, clipping e arquivos ausentes antes do envio.",
    "",
    "DIREITOS E CRÉDITOS",
    "- Envie somente a sua própria voz ou uma voz para a qual você possua autorização expressa.",
    "- Não inclua áudio extraído do jogo nem clonagem/imitação de voz sem autorização.",
    "- Ao enviar, informe o nome de crédito e confirme a licença solicitada pelo projeto.",
    "",
    "ESTRUTURA",
    `${source.id}-voice-pack/`,
    "├── README.txt",
    "├── CHECKLIST.txt",
    "└── wav/",
    `    ├── ${requiredLines[0]?.id ?? `${source.id}_linha_01`}.wav`,
    "    └── ...",
    "",
  ].join("\n");
}

export function buildVoicePackChecklist(
  source: VoicePackSource,
  requiredLines: OfficialVoiceLine[],
  translations: Record<string, CurrentTranslation>,
) {
  const entries = requiredLines.flatMap((line) => {
    const translation = translations[line.id];
    return [
      `[ ] ${line.id}`,
      `    Arquivo: wav/${line.id}.wav`,
      `    EN: ${asSingleLine(line.captionEn)}`,
      `    PT-BR: ${translation ? asSingleLine(translation.text) : "Tradução ainda não disponível"}`,
      "",
    ];
  });

  return [
    `CHECKLIST DE GRAVAÇÃO — ${source.name.toLocaleUpperCase("pt-BR")}`,
    `Build ${CURRENT_BUILD} · ${requiredLines.length.toLocaleString("pt-BR")} falas com texto`,
    "",
    "Troque [ ] por [x] depois de gravar e revisar cada WAV.",
    "Gemidos e outros sons não verbais foram removidos desta lista.",
    "",
    ...entries,
  ].join("\n");
}

export function createVoicePackTemplate(
  source: VoicePackSource,
  lines: OfficialVoiceLine[],
  translations: Record<string, CurrentTranslation>,
) {
  const requiredLines = lines
    .filter(isRequiredVoicePackLine)
    .sort((left, right) => left.id.localeCompare(right.id, "en"));
  const root = `${source.id}-voice-pack`;

  return {
    requiredLineCount: requiredLines.length,
    archive: zipSync(
      {
        [`${root}/README.txt`]: windowsText(
          buildVoicePackReadme(source, requiredLines),
        ),
        [`${root}/CHECKLIST.txt`]: windowsText(
          buildVoicePackChecklist(source, requiredLines, translations),
        ),
        [`${root}/wav/COLOQUE_OS_WAVS_AQUI.txt`]: windowsText(
          "Coloque nesta pasta um arquivo WAV para cada ID do CHECKLIST.txt.\n",
        ),
      },
      { level: 6 },
    ),
  };
}
