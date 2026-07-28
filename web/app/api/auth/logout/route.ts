import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions } from "@/db/schema";
import { cookie, parseCookies } from "@/lib/cookies";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(request: Request) {
  assertSameOrigin(request);
  const sessionId = parseCookies(request.headers.get("cookie")).get("dt_session");
  if (sessionId) await getDb().delete(sessions).where(eq(sessions.id, sessionId));
  return new Response(null, {
    status: 204,
    headers: {
      "set-cookie": cookie("dt_session", "", 0, new URL(request.url).protocol === "https:"),
    },
  });
}
