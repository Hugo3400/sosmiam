import { DateEnLettres } from "~/composants/ambassadeur/DateEnLettres";
import { TEXTES_ESPACE_AMBASSADEUR_PAR_LANGUE } from "~/contenus/espace-ambassadeur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { PropositionLieu } from "~/types/compte";

const statuts: Record<PropositionLieu["statut"], { emoji: string; classe: string }> = {
  "a-traiter": { emoji: "👀", classe: "bg-jaune-clair" },
  acceptee: { emoji: "🎉", classe: "bg-jaune" },
  refusee: { emoji: "", classe: "bg-white" },
};

/** Les lieux proposés par l'ambassadeur, avec leur statut ; null : la liste n'a pas pu être lue. */
export function ListePropositions({ propositions }: { propositions: PropositionLieu[] | null }) {
  const T = utiliserTextes(TEXTES_ESPACE_AMBASSADEUR_PAR_LANGUE).propositions;
  if (propositions === null) {
    return <p className="text-gris">{T.illisible}</p>;
  }
  if (propositions.length === 0) {
    return <p className="text-gris">{lierPonctuation(T.aucune)}</p>;
  }
  return (
    <ul className="grid gap-3">
      {propositions.map((proposition) => {
        const cle = proposition.statut in statuts ? proposition.statut : "a-traiter";
        const statut = statuts[cle];
        return (
          <li key={proposition.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl border-2 border-encre bg-white px-4 py-3">
            <span>
              <strong className="font-semibold">{proposition.nom}</strong>
              <span className="text-gris"> · {proposition.ville}</span>
              <span className="block text-sm text-gris">{T.proposeLe}<DateEnLettres iso={proposition.creeLe} /></span>
            </span>
            <span className={`rounded-full border-2 border-encre px-3 py-1 text-sm font-semibold ${statut.classe}`}>
              {statut.emoji && <span aria-hidden="true">{statut.emoji} </span>}{T.statuts[cle]}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
