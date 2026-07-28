import { getCurrentTranslations } from "@/lib/current-translations";
import { getHero, getHeroLines } from "@/lib/catalog";
import { createVoicePackTemplate } from "@/lib/voice-pack-template";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ hero: string }> },
) {
  const { hero: heroId } = await params;
  const hero = getHero(heroId);

  if (!hero) {
    return Response.json(
      { error: "Herói não encontrado." },
      { status: 404 },
    );
  }

  const lines = getHeroLines(hero.id);
  const translations = getCurrentTranslations(hero.id, lines);
  const { archive, requiredLineCount } = createVoicePackTemplate(
    { id: hero.id, name: hero.name },
    lines,
    translations,
  );
  const body = new Uint8Array(archive).buffer;

  return new Response(body, {
    headers: {
      "cache-control": "public, max-age=3600",
      "content-disposition": `attachment; filename="${hero.id}-voice-pack.zip"`,
      "content-length": String(archive.byteLength),
      "content-type": "application/zip",
      "x-voice-pack-lines": String(requiredLineCount),
    },
  });
}
