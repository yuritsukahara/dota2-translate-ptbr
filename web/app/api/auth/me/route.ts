import { currentUser } from "@/lib/auth";

export async function GET(request: Request) {
  return Response.json(
    { user: await currentUser(request) },
    { headers: { "cache-control": "no-store, max-age=0" } },
  );
}
