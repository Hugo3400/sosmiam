import { useEffect, useRef } from "react";

import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { TEXTES_SIGNALER_IMAGE_PAR_LANGUE } from "~/contenus/signaler-image";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function MerciSignalerImage({ lieuId, nom }: { lieuId: number; nom: string }) {
  const T = utiliserTextes(TEXTES_SIGNALER_IMAGE_PAR_LANGUE).merci;
  const titre = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titre.current?.focus();
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <section className="bg-creme py-14 md:py-20">
      <div className="mx-auto flex w-[min(640px,100%-32px)] flex-col items-center gap-4 rounded-carte border-2 border-encre bg-white px-6 py-10 text-center shadow-brut md:px-12">
        <Mascotte expression="miam" className="h-24 w-24" />
        <h1 ref={titre} tabIndex={-1} className="text-[clamp(1.9rem,5vw,2.6rem)] font-extrabold tracking-tight focus:outline-none">
          {lierPonctuation(T.titre)}
        </h1>
        <p className="max-w-md text-lg">{lierPonctuation(T.texte)}</p>
        <Bouton vers={`/lieux/${lieuId}`} className="mt-3">
          {T.retour}
          <span className="sr-only">{T.retourDe(nom)}</span>
        </Bouton>
      </div>
    </section>
  );
}
