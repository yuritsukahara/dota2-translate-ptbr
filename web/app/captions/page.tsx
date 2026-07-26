import { redirect } from "next/navigation";

export default async function CaptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ heroi?: string }>;
}) {
  const requestedHero = (await searchParams).heroi;
  redirect(requestedHero ? `/heroes/${requestedHero}` : "/heroes");
}
