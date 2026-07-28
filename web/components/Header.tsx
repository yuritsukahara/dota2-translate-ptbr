"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";

type SteamUser = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

export function Header() {
  const [steamUser, setSteamUser] = useState<SteamUser | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" })
      .then((response) => response.json())
      .then((payload: { user?: SteamUser | null }) => {
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
        <Link href="/heroes">Heróis</Link>
        <Link href="/personas">Personas</Link>
        <Link href="/announcer">Narrador</Link>
        <Link href="/enviar">Packs de Voz</Link>
        <Link href="/peticao">Petição</Link>
        <Link href="/como-funciona">Projeto</Link>
        {authControl()}
      </nav>
      <details className="mobile-nav">
        <summary>Menu</summary>
        <nav aria-label="Navegação principal no celular">
          <Link href="/heroes">Heróis</Link>
          <Link href="/personas">Personas</Link>
          <Link href="/announcer">Narrador</Link>
          <Link href="/enviar">Packs de Voz</Link>
          <Link href="/peticao">Petição</Link>
          <Link href="/como-funciona">Projeto</Link>
          {authControl()}
        </nav>
      </details>
    </header>
  );
}
