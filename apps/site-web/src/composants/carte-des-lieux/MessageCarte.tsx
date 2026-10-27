import { Link } from "react-router";

import { TEXTES_CARTE_DES_LIEUX_PAR_LANGUE } from "~/contenus/carte-des-lieux";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export type EtatCarte = "attente" | "chargement" | "prete" | "sans-webgl" | "erreur";

type Props = { etat: EtatCarte; lienListe?: string };

export function MessageCarte({ etat, lienListe }: Props) {
  const T = utiliserTextes(TEXTES_CARTE_DES_LIEUX_PAR_LANGUE);
  const message = etat === "sans-webgl" ? T.etats.sansWebgl : etat === "erreur" ? T.etats.erreur : etat === "chargement" ? T.etats.chargement : null;
  const lien = lienListe ? (
    <Link to={lienListe} className="font-bold underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-encre">
      {T.voirListe}
    </Link>
  ) : null;
  return (
    <div className="absolute inset-0 grid place-items-center p-6 text-center">
      <noscript>
        <div className="flex max-w-sm flex-col items-center gap-3 rounded-carte border-2 border-encre bg-white px-5 py-4 shadow-brut-petit">
          <p>{lierPonctuation(T.etats.sansJavascript)}</p>
          {lien}
        </div>
      </noscript>
      {message && (
        <div role="status" className="flex max-w-sm flex-col items-center gap-3 rounded-carte border-2 border-encre bg-white px-5 py-4 shadow-brut-petit">
          <p>{lierPonctuation(message)}</p>
          {etat !== "chargement" && lien}
        </div>
      )}
    </div>
  );
}
