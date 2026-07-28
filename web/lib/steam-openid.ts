function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function randomToken(bytes = 32) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return base64Url(value);
}

export function safeReturnPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/";
  }
  const parsed = new URL(value, "http://local.invalid");
  if (parsed.origin !== "http://local.invalid" || parsed.pathname.startsWith("/api/auth/")) {
    return "/";
  }
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
