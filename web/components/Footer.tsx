import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <p>
          Projeto comunitário independente, sem vínculo, afiliação ou endosso da Valve.
          Dota 2, seu símbolo e seus assets originais pertencem à Valve e/ou licenciantes.
        </p>
        <nav className="footer-links" aria-label="Links do rodapé">
          <Link href="/creditos">Créditos</Link>
          <Link href="/como-funciona">Diretrizes</Link>
          <a href="https://github.com/yuritsukahara/dota2-translate-ptbr">GitHub</a>
        </nav>
      </div>
      <Image
        className="footer-tango-logo"
        src="/logos/tangoleague-logo-text-black.png"
        alt="Tango League"
        width={1242}
        height={441}
        unoptimized
      />
    </footer>
  );
}
