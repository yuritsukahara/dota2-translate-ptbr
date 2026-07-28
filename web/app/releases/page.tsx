import Link from "@/src/compat/link";
import release from "@/data/installer-release.json";

export const metadata = {
  title: "Baixar o instalador",
  description:
    "Instalador Windows da Dublagem Brasileira Dota 2, com captions PT-BR e pack-exemplo do Axe.",
};

const downloadUrl =
  "https://github.com/yuritsukahara/dota2-translate-ptbr/releases/download/" +
  "installer-channel-stable/DublagemBrasileiraDota2.exe";

export default function ReleasesPage() {
  const voiceLines = release.voicePacks.reduce(
    (total, pack) => total + pack.lines,
    0,
  );

  return (
    <main className="page-shell release-page">
      <section className="release-hero">
        <div>
          <p className="eyebrow">INSTALADOR WINDOWS · VERSÃO {release.version}</p>
          <h1 className="page-title">As legendas do projeto no seu Dota.</h1>
          <p className="release-lead">
            Um único executável encontra a sua instalação, baixa o pacote
            verificado pelo GitHub, cria o backup e aplica a camada brasileira.
          </p>
          <div className="release-actions">
            <a className="button button-primary" href={downloadUrl}>
              Baixar para Windows
            </a>
            <a
              className="button button-ghost"
              href="https://github.com/yuritsukahara/dota2-translate-ptbr/releases/tag/installer-channel-stable"
            >
              Ver no GitHub
            </a>
          </div>
          <p className="release-requirements">
            Windows 10/11 · x64 · download sob demanda · backup antes da instalação
          </p>
          <p className="release-requirements">
            Para compartilhar, envie somente o arquivo{" "}
            <strong>DublagemBrasileiraDota2.exe</strong>. A pasta{" "}
            <code>bin/Debug</code> existe apenas para desenvolvimento.
          </p>
        </div>

        <aside className="release-summary" aria-label="Conteúdo da versão">
          <span className="release-version">BUILD {release.dotaBuild.clientVersion}</span>
          <dl>
            <div>
              <dt>{release.captions.tokens.toLocaleString("pt-BR")}</dt>
              <dd>captions PT-BR empacotadas</dd>
            </div>
            <div>
              <dt>{release.captions.files}</dt>
              <dd>arquivos de legenda</dd>
            </div>
            <div>
              <dt>{voiceLines}</dt>
              <dd>vozes no pack-exemplo</dd>
            </div>
          </dl>
          <small>
            Pacote de dados: {(release.payload.bytes / 1024 / 1024).toFixed(1)} MB,
            baixado apenas durante a instalação.
          </small>
        </aside>
      </section>

      <section className="release-section">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">VOCÊ ESCOLHE NO INSTALADOR</p>
            <h2>Duas formas de testar.</h2>
          </div>
          <p>
            As duas opções usam exatamente o mesmo catálogo PT-BR e podem ser
            reparadas, atualizadas ou restauradas pelo aplicativo.
          </p>
        </div>
        <div className="release-mode-grid">
          <article>
            <span>01</span>
            <h3>Somente legendas</h3>
            <p>
              Instala todas as captions PT-BR do projeto sem substituir
              nenhuma voz do jogo.
            </p>
            <strong>Opção padrão</strong>
          </article>
          <article>
            <span>02</span>
            <h3>Legendas + Axe</h3>
            <p>
              Instala o mesmo catálogo de legendas e inclui as 243 falas do
              pack-exemplo brasileiro do Axe.
            </p>
            <strong>Prévia de voz</strong>
          </article>
        </div>
      </section>

      <section className="release-notice">
        <div>
          <p className="eyebrow">PONTOS IMPORTANTES</p>
          <h2>Uma camada de idioma comunitária e reversível.</h2>
        </div>
        <div>
          <p>
            O instalador segue a via de camada de idioma já utilizada pelo Dota
            para pacotes adicionais de linguagem. Ele não altera mecânicas,
            executáveis, DLLs nem o <code>pak01_dir.vpk</code> base.
          </p>
          <p>
            Como é uma iniciativa comunitária, uma atualização do jogo pode
            exigir o reparo ou a reinstalação da camada. O instalador cria um
            backup antes de começar e oferece restauração.
          </p>
        </div>
      </section>

      <section className="release-section">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">PASSO A PASSO</p>
            <h2>O que o executável faz.</h2>
          </div>
        </div>
        <ol className="release-flow">
          <li><span>01</span><strong>Localiza</strong><p>Procura o Dota em todas as bibliotecas Steam.</p></li>
          <li><span>02</span><strong>Verifica</strong><p>Confirma a instalação e consulta a versão estável no GitHub.</p></li>
          <li><span>03</span><strong>Protege</strong><p>Cria uma cópia integral da camada e do idioma anterior.</p></li>
          <li><span>04</span><strong>Instala</strong><p>Valida SHA-256 e aplica somente a opção escolhida.</p></li>
        </ol>
      </section>

      <section className="release-final">
        <div>
          <p className="eyebrow">CÓDIGO ABERTO</p>
          <h2>Confira antes de instalar.</h2>
          <p>
            O código do instalador, o formato do manifesto e os hashes do pacote
            estão disponíveis no GitHub do projeto.
          </p>
        </div>
        <div className="release-actions">
          <a className="button button-primary" href={downloadUrl}>
            Baixar instalador
          </a>
          <Link className="button button-ghost" href="/como-funciona">
            Entender o projeto
          </Link>
        </div>
      </section>
    </main>
  );
}
