import type { ReactNode } from "react";

import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";

type Props = {
  libelle: string;
  valeur: number | string;
  /** Comparaison : « +12 % par rapport à hier » (en vert si ça monte, en rouge si ça baisse) */
  ecart?: { pourcentage: number | null; reference: string };
  detail?: ReactNode;
  accent?: boolean;
};

/** Un chiffre clé, avec son libellé et, si on l'a, son évolution. */
export function TuileChiffre({ libelle, valeur, ecart, detail, accent }: Props) {
  const signe = ecart?.pourcentage === null || ecart?.pourcentage === undefined ? 0 : Math.sign(ecart.pourcentage);
  return (
    <div className={`grid content-start gap-1 rounded-carte border p-4 ${accent ? "border-encre bg-jaune-clair" : "border-ligne bg-white"}`}>
      <p className="text-sm font-semibold text-gris">{libelle}</p>
      <p className="chiffres font-titre text-3xl font-extrabold">{typeof valeur === "number" ? formaterNombre(valeur) : valeur}</p>
      {ecart && (
        <p className={`text-[13px] font-semibold ${signe > 0 ? "text-vert" : signe < 0 ? "text-rouge-texte" : "text-gris"}`}>
          {ecart.pourcentage === null ? "Rien à comparer" : `${signe > 0 ? "▲ +" : signe < 0 ? "▼ " : ""}${Math.round(ecart.pourcentage)} %`}
          <span className="font-normal text-gris"> {ecart.reference}</span>
        </p>
      )}
      {detail && <div className="text-[13px] text-gris">{detail}</div>}
    </div>
  );
}
