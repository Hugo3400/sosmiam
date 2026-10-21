import { useEffect, useRef } from "react";

import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { merciSignalement } from "~/contenus/securite";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export function MerciSignalement() {
  const titre = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titre.current?.focus();
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <section className="bg-creme py-16 md:py-24">
      <div className="mx-auto w-[min(760px,100%-32px)] rounded-carte border-2 border-encre bg-jaune px-6 py-10 text-center shadow-brut-grand md:px-12">
        <Mascotte expression="clin" className="mx-auto mb-5 h-28 w-28" />
        <h1 ref={titre} tabIndex={-1} className="text-[clamp(2rem,5vw,2.8rem)] font-extrabold tracking-tight">
          {lierPonctuation(merciSignalement.titre)}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-lg">{lierPonctuation(merciSignalement.texte)}</p>
        <p className="mx-auto mt-3 max-w-lg text-lg font-semibold">{lierPonctuation(merciSignalement.secret)}</p>
        <p className="mx-auto mt-4 max-w-lg text-sm">{lierPonctuation(merciSignalement.salut)}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Bouton href="/securite#tableau-d-honneur" variante="encre">Voir le tableau d'honneur</Bouton>
          <Bouton vers="/" variante="blanc">Retour à l'accueil</Bouton>
        </div>
      </div>
    </section>
  );
}
