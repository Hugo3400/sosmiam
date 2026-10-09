import { use, type ReactNode } from "react";

import { ContexteFormulaire } from "~/composants/compte/FormulaireCompte";

type Props = {
  nom: string;
  /** La question posée (légende du groupe) */
  legende: ReactNode;
  /** Plusieurs réponses possibles (cases) ou une seule (boutons radio) */
  type: "checkbox" | "radio";
  options: { valeur: string; libelle: string }[];
  aide?: ReactNode;
  /** Les options côte à côte (« Oui » / « Non ») plutôt que l'une sous l'autre */
  enLigne?: boolean;
  /** Choix cochés au départ (la valeur enregistrée, dans « Ma fiche ») ; après un refus sans JavaScript, ceux envoyés */
  depart?: string[];
};

/**
 * Groupe de cases ou de boutons radio d'un FormulaireCompte : une légende, l'aide et l'erreur reliées au groupe. Après un
 * refus sans JavaScript, les choix faits sont remis (valeurs séparées par des virgules pour les cases).
 */
export function ChoixMultiples({ nom, legende, type, options, aide, enLigne = false, depart = [] }: Props) {
  const { prefixe, erreurs, valeurs, focusAuChargement } = use(ContexteFormulaire);
  const id = `${prefixe}-${nom}`;
  const erreur = erreurs[nom];
  const choisis = valeurs[nom] !== undefined ? valeurs[nom].split(",") : depart;
  const decrit = [aide ? `${id}-aide` : "", erreur ? `${id}-erreur` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <fieldset aria-describedby={decrit}>
      <legend className="mb-1.5 text-sm font-semibold">{legende}</legend>
      {aide && <p id={`${id}-aide`} className="mb-2 text-sm text-gris">{aide}</p>}
      <div className={`flex gap-x-6 gap-y-2.5 ${enLigne ? "flex-wrap" : "flex-col"}`}>
        {options.map((option, position) => (
          <label key={option.valeur} className="flex cursor-pointer items-start gap-3 font-medium">
            <input
              type={type}
              name={nom}
              value={option.valeur}
              required={type === "radio"}
              defaultChecked={choisis.includes(option.valeur)}
              autoFocus={position === 0 && focusAuChargement === nom}
              aria-invalid={Boolean(erreur)}
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-encre"
            />
            <span>{option.libelle}</span>
          </label>
        ))}
      </div>
      {erreur && <p id={`${id}-erreur`} className="mt-2 text-sm font-semibold text-rouge-texte">{erreur}</p>}
    </fieldset>
  );
}
