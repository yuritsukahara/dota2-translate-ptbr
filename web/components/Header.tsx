import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Dublagem Brasileira Dota 2 — início">
        <span className="brand-emblem">
          <img src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/global/dota2_logo_symbol.png" alt="" />
        </span>
        <span>Dublagem Brasileira Dota 2<small>VOZES DA COMUNIDADE EM PT-BR</small></span>
      </Link>
      <nav className="main-nav" aria-label="Navegação principal">
        <Link href="/heroes">Heróis</Link>
        <Link href="/heroes/announcer">Narrador</Link>
        <Link href="/enviar">Packs de Voz</Link>
        <Link href="/peticao">Petição</Link>
        <Link href="/como-funciona">Projeto</Link>
        <a className="login-link" href="/api/auth/steam/start">Entrar com Steam</a>
      </nav>
      <span className="mobile-menu">MENU</span>
    </header>
  );
}
