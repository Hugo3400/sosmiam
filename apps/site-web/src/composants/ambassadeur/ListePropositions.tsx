import { DateEnLettres } from "~/composants/ambassadeur/DateEnLettres";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { PropositionLieu } from "~/types/compte";

const statuts: Record<PropositionLieu["statut"], { texte: string; emoji: string; classe: string }> = {
  "a-traiter": { texte: "À l'étude", emoji: "👀", classe: "bg-jaune-clair" },
  acceptee: { texte: "Acceptée", emoji: "🎉", classe: "bg-jaune" },
  refusee: { texte: "Pas retenue", emoji: "", classe: "bg-white" },
};

/** Les lieux proposés par l'ambassadeur, avec leur statut ; null : la liste n'a pas pu être lue. */
export function ListePropositions({ propositions }: { propositions: PropositionLieu[] | null }) {
  if (propositions === null) {
    return <p className="text-gris">Ta liste n'a pas pu être chargée. Réessaie dans un instant.</p>;
  }
  if (propositions.length === 0) {
    return <p className="text-gris">{lierPonctuation("Tu n'as encore proposé aucun lieu. La première pépite, c'est pour quand ?")}</p>;
  }
  return (
    <ul className="grid gap-3">
      {propositions.map((proposition) => {
        const statut = statuts[proposition.statut] ?? statuts["a-traiter"];
        return (
          <li key={proposition.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl border-2 border-encre bg-white px-4 py-3">
            <span>
              <strong className="font-semibold">{proposition.nom}</strong>
              <span className="text-gris"> · {proposition.ville}</span>
              <span className="block text-sm text-gris">Proposé le <DateEnLettres iso={proposition.creeLe} /></span>
            </span>
            <span className={`rounded-full border-2 border-encre px-3 py-1 text-sm font-semibold ${statut.classe}`}>
              {statut.emoji && <span aria-hidden="true">{statut.emoji} </span>}{statut.texte}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
