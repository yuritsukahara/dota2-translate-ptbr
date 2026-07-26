import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <p>
        Projeto comunitário independente, sem vínculo, afiliação ou endosso da Valve.
        Dota 2, seu símbolo e seus assets originais pertencem à Valve e/ou licenciantes.
      </p>
      <div>
        <Link href="/creditos">Créditos</Link>
        <Link href="/como-funciona">Diretrizes</Link>
        <a href="https://github.com/yuritsukahara/dota2-translate-ptbr">GitHub</a>
      </div>
    </footer>
  );
}
