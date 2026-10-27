import { citer } from "../../../../../packages/commun/src/fonctions/langue/citer.ts";
import { JourEnLettres } from "~/composants/pro/JourEnLettres";
import { TEXTES_FICHE_PRO_PAR_LANGUE } from "~/contenus/fiche-pro";
import { TEXTES_SUGGESTIONS_PRO_PAR_LANGUE } from "~/contenus/suggestions-pro";
import { ecrireValeurChamp } from "~/fonctions/pro/ecrire-valeur-champ";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { SuggestionFiche } from "~/types/pro";

const classes: Record<SuggestionFiche["statut"], string> = {
  "en-attente": "bg-jaune-clair text-encre",
  acceptee: "bg-encre text-jaune",
  partielle: "bg-encre text-jaune",
  refusee: "bg-rose-alerte text-rouge-texte",
};

/**
 * Une suggestion de modification de la fiche (dans une liste) : qui (un client, ou toi), le statut, et pour chaque champ
 * « avant → après » ; acceptée en partie, chaque champ dit s'il est passé. Jamais l'auteur.
 */
export function CarteSuggestion({ suggestion }: { suggestion: SuggestionFiche }) {
  const langue = utiliserLangue();
  const T = utiliserTextes(TEXTES_SUGGESTIONS_PRO_PAR_LANGUE).carte;
  const noms = utiliserTextes(TEXTES_FICHE_PRO_PAR_LANGUE).nomsChamps;
  return (
    <li className="rounded-carte border-2 border-encre bg-white p-5 shadow-brut">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <p className="min-w-0">
          <span className="font-titre text-lg font-extrabold">{suggestion.source === "client" ? T.client : T.toi}</span>
          <span className="block text-sm text-gris">
            {T.le}<JourEnLettres iso={suggestion.creeLe} />
            {suggestion.decideLe && <>{T.decideeLe}<JourEnLettres iso={suggestion.decideLe} /></>}
          </span>
        </p>
        <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold whitespace-nowrap ${classes[suggestion.statut]}`}>{T.statuts[suggestion.statut]}</span>
      </div>
      <ul className="mt-4 grid gap-3">
        {suggestion.champs.map((champ) => {
          const passe = suggestion.statut === "partielle" ? suggestion.champsAcceptes.includes(champ) : null;
          return (
            <li key={champ} className="rounded-xl bg-creme px-4 py-3">
              <p className="text-sm font-semibold">
                {noms[champ as keyof typeof noms] ?? champ}
                {passe !== null && <span className={passe ? "text-encre" : "text-rouge-texte"}>{passe ? T.accepte : T.pasRetenu}</span>}
              </p>
              <p className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1 [overflow-wrap:anywhere]">
                <span className="text-gris line-through decoration-gris/60"><span className="sr-only">{T.avant}</span>{ecrireValeurChamp(champ, suggestion.avant[champ], langue)}</span>
                <span aria-hidden="true" className="font-bold">→</span>
                <span className="font-semibold"><span className="sr-only">{T.apres}</span>{ecrireValeurChamp(champ, suggestion.proposition[champ], langue)}</span>
              </p>
            </li>
          );
        })}
      </ul>
      {suggestion.message && (
        <p className="mt-4 border-l-4 border-jaune pl-3 text-gris italic [overflow-wrap:anywhere]">
          <span className="sr-only">{T.pourquoi}</span>{citer(suggestion.message, langue)}
        </p>
      )}
      {suggestion.reponse && (
        <p className="mt-3 text-sm [overflow-wrap:anywhere]"><span className="font-semibold">{lierPonctuation(T.motEquipe)}</span>{suggestion.reponse}</p>
      )}
    </li>
  );
}
