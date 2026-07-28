"use client";

import Image from "@/src/compat/image";
import { useCallback, useEffect, useState } from "react";
import { PetitionButton } from "@/components/PetitionButton";

type Signature = {
  id: string;
  name: string;
  avatar: string | null;
  steamId: string;
};

const copies = {
  "pt-BR": {
    languageLabel: "Idioma da petição",
    heroEyebrow: "CARTA ABERTA DA COMUNIDADE DOTA BRASIL",
    heroTitle: "Valve, o Brasil quer ouvir Dota 2 em português.",
    heroLead: "Nós já vivemos Dota em português: nas partidas, transmissões, campeonatos, piadas e amizades. Agora queremos ouvir os heróis que amamos com vozes brasileiras oficiais, direção profissional e o mesmo cuidado dado a cada personalidade.",
    verifiedPlayers: "jogadores autenticados pela Steam",
    initialGoal: "Meta inicial",
    letterEyebrow: "CARTA ABERTA",
    letterTitle: "O jogo já fala com o Brasil. Queremos ouvi-lo também.",
    letter: [
      "À equipe de Dota 2 na Valve,",
      "Há anos a comunidade brasileira transforma Dota em cultura. Narramos campeonatos, ensinamos novos jogadores, criamos conteúdo, lotamos transmissões e continuamos voltando para mais uma partida. Nosso idioma já faz parte dessa história.",
      "Uma opção oficial de áudio em português brasileiro tornaria o universo do jogo mais próximo, acessível e memorável. Não queremos apagar as vozes originais: queremos poder escolher uma interpretação brasileira feita com elenco profissional, direção consistente e respeito ao humor, à força e às particularidades de cada personagem.",
      "Por isso pedimos que a Valve avalie produzir um pacote oficial com as voicelines dos heróis e do narrador padrão em PT-BR. Este portal organiza a demanda, mede a participação e mostra que existe uma comunidade pronta para celebrar e apoiar esse trabalho.",
      "Este é um projeto independente. Não falamos em nome da Valve e não presumimos qualquer compromisso de implementação. Oferecemos esta carta e nossas assinaturas como um convite claro: escutem a comunidade que há tanto tempo mantém Dota vivo no Brasil.",
    ],
    closing: "Com paixão, respeito e uma vontade enorme de ouvir “Primeiro Sangue” do nosso jeito,",
    communityName: "Comunidade Dota 2 Brasil",
    communityEyebrow: "A COMUNIDADE ESTÁ AQUI",
    communityTitle: "Quem já assinou",
    communityNote: "Ao assinar, seu nome e avatar públicos da Steam aparecem nesta lista.",
    empty: "Seja a primeira pessoa a assinar.",
    avatarAlt: "Avatar de",
  },
  en: {
    languageLabel: "Petition language",
    heroEyebrow: "AN OPEN LETTER FROM BRAZIL'S DOTA COMMUNITY",
    heroTitle: "Valve, Brazil wants to hear Dota 2 in Portuguese.",
    heroLead: "We already live Dota in Portuguese: in matches, broadcasts, tournaments, jokes, and friendships. Now we want to hear the heroes we love with official Brazilian voices, professional direction, and the same care given to every personality.",
    verifiedPlayers: "players authenticated through Steam",
    initialGoal: "Initial goal",
    letterEyebrow: "OPEN LETTER",
    letterTitle: "The game already speaks to Brazil. We want to hear it, too.",
    letter: [
      "To the Dota 2 team at Valve,",
      "For years, the Brazilian community has turned Dota into culture. We cast tournaments, teach new players, create content, fill broadcasts, and keep coming back for one more match. Our language is already part of this story.",
      "An official Brazilian Portuguese audio option would make the game's universe more welcoming, accessible, and memorable. We do not want to erase the original voices: we want the choice of a Brazilian interpretation made with a professional cast, consistent direction, and respect for each character's humor, strength, and personality.",
      "We ask Valve to consider producing an official PT-BR voice pack for Dota 2's heroes and default announcer. This portal organizes that demand, measures participation, and shows that a community is ready to celebrate and support this work.",
      "This is an independent project. We do not speak for Valve or presume any commitment to implementation. We offer this letter and our signatures as a clear invitation: please listen to the community that has kept Dota alive in Brazil for so long.",
    ],
    closing: "With passion, respect, and an enormous wish to hear “First Blood” in our own language,",
    communityName: "Brazilian Dota 2 Community",
    communityEyebrow: "THE COMMUNITY IS HERE",
    communityTitle: "Who has signed",
    communityNote: "When you sign, your public Steam name and avatar appear in this list.",
    empty: "Be the first person to sign.",
    avatarAlt: "Avatar for",
  },
} as const;

export function PetitionPageContent({
}: Record<string, never>) {
  const [language, setLanguage] = useState<keyof typeof copies>("pt-BR");
  const [total, setTotal] = useState(0);
  const [recent, setRecent] = useState<Signature[]>([]);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const loadPetition = useCallback(async () => {
    const response = await fetch("/api/petition", {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!response.ok) return;
    const payload = await response.json() as {
      total: number;
      recent: Signature[];
      alreadySigned: boolean;
    };
    setTotal(payload.total);
    setRecent(payload.recent);
    setAlreadySigned(payload.alreadySigned);
  }, []);

  useEffect(() => {
    let active = true;
    void fetch("/api/petition", {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (response) => response.ok ? await response.json() as {
        total: number;
        recent: Signature[];
        alreadySigned: boolean;
      } : null)
      .then((payload) => {
        if (!active || !payload) return;
        setTotal(payload.total);
        setRecent(payload.recent);
        setAlreadySigned(payload.alreadySigned);
      });
    return () => {
      active = false;
    };
  }, []);
  const copy = copies[language];
  const locale = language === "pt-BR" ? "pt-BR" : "en-US";

  return (
    <main lang={language}>
      <div className="petition-language" aria-label={copy.languageLabel}>
        <span>{copy.languageLabel}</span>
        <div>
          <button type="button" className={language === "pt-BR" ? "active" : ""} onClick={() => setLanguage("pt-BR")}>PT-BR</button>
          <button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>EN</button>
        </div>
      </div>

      <section className="petition-hero">
        <div>
          <p className="eyebrow">{copy.heroEyebrow}</p>
          <h1>{copy.heroTitle}</h1>
          <p className="petition-lead">{copy.heroLead}</p>
          <PetitionButton
            alreadySigned={alreadySigned}
            language={language}
            onSigned={loadPetition}
          />
        </div>
        <aside className="petition-counter">
          <strong>{total.toLocaleString(locale)}</strong>
          <span>{copy.verifiedPlayers}</span>
          <p>{copy.initialGoal}</p>
          <b>{(10_000).toLocaleString(locale)}</b>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, total / 100)}%` }} /></div>
        </aside>
      </section>

      <section className="section petition-letter">
        <p className="eyebrow">{copy.letterEyebrow}</p>
        <h2>{copy.letterTitle}</h2>
        <div>
          {copy.letter.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <p>{copy.closing}<br /><strong>{copy.communityName}</strong></p>
        </div>
      </section>

      <section className="section section-dark petition-community">
        <div className="section-heading">
          <div><p className="eyebrow">{copy.communityEyebrow}</p><h2>{copy.communityTitle}</h2></div>
          <p>{copy.communityNote}</p>
        </div>
        <div className="signature-grid">
          {recent.length ? recent.map((signature) => (
            <article key={signature.id}>
              {signature.avatar ? (
                <Image
                  src={signature.avatar}
                  alt={`${copy.avatarAlt} ${signature.name}`}
                  width={52}
                  height={52}
                  unoptimized
                />
              ) : <span aria-hidden="true">BR</span>}
              <div>
                <strong>{signature.name}</strong>
                <small>Steam ID {signature.steamId}</small>
              </div>
            </article>
          )) : <div className="empty-card">{copy.empty}</div>}
        </div>
      </section>
    </main>
  );
}
