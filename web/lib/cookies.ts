export function parseCookies(header: string | null) {
  const result = new Map<string, string>();
  for (const pair of (header || "").split(";")) {
    const [key, ...rest] = pair.trim().split("=");
    if (key) result.set(key, decodeURIComponent(rest.join("=")));
  }
  return result;
}

export function cookie(name: string, value: string, maxAge: number, secure = true) {
  const secureAttribute = secure ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly${secureAttribute}; SameSite=Lax; Max-Age=${maxAge}`;
}
