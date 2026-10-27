import { useEffect, useRef } from "react";

import type { OffreCarriere } from "../../../../../packages/commun/src/types/carriere.ts";
import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { TEXTES_OFFRE_CARRIERE_PAR_LANGUE } from "~/contenus/carriere";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function MerciCandidature({ offre, message }: { offre: OffreCarriere; message: string }) {
  const T = utiliserTextes(TEXTES_OFFRE_CARRIERE_PAR_LANGUE).merci;
  const lien = utiliserLienLangue();
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
          {lierPonctuation(T.titre)}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-lg">
          {lierPonctuation(`${T.arrivee(offre.titre)} ${message}`)}
        </p>
        <p className="mx-auto mt-4 max-w-lg text-sm">
          {lierPonctuation(T.conservation)}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Bouton vers={lien("/carriere")} variante="encre">{T.voirAutres}</Bouton>
          <Bouton vers={lien("/")} variante="blanc">{T.retourAccueil}</Bouton>
        </div>
      </div>
    </section>
  );
}
