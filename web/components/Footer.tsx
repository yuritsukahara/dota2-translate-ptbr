import Image from "@/src/compat/image";
import Link from "@/src/compat/link";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-brandline">
          <a
            className="footer-tango-link"
            href="https://tangoleague.gg"
            target="_blank"
            rel="noreferrer"
            aria-label="Visitar o site da Tango League"
          >
            <Image
              className="footer-tango-logo"
              src="/logos/tangoleague-logo-text-black.png"
              alt="Tango League"
              width={1242}
              height={441}
              unoptimized
            />
          </a>
          <p>
            Projeto comunitário independente, sem vínculo, afiliação ou endosso da Valve.
            Dota 2, seu símbolo e seus assets originais pertencem à Valve e/ou licenciantes.
          </p>
        </div>
        <nav className="footer-links" aria-label="Links do rodapé">
          <Link href="/creditos">Créditos</Link>
          <Link href="/como-funciona">Diretrizes</Link>
          <a href="https://github.com/yuritsukahara/dota2-translate-ptbr">GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
