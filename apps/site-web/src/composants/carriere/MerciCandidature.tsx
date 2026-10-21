import { useEffect, useRef } from "react";

import type { OffreCarriere } from "../../../../../packages/commun/src/types/carriere.ts";
import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export function MerciCandidature({ offre, message }: { offre: OffreCarriere; message: string }) {
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
          {lierPonctuation("Merci, c'est envoyé !")}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-lg">
          {lierPonctuation(`Ta candidature pour « ${offre.titre} » est bien arrivée. ${message}`)}
        </p>
        <p className="mx-auto mt-4 max-w-lg text-sm">
          {lierPonctuation("Elle est gardée 6 mois, puis effacée. En attendant, la Brigade te fait un grand salut.")}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Bouton vers="/carriere" variante="encre">Voir les autres offres</Bouton>
          <Bouton vers="/" variante="blanc">Retour à l'accueil</Bouton>
        </div>
      </div>
    </section>
  );
}
