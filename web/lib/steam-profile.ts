export type PublicSteamProfile = {
  personaname?: string;
  avatarfull?: string;
};

function readXmlValue(xml: string, tag: string) {
  const cdata = xml.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`));
  const plain = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return (cdata?.[1] || plain?.[1] || "")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .trim();
}

export async function fetchPublicSteamProfile(steamId: string): Promise<PublicSteamProfile | null> {
  try {
    const response = await fetch(`https://steamcommunity.com/profiles/${steamId}/?xml=1`, {
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) return null;
    const xml = await response.text();
    return {
      personaname: readXmlValue(xml, "steamID") || undefined,
      avatarfull: readXmlValue(xml, "avatarFull") || undefined,
    };
  } catch {
    return null;
  }
}
