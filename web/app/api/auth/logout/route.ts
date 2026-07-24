import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions } from "@/db/schema";
import { cookie, parseCookies } from "@/lib/cookies";

export async function POST(request: Request) {
  const sessionId = parseCookies(request.headers.get("cookie")).get("dt_session");
  if (sessionId) await getDb().delete(sessions).where(eq(sessions.id, sessionId));
  return new Response(null, { status: 204, headers: { "set-cookie": cookie("dt_session", "", 0) } });
}
