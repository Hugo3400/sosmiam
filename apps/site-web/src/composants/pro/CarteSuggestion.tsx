import { DateEnLettres } from "~/composants/ambassadeur/DateEnLettres";
import { NOMS_CHAMPS } from "~/contenus/infos-pratiques";
import { ecrireValeurChamp } from "~/fonctions/pro/ecrire-valeur-champ";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { SuggestionFiche } from "~/types/pro";

const statuts: Record<SuggestionFiche["statut"], { texte: string; classe: string }> = {
  "en-attente": { texte: "L'équipe regarde", classe: "bg-jaune-clair text-encre" },
  acceptee: { texte: "Acceptée ✓", classe: "bg-encre text-jaune" },
  partielle: { texte: "Acceptée en partie", classe: "bg-encre text-jaune" },
  refusee: { texte: "Refusée", classe: "bg-rose-alerte text-rouge-texte" },
};

/**
 * Une suggestion de modification de la fiche (dans une liste) : qui (un client, ou toi), le statut, et pour chaque champ
 * « avant → après » ; acceptée en partie, chaque champ dit s'il est passé. Jamais l'auteur.
 */
export function CarteSuggestion({ suggestion }: { suggestion: SuggestionFiche }) {
  const statut = statuts[suggestion.statut];
  return (
    <li className="rounded-carte border-2 border-encre bg-white p-5 shadow-brut">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <p className="min-w-0">
          <span className="font-titre text-lg font-extrabold">{suggestion.source === "client" ? "Un client propose" : "Ta demande"}</span>
          <span className="block text-sm text-gris">
            {"Le "}<DateEnLettres iso={suggestion.creeLe} />
            {suggestion.decideLe && <>{" · décidée le "}<DateEnLettres iso={suggestion.decideLe} /></>}
          </span>
        </p>
        <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold whitespace-nowrap ${statut.classe}`}>{statut.texte}</span>
      </div>
      <ul className="mt-4 grid gap-3">
        {suggestion.champs.map((champ) => {
          const passe = suggestion.statut === "partielle" ? suggestion.champsAcceptes.includes(champ) : null;
          return (
            <li key={champ} className="rounded-xl bg-creme px-4 py-3">
              <p className="text-sm font-semibold">
                {NOMS_CHAMPS[champ as keyof typeof NOMS_CHAMPS] ?? champ}
                {passe !== null && <span className={passe ? "text-encre" : "text-rouge-texte"}>{passe ? " · accepté ✓" : " · pas retenu"}</span>}
              </p>
              <p className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1 [overflow-wrap:anywhere]">
                <span className="text-gris line-through decoration-gris/60"><span className="sr-only">Avant : </span>{ecrireValeurChamp(champ, suggestion.avant[champ])}</span>
                <span aria-hidden="true" className="font-bold">→</span>
                <span className="font-semibold"><span className="sr-only">, après : </span>{ecrireValeurChamp(champ, suggestion.proposition[champ])}</span>
              </p>
            </li>
          );
        })}
      </ul>
      {suggestion.message && (
        <p className="mt-4 border-l-4 border-jaune pl-3 text-gris italic [overflow-wrap:anywhere]">
          <span className="sr-only">Pourquoi : </span>{`« ${suggestion.message} »`}
        </p>
      )}
      {suggestion.reponse && (
        <p className="mt-3 text-sm [overflow-wrap:anywhere]"><span className="font-semibold">{lierPonctuation("Le mot de l'équipe : ")}</span>{suggestion.reponse}</p>
      )}
    </li>
  );
}
