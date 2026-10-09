import type { StatutRattachement } from "~/types/pro";

const pastilles: Record<StatutRattachement, { texte: string; classe: string }> = {
  "en-attente": { texte: "En attente", classe: "bg-jaune-clair text-encre" },
  valide: { texte: "Vérifié ✓", classe: "bg-encre text-jaune" },
  refuse: { texte: "Refusé", classe: "bg-rose-alerte text-rouge-texte" },
};

/** Le statut d'un lieu du compte : en attente (l'équipe vérifie), vérifié ✓, ou refusé. */
export function PastilleStatut({ statut }: { statut: StatutRattachement }) {
  const pastille = pastilles[statut];
  return <span className={`inline-block shrink-0 rounded-full px-3 py-1 text-sm font-bold whitespace-nowrap ${pastille.classe}`}>{pastille.texte}</span>;
}
