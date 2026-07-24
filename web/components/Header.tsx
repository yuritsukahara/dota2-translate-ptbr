import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Dota 2 Translate PT-BR — início">
        <span className="brand-emblem"><span>BR</span></span>
        <span>Dota 2 Translate<small>VOZES EM PORTUGUÊS BRASILEIRO</small></span>
      </Link>
      <nav className="main-nav" aria-label="Navegação principal">
        <Link href="/heroes">Heróis</Link>
        <Link href="/enviar">Contribuir</Link>
        <Link href="/releases">Instalar</Link>
        <Link href="/moderacao">Moderação</Link>
        <a className="login-link" href="/api/auth/discord/start">Entrar com Discord</a>
      </nav>
      <span className="mobile-menu">MENU</span>
    </header>
  );
}
