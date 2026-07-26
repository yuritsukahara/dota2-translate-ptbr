import automaticCatalog from "@/data/automatic-translations.json";

const translations = automaticCatalog.translations as Record<string, Record<string, string>>;

export const automaticTranslationMetadata = automaticCatalog.metadata;

export function getAutomaticTranslations(sourceId: string) {
  return translations[sourceId] || {};
}
