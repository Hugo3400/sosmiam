import { useEffect, useRef } from "react";

import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { ANCRE_TABLEAU_HONNEUR, type TextesSecurite } from "~/contenus/securite";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";

export function MerciSignalement({ textes }: { textes: TextesSecurite["merci"] }) {
  const titre = useRef<HTMLHeadingElement>(null);
  const lien = utiliserLienLangue();

  useEffect(() => {
    titre.current?.focus();
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <section className="bg-creme py-16 md:py-24">
      <div className="mx-auto w-[min(760px,100%-32px)] rounded-carte border-2 border-encre bg-jaune px-6 py-10 text-center shadow-brut-grand md:px-12">
        <Mascotte expression="clin" className="mx-auto mb-5 h-28 w-28" />
        <h1 ref={titre} tabIndex={-1} className="text-[clamp(2rem,5vw,2.8rem)] font-extrabold tracking-tight">
          {lierPonctuation(textes.titre)}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-lg">{lierPonctuation(textes.texte)}</p>
        <p className="mx-auto mt-3 max-w-lg text-lg font-semibold">{lierPonctuation(textes.secret)}</p>
        <p className="mx-auto mt-4 max-w-lg text-sm">{lierPonctuation(textes.salut)}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Bouton href={lien(`/securite#${ANCRE_TABLEAU_HONNEUR}`)} variante="encre">{textes.voirTableau}</Bouton>
          <Bouton vers={lien("/")} variante="blanc">{textes.retourAccueil}</Bouton>
        </div>
      </div>
    </section>
  );
}
