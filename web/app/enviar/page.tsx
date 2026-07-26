import { Header } from "@/components/Header";
import Link from "next/link";

export const metadata = { title: "Audições" };

export default function SubmitPage() {
  return (
    <>
      <Header />
      <main className="page-shell">
        <div className="page-intro">
          <div><p className="eyebrow">ELENCO DA COMUNIDADE</p><h1 className="page-title">Dê voz a um herói</h1></div>
          <p>Escolha um herói e grave uma prévia com exatamente cinco falas oficiais em PT-BR. A comunidade escolhe um intérprete para produzir o pack inteiro.</p>
        </div>
        <section className="casting-panel">
          <p className="eyebrow">REGRA DO PACK</p>
          <h2>Uma voz, um herói, um pack completo</h2>
          <p>As falas de um herói não serão misturadas entre autores. Curtidas, desaprovações, comentários e votos ajudam a escolher o intérprete; a seleção final abre o envio das falas restantes apenas para o vencedor.</p>
          <div className="casting-flow">
            <span>01 · escolha o herói</span>
            <span>02 · envie 5 prévias</span>
            <span>03 · votação pública</span>
            <span>04 · complete o pack</span>
          </div>
          <Link className="button button-primary" href="/heroes">Escolher um herói</Link>
        </section>
      </main>
    </>
  );
}
