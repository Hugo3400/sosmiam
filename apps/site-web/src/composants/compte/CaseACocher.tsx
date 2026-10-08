import { use, type ReactNode } from "react";

import { ContexteFormulaire } from "~/composants/compte/FormulaireCompte";

type Props = {
  nom: string;
  /** Valeur envoyée quand la case est cochée */
  valeur?: string;
  /** Le libellé de la case (peut contenir un lien) */
  children: ReactNode;
};

/** Case à cocher d'un FormulaireCompte (« J'accepte les conditions d'utilisation »), avec son erreur reliée. */
export function CaseACocher({ nom, valeur = "oui", children }: Props) {
  const { prefixe, erreurs, valeurs, focusAuChargement } = use(ContexteFormulaire);
  const id = `${prefixe}-${nom}`;
  const erreur = erreurs[nom];
  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          name={nom}
          value={valeur}
          required
          defaultChecked={valeurs[nom] === valeur}
          autoFocus={focusAuChargement === nom}
          aria-invalid={Boolean(erreur)}
          aria-describedby={erreur ? `${id}-erreur` : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-encre"
        />
        <label htmlFor={id} className="cursor-pointer font-medium">{children}</label>
      </div>
      {erreur && <p id={`${id}-erreur`} className="mt-1.5 pl-8 text-sm font-semibold text-rouge-texte">{erreur}</p>}
    </div>
  );
}
