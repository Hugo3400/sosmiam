import type { ReactNode } from "react";

import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  nom: "tableauHonneur" | "majeur" | "reglesAcceptees";
  libelle: string;
  coche?: boolean;
  requise?: boolean;
  erreur?: string;
  children?: ReactNode;
};

export function CaseSignalement({ nom, libelle, coche, requise = false, erreur, children }: Props) {
  const idErreur = `signalement-${nom}-erreur`;
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 font-semibold">
        <input id={`signalement-${nom}`} name={nom} type="checkbox" value="oui" required={requise} defaultChecked={coche}
          aria-invalid={Boolean(erreur)} aria-describedby={erreur ? idErreur : undefined}
          className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer accent-encre focus:outline-3 focus:outline-offset-2 focus:outline-encre" />
        <span>{lierPonctuation(libelle)}</span>
      </label>
      {children}
      {erreur && <p id={idErreur} className="mt-1.5 text-sm font-semibold text-rouge-texte">{erreur}</p>}
    </div>
  );
}
