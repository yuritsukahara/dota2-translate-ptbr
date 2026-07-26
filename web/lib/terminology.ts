import terminology from "@/data/terminology.json";

export type ProtectedTerm = {
  key: string;
  en: string;
  ptBr: string;
  type: "herói" | "item";
};

const normalize = (value: string) =>
  value.normalize("NFKC").toLocaleLowerCase("pt-BR").replace(/[’']/g, "'");

const isWordCharacter = (value: string | undefined) => Boolean(value && /[\p{L}\p{N}_]/u.test(value));

function locateWholeTerm(source: string, term: string) {
  const ranges: Array<[number, number]> = [];
  let offset = 0;
  while (offset < source.length) {
    const start = source.indexOf(term, offset);
    if (start < 0) break;
    const end = start + term.length;
    if (!isWordCharacter(source[start - 1]) && !isWordCharacter(source[end])) {
      ranges.push([start, end]);
    }
    offset = start + 1;
  }
  return ranges;
}

export const protectedTerms: ProtectedTerm[] = [
  ...terminology.heroes.map((term) => ({ ...term, type: "herói" as const })),
  ...terminology.items.map((term) => ({ ...term, type: "item" as const })),
].filter((term) => term.en.length > 2 && term.ptBr.length > 1);

export function findRelevantTerms(sourceEn: string) {
  const source = normalize(sourceEn);
  const occupied: Array<[number, number]> = [];
  return [...protectedTerms]
    .sort((left, right) => right.en.length - left.en.length)
    .filter((term) => {
      const range = locateWholeTerm(source, normalize(term.en))
        .find(([start, end]) => !occupied.some(([usedStart, usedEnd]) => start < usedEnd && end > usedStart));
      if (!range) return false;
      occupied.push(range);
      return true;
    });
}

export function validateTerminology(sourceEn: string, suggestionPtBr: string) {
  const suggestion = normalize(suggestionPtBr);
  return findRelevantTerms(sourceEn)
    .filter((term) => locateWholeTerm(suggestion, normalize(term.ptBr)).length === 0)
    .map((term) => ({
      type: term.type,
      key: term.key,
      sourceTerm: term.en,
      expectedTerm: term.ptBr,
    }));
}
