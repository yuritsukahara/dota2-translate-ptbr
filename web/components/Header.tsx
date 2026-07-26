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
        <Link href="/captions">Traduções</Link>
        <Link href="/captions?heroi=announcer">Narrador</Link>
        <Link href="/enviar">Audições</Link>
        <Link href="/peticao">Petição</Link>
        <Link href="/como-funciona">Projeto</Link>
        <Link href="/releases">Instalar</Link>
        <a className="login-link" href="/api/auth/steam/start">Entrar com Steam</a>
      </nav>
      <span className="mobile-menu">MENU</span>
    </header>
  );
}
