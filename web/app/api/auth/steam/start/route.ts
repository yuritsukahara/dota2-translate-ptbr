import { cookie } from "@/lib/cookies";
import { randomToken } from "@/lib/oauth";
import { runtimeEnv } from "@/lib/runtime-env";

export async function GET(request: Request) {
  const base = runtimeEnv.PUBLIC_SITE_URL || new URL(request.url).origin;
  const state = randomToken(32);
  const callback = new URL("/api/auth/steam/callback", base);
  callback.searchParams.set("state", state);
  const provider = new URL("https://steamcommunity.com/openid/login");
  provider.searchParams.set("openid.ns", "http://specs.openid.net/auth/2.0");
  provider.searchParams.set("openid.mode", "checkid_setup");
  provider.searchParams.set("openid.return_to", callback.toString());
  provider.searchParams.set("openid.realm", new URL(base).origin);
  provider.searchParams.set("openid.identity", "http://specs.openid.net/auth/2.0/identifier_select");
  provider.searchParams.set("openid.claimed_id", "http://specs.openid.net/auth/2.0/identifier_select");
  const headers = new Headers({ location: provider.toString() });
  headers.append("set-cookie", cookie("dt_steam_state", state, 600));
  return new Response(null, { status: 302, headers });
}
