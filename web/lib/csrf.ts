export function assertSameOrigin(request: Request) {
  const expected = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (origin !== expected || (fetchSite && !["same-origin", "same-site"].includes(fetchSite))) {
    throw new Response(JSON.stringify({ error: "Origem da requisição inválida." }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }
}
