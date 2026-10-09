import { useState } from "react";

import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerSuggestions } from "~/services/suggestions.ts";
import { PanneauSuggestion } from "./PanneauSuggestion.tsx";

type Props = { lieuId: number; maintenant: Record<string, unknown>; onDecision: () => void };

/** En haut de la fiche d'un lieu : les modifications proposées qui attendent une décision, une par une. */
export function SuggestionsDuLieu({ lieuId, maintenant, onDecision }: Props) {
  const [bilan, setBilan] = useState<string | null>(null);
  const { donnees, recharger } = utiliserChargement(() => listerSuggestions("en-attente", lieuId), [lieuId]);
  if (!bilan && !donnees?.length) return null;
  return (
    <div className="mb-6 grid gap-4">
      {bilan && <p role="status" className="rounded-xl bg-vert-clair px-4 py-2 text-sm font-semibold text-vert">{bilan}</p>}
      {donnees?.map((suggestion) => (
        <PanneauSuggestion
          key={suggestion.id}
          suggestion={suggestion}
          maintenant={maintenant}
          onDecision={(texte) => {
            setBilan(texte);
            recharger();
            onDecision();
          }}
        />
      ))}
    </div>
  );
}
