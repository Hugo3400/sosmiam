import { TEXTES_TABLEAU_PRO_PAR_LANGUE } from "~/contenus/tableau-pro";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { StatutRattachement } from "~/types/pro";

const classes: Record<StatutRattachement, string> = {
  "en-attente": "bg-jaune-clair text-encre",
  valide: "bg-encre text-jaune",
  refuse: "bg-rose-alerte text-rouge-texte",
};

/** Le statut d'un lieu du compte : en attente (l'équipe vérifie), vérifié ✓, ou refusé. */
export function PastilleStatut({ statut }: { statut: StatutRattachement }) {
  const T = utiliserTextes(TEXTES_TABLEAU_PRO_PAR_LANGUE);
  return <span className={`inline-block shrink-0 rounded-full px-3 py-1 text-sm font-bold whitespace-nowrap ${classes[statut]}`}>{T.statuts[statut]}</span>;
}
