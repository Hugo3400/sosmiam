import { Check } from "lucide-react";
import type { MouseEvent } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { STATUTS_LIEU, TYPES_LIEU } from "~/contenus/statuts-lieu.ts";
import { formaterDateRelative } from "~/fonctions/texte/formater-date-relative.ts";
import type { ResumeLieu } from "~/services/lieux.ts";

type Props = {
  lieu: ResumeLieu;
  choisi: boolean;
  /** Une sélection est en cours : un clic sur la carte coche ou décoche au lieu d'ouvrir la fiche */
  enSelection: boolean;
  onCocher: (evenement: MouseEvent) => void;
  onOuvrir: () => void;
};

/** Un lieu dans la liste : sa case à cocher, son dégradé, son nom, son statut et quelques infos. */
export function CarteLieu({ lieu, choisi, enSelection, onCocher, onOuvrir }: Props) {
  return (
    <div className={`group relative rounded-carte border bg-white transition-colors ${choisi ? "border-encre ring-2 ring-jaune" : "border-ligne hover:border-encre"}`}>
      <button
        type="button"
        onClick={(evenement) => (enSelection || evenement.ctrlKey || evenement.metaKey || evenement.shiftKey ? onCocher(evenement) : onOuvrir())}
        className="flex w-full items-center gap-4 p-4 pl-12 text-left"
      >
        <span
          className="grid size-14 shrink-0 place-items-center rounded-2xl text-2xl"
          style={{ background: `linear-gradient(135deg, ${lieu.couleurs[0] ?? "#FFD60A"}, ${lieu.couleurs[1] ?? "#FF4D3D"})` }}
          aria-hidden
        >
          {lieu.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-titre text-lg font-extrabold">{lieu.nom}</span>
            <Badge ton={STATUTS_LIEU[lieu.statut].ton}>{STATUTS_LIEU[lieu.statut].libelle}</Badge>
          </span>
          <span className="block truncate text-sm text-gris">{TYPES_LIEU[lieu.type]} · {lieu.info} · {lieu.quartier}, {lieu.ville}</span>
          <span className="block text-xs text-gris">{lieu._count.publications} publication(s) · modifié {formaterDateRelative(lieu.modifieLe)}</span>
        </span>
      </button>
      <button
        type="button"
        role="checkbox"
        aria-checked={choisi}
        aria-label={`Sélectionner ${lieu.nom}`}
        onClick={onCocher}
        className={`absolute top-1/2 left-3.5 grid size-6 -translate-y-1/2 place-items-center rounded-md border-2 transition-opacity ${
          choisi ? "border-encre bg-jaune" : `border-gris/50 bg-white hover:border-encre ${enSelection ? "" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"}`
        }`}
      >
        {choisi && <Check className="size-4" strokeWidth={3} aria-hidden />}
      </button>
    </div>
  );
}
