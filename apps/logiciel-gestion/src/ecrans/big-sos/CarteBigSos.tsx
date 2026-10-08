import { Badge } from "~/composants/interface/Badge.tsx";
import { ORIGINES_BIG_SOS, PHASES_BIG_SOS } from "~/contenus/big-sos.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import type { ResumeBigSos } from "~/services/big-sos.ts";
import { JaugeObjectif } from "./JaugeObjectif.tsx";

const MISSION: Record<string, string> = { "a-faire": "en cours", faite: "faite ✅", annulee: "annulée" };

/** Un BIG SOS dans la liste : le lieu, la phase, les dates, la vérification et la jauge. */
export function CarteBigSos({ bigSos, onOuvrir }: { bigSos: ResumeBigSos; onOuvrir: () => void }) {
  const phase = PHASES_BIG_SOS[bigSos.phase];
  return (
    <button type="button" onClick={onOuvrir} className="grid gap-3 rounded-carte border border-ligne bg-white p-5 text-left transition-colors hover:border-encre">
      <div className="flex flex-wrap items-center gap-2">
        <Badge ton={phase.ton}>{phase.libelle}</Badge>
        <span className="text-xs text-gris">{ORIGINES_BIG_SOS[bigSos.origine] ?? bigSos.origine}</span>
        <span className="ml-auto text-xs text-gris">n° {bigSos.id} · {formaterDate(bigSos.creeLe)}</span>
      </div>
      <div>
        <p className="font-titre text-xl font-extrabold">{bigSos.lieu.emoji} {bigSos.lieu.nom}</p>
        <p className="text-sm text-gris">{bigSos.lieu.ville}</p>
      </div>
      {bigSos.debutLe && bigSos.finLe && (
        <p className="text-sm">À la une du <strong>{formaterDate(bigSos.debutLe, true)}</strong> au <strong>{formaterDate(bigSos.finLe, true)}</strong></p>
      )}
      {bigSos.mission && <p className="text-sm text-gris">Vérification par {bigSos.mission.compte.prenom} : {MISSION[bigSos.mission.statut] ?? bigSos.mission.statut}</p>}
      {["programme", "a-la-une", "a-cloturer", "termine"].includes(bigSos.phase) && (
        <JaugeObjectif titre={bigSos.objectifTitre} cible={bigSos.objectifCible} atteint={bigSos.objectifAtteint} />
      )}
    </button>
  );
}
