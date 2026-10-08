import { useEffect, useRef } from "react";

import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Inscription refusée parce que la personne a moins de 18 ans : rien n'a été gardé ; la newsletter reste ouverte. */
export function RefusAge() {
  const titre = useRef<HTMLHeadingElement>(null);
  // Le formulaire disparaît : le focus passe au message, que les lecteurs d'écran lisent aussitôt
  useEffect(() => titre.current?.focus(), []);
  return (
    <div className="rounded-carte border-2 border-encre bg-jaune px-6 py-10 text-center shadow-brut-grand md:px-12">
      <Mascotte expression="clin" className="mx-auto mb-5 h-24 w-24" />
      <h2 ref={titre} tabIndex={-1} className="text-3xl font-extrabold">{lierPonctuation("Encore un peu de patience !")}</h2>
      <p className="mx-auto mt-3 max-w-lg text-lg">
        {lierPonctuation("Le programme Ambassadeurs, c'est dès 18 ans. On n'a rien gardé : ni ton e-mail, ni ta date de naissance.")}
      </p>
      <p className="mx-auto mt-3 max-w-lg text-lg">
        {lierPonctuation("En attendant, tu peux suivre l'aventure SOS Miam avec la newsletter. Et pour tes 18 ans, on t'attend !")}
      </p>
      <Bouton href="https://sosmiam.fr/#inscription" variante="encre" className="mt-7">Je m'inscris à la newsletter</Bouton>
    </div>
  );
}
