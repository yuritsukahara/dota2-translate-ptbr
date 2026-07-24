import { cookie } from "@/lib/cookies";
import { pkceChallenge, randomToken } from "@/lib/oauth";
import { runtimeEnv } from "@/lib/runtime-env";

export async function GET() {
  const clientId = runtimeEnv.DISCORD_CLIENT_ID;
  const redirectUri = runtimeEnv.DISCORD_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return Response.redirect(new URL("/enviar?auth=indisponivel", runtimeEnv.PUBLIC_SITE_URL || "http://localhost:3000"));
  }
  const state = randomToken();
  const verifier = randomToken(48);
  const challenge = await pkceChallenge(verifier);
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "identify email");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  const headers = new Headers({ location: url.toString() });
  headers.append("set-cookie", cookie("dt_oauth_state", state, 600));
  headers.append("set-cookie", cookie("dt_oauth_verifier", verifier, 600));
  return new Response(null, { status: 302, headers });
}
