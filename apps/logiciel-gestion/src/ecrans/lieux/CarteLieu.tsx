import { Check } from "lucide-react";
import type { MouseEvent } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { POINTS_FICHE } from "~/contenus/champs-lieu.ts";
import { EMOJIS_TYPE_LIEU, STATUTS_LIEU, TYPES_LIEU } from "~/contenus/statuts-lieu.ts";
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

/**
 * Un lieu dans la liste : sa case à cocher, son dégradé, son nom et son statut, puis ses étiquettes (type, ville,
 * catégorie « Ce que c'est ») et son activité. Version A de la maquette validée par Hugo le 9 octobre 2026.
 */
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
        <span className="grid min-w-0 flex-1 gap-1.5">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-titre text-lg font-extrabold">{lieu.nom}</span>
            <span className="ml-auto flex shrink-0 gap-1">
              {lieu.verifie && <Badge ton="vert">Vérifié ✓</Badge>}
              <Badge ton={STATUTS_LIEU[lieu.statut].ton}>{STATUTS_LIEU[lieu.statut].libelle}</Badge>
            </span>
          </span>
          <span className="flex flex-wrap gap-1.5">
            <Badge ton="jaune">{EMOJIS_TYPE_LIEU[lieu.type] ?? ""} {TYPES_LIEU[lieu.type] ?? lieu.type}</Badge>
            {lieu.ville.trim() && <span title={[lieu.quartier.trim(), lieu.ville.trim()].filter(Boolean).join(", ")}><Badge ton="contour">📍 {lieu.ville.trim()}</Badge></span>}
            {lieu.info.trim() && <Badge>{lieu.info.trim()}</Badge>}
          </span>
          <span className="block text-xs text-gris">
            {lieu._count.publications} publication{lieu._count.publications > 1 ? "s" : ""} · modifié {formaterDateRelative(lieu.modifieLe)} ·{" "}
            {lieu.manques.length === 0
              ? <span className="font-semibold text-vert">fiche complète ✓</span>
              : <span className="font-semibold text-encre" title={`À compléter : ${lieu.manques.map((point) => POINTS_FICHE[point] ?? point).join(", ")}`}>{lieu.manques.length} point{lieu.manques.length > 1 ? "s" : ""} à compléter</span>}
          </span>
        </span>
      </button>
      <button
        type="button"
        role="checkbox"
        aria-checked={choisi}
        aria-label={`Sélectionner ${lieu.nom}`}
        onClick={onCocher}
        className={`absolute top-1/2 left-3.5 grid size-6 -translate-y-1/2 place-items-center rounded-md border-2 transition-opacity ${
          choisi ? "border-nuit bg-jaune text-nuit" : `border-gris/50 bg-white hover:border-encre ${enSelection ? "" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"}`
        }`}
      >
        {choisi && <Check className="size-4" strokeWidth={3} aria-hidden />}
      </button>
    </div>
  );
}
