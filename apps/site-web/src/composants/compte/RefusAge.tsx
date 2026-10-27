import { useEffect, useRef } from "react";

import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { TEXTES_INSCRIPTION_COMPTE_PAR_LANGUE } from "~/contenus/inscription-compte";
import { site } from "~/contenus/legal/informations-legales";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Inscription refusée parce que la personne a moins de 18 ans : rien n'a été gardé ; la newsletter reste ouverte. */
export function RefusAge() {
  const T = utiliserTextes(TEXTES_INSCRIPTION_COMPTE_PAR_LANGUE).refusAge;
  const lien = utiliserLienLangue();
  const titre = useRef<HTMLHeadingElement>(null);
  // Le formulaire disparaît : le focus passe au message, que les lecteurs d'écran lisent aussitôt
  useEffect(() => titre.current?.focus(), []);
  return (
    <div className="rounded-carte border-2 border-encre bg-jaune px-6 py-10 text-center shadow-brut-grand md:px-12">
      <Mascotte expression="clin" className="mx-auto mb-5 h-24 w-24" />
      <h2 ref={titre} tabIndex={-1} className="text-3xl font-extrabold">{lierPonctuation(T.titre)}</h2>
      <p className="mx-auto mt-3 max-w-lg text-lg">
        {lierPonctuation(T.rienGarde)}
      </p>
      <p className="mx-auto mt-3 max-w-lg text-lg">
        {lierPonctuation(T.enAttendant)}
      </p>
      <Bouton href={`https://${site.adresse}${lien("/#inscription")}`} variante="encre" className="mt-7">{T.bouton}</Bouton>
    </div>
  );
}
