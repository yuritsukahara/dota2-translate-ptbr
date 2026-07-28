import { lazy, Suspense } from "react";
import { Footer } from "@/components/Footer";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { Header } from "@/components/Header";
import { PageLoadingSkeleton } from "@/components/LoadingSkeleton";
import { usePathname } from "@/src/compat/navigation";

const Home = lazy(() => import("@/app/page"));
const HeroesPage = lazy(() => import("@/app/heroes/page"));
const HeroPage = lazy(() => import("@/app/heroes/[id]/page"));
const PersonasPage = lazy(() => import("@/app/personas/page"));
const PersonaPage = lazy(() => import("@/app/personas/[id]/page"));
const AnnouncerPage = lazy(() => import("@/app/announcer/page"));
const VoicePacksPage = lazy(() => import("@/app/enviar/page"));
const VoicePackPage = lazy(() => import("@/app/packs/[hero]/page"));
const PetitionPage = lazy(() => import("@/app/peticao/page"));
const ProfilePage = lazy(() => import("@/app/perfil/[id]/page"));
const ProjectPage = lazy(() => import("@/app/como-funciona/page"));
const CreditsPage = lazy(() => import("@/app/creditos/page"));
const ReleasesPage = lazy(() => import("@/app/releases/page"));

function NotFoundPage() {
  return (
    <main className="page-shell">
      <div className="page-intro">
        <div>
          <p className="eyebrow">404</p>
          <h1 className="page-title">Página não encontrada</h1>
        </div>
      </div>
    </main>
  );
}

export function App() {
  const pathname = usePathname();
  let page;
  if (pathname === "/") page = <Home />;
  else if (pathname === "/heroes") page = <HeroesPage />;
  else if (pathname.startsWith("/heroes/")) page = <HeroPage />;
  else if (pathname === "/personas") page = <PersonasPage />;
  else if (pathname.startsWith("/personas/")) page = <PersonaPage />;
  else if (pathname === "/announcer") page = <AnnouncerPage />;
  else if (pathname === "/enviar") page = <VoicePacksPage />;
  else if (pathname.startsWith("/packs/")) page = <VoicePackPage />;
  else if (pathname === "/peticao") page = <PetitionPage />;
  else if (pathname.startsWith("/perfil/")) page = <ProfilePage />;
  else if (pathname === "/como-funciona") page = <ProjectPage />;
  else if (pathname === "/creditos") page = <CreditsPage />;
  else if (pathname === "/releases") page = <ReleasesPage />;
  else page = <NotFoundPage />;

  return (
    <>
      <Header />
      <Suspense fallback={<PageLoadingSkeleton />}>
        {page}
      </Suspense>
      <Footer />
      <GoogleAnalytics
        measurementId={import.meta.env.VITE_GA_MEASUREMENT_ID || "G-XJESRK7NV7"}
      />
    </>
  );
}
