import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  const bindings = env as unknown as { DB: D1Database };
  if (!bindings.DB) {
    throw new Error(
      "O banco local `DB` não está disponível. Inicie o projeto com `npm run dev` na pasta web."
    );
  }

  return drizzle(bindings.DB, { schema });
}
