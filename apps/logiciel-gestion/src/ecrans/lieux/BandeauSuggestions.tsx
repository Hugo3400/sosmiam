import { ChevronRight } from "lucide-react";

import { SOURCES_SUGGESTION } from "~/contenus/champs-lieu.ts";
import { formaterDateRelative } from "~/fonctions/texte/formater-date-relative.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerSuggestions } from "~/services/suggestions.ts";

/** En haut de la liste des lieux : les modifications de fiches proposées à examiner ; un clic ouvre la fiche concernée. */
export function BandeauSuggestions({ tour, onOuvrir }: { tour: number; onOuvrir: (lieuId: number) => void }) {
  const { donnees } = utiliserChargement(() => listerSuggestions("en-attente"), [tour]);
  if (!donnees?.length) return null;
  return (
    <section className="mb-5 grid gap-2 rounded-carte border-2 border-encre bg-jaune-clair p-4" aria-label="Modifications proposées">
      <h2 className="font-titre text-lg font-extrabold">
        ✏️ {donnees.length} modification{donnees.length > 1 ? "s" : ""} de fiche proposée{donnees.length > 1 ? "s" : ""}
      </h2>
      <ul className="grid gap-1">
        {donnees.map((suggestion) => (
          <li key={suggestion.id}>
            <button type="button" onClick={() => onOuvrir(suggestion.lieuId)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white">
              <span aria-hidden>{suggestion.lieu.emoji}</span>
              <span className="font-semibold">{suggestion.lieu.nom}</span>
              <span className="text-gris">
                · {Object.keys(suggestion.proposition).length} champ(s) · par {suggestion.compte?.prenom ?? "quelqu'un"} ({SOURCES_SUGGESTION[suggestion.source] ?? suggestion.source}) · {formaterDateRelative(suggestion.creeLe)}
              </span>
              <ChevronRight className="ml-auto size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
