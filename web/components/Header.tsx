"use client";

import Image from "@/src/compat/image";
import Link from "@/src/compat/link";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { usePathname } from "@/src/compat/navigation";

type SteamUser = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

export function Header() {
  const pathname = usePathname();
  const [steamUser, setSteamUser] = useState<SteamUser | null | undefined>(undefined);

  function navProps(section: string) {
    const active =
      pathname === section ||
      pathname.startsWith(`${section}/`) ||
      (section === "/enviar" && pathname.startsWith("/packs/"));
    return {
      className: active ? "active" : undefined,
      "aria-current": active ? ("page" as const) : undefined,
    };
  }

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) =>
        await response.json() as { user?: SteamUser | null },
      )
      .then((payload) => {
        if (active) setSteamUser(payload.user || null);
      })
      .catch(() => {
        if (active) setSteamUser(null);
      });
    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    if (response.ok) setSteamUser(null);
  }

  function authControl() {
    if (steamUser === undefined) {
      return <span className="auth-loading">Verificando Steam…</span>;
    }
    if (!steamUser) {
      return <a className="login-link" href="/api/auth/steam/start">Entrar com Steam</a>;
    }
    return (
      <div className="auth-control">
        <Link className="auth-profile" href={`/perfil/${steamUser.id}`}>
          {steamUser.avatarUrl ? (
            <Image
              src={steamUser.avatarUrl}
              alt=""
              width={30}
              height={30}
              unoptimized
            />
          ) : <span aria-hidden="true">BR</span>}
          <span>
            <strong>{steamUser.displayName}</strong>
            <small>Steam conectada</small>
          </span>
        </Link>
        <button className="auth-logout" type="button" onClick={logout}>Sair</button>
      </div>
    );
  }

  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Dublagem Brasileira Dota 2 — início">
        <span className="brand-emblem">
          <BrandMark />
        </span>
        <span>Dublagem Brasileira Dota 2<small>VOZES DA COMUNIDADE EM PT-BR</small></span>
      </Link>
      <nav className="main-nav" aria-label="Navegação principal">
        <Link href="/heroes" {...navProps("/heroes")}>Heróis</Link>
        <Link href="/personas" {...navProps("/personas")}>Personas</Link>
        <Link href="/announcer" {...navProps("/announcer")}>Narrador</Link>
        <Link href="/enviar" {...navProps("/enviar")}>Packs de Voz</Link>
        <Link href="/peticao" {...navProps("/peticao")}>Petição</Link>
        <Link href="/como-funciona" {...navProps("/como-funciona")}>Projeto</Link>
        {authControl()}
      </nav>
      <details className="mobile-nav">
        <summary>Menu</summary>
        <nav aria-label="Navegação principal no celular">
          <Link href="/heroes" {...navProps("/heroes")}>Heróis</Link>
          <Link href="/personas" {...navProps("/personas")}>Personas</Link>
          <Link href="/announcer" {...navProps("/announcer")}>Narrador</Link>
          <Link href="/enviar" {...navProps("/enviar")}>Packs de Voz</Link>
          <Link href="/peticao" {...navProps("/peticao")}>Petição</Link>
          <Link href="/como-funciona" {...navProps("/como-funciona")}>Projeto</Link>
          {authControl()}
        </nav>
      </details>
    </header>
  );
}
