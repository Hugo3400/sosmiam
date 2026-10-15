import { LIBELLES_MOTIF_REFUS_RESERVATION } from "../../../../../packages/commun/src/contenus/motifs-refus.ts";
import type { MotifRefusReservation } from "../../../../../packages/commun/src/types/reservation.ts";
import { Badge } from "~/composants/interface/Badge.tsx";
import { formaterDelaiMinutes } from "~/fonctions/texte/formater-delai-minutes.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import type { ReservationsLieu } from "~/services/reservations.ts";

type Props = { lieux: ReservationsLieu[]; ouvrirLieu: (id: number) => void };

const pourcent = (taux: number | null) => (taux === null ? "—" : `${Math.round(taux * 100)} %`);
const motifs = (l: ReservationsLieu) =>
  Object.entries(l.motifsRefus).map(([motif, n]) => `${LIBELLES_MOTIF_REFUS_RESERVATION[motif as MotifRefusReservation] ?? motif} (${n})`).join(" · ");

/** Lieu par lieu : demandes, réponses, refus, absences. Ceux qui ne répondent pas sont en tête, avec un badge. */
export function TableauReservations({ lieux, ouvrirLieu }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-ligne text-left text-gris">
          <tr>
            <th className="px-5 py-2 font-semibold">Lieu</th>
            <th className="chiffres px-3 py-2 text-right font-semibold">Demandes</th>
            <th className="chiffres px-3 py-2 text-right font-semibold">En attente</th>
            <th className="chiffres px-3 py-2 text-right font-semibold" title="Restées sans réponse jusqu'à 30 min avant le créneau">Sans réponse</th>
            <th className="chiffres px-3 py-2 text-right font-semibold">Répond</th>
            <th className="chiffres px-3 py-2 text-right font-semibold" title="Délai médian entre la demande et la réponse du lieu">Délai</th>
            <th className="chiffres px-3 py-2 text-right font-semibold">Refusées</th>
            <th className="chiffres px-3 py-2 text-right font-semibold" title="Venus (visite validée) / pas venus">Venus / absents</th>
            <th className="chiffres px-5 py-2 text-right font-semibold" title="Annulées par le client (dont moins de 2 h avant)">Annulées</th>
          </tr>
        </thead>
        <tbody>
          {lieux.map((l) => (
            <tr key={l.lieu.id} className={`border-b border-ligne/70 align-top last:border-0 ${l.repondPas ? "bg-rose-alerte/40" : ""}`}>
              <td className="px-5 py-2.5">
                <button type="button" onClick={() => ouvrirLieu(l.lieu.id)} className="text-left font-semibold underline-offset-2 hover:underline">{l.lieu.nom}</button>
                <span className="text-gris"> · {l.lieu.ville}</span>
                {l.repondPas && <span className="ml-2"><Badge ton="rouge">Ne répond pas</Badge></span>}
                {l.lieu.statut !== "publie" && <span className="ml-2"><Badge>{l.lieu.statut === "masque" ? "Masqué" : "Hors ligne"}</Badge></span>}
                {l.refusees > 0 && <p className="mt-0.5 text-xs text-gris">{motifs(l)}</p>}
              </td>
              <td className="chiffres px-3 py-2.5 text-right">{formaterNombre(l.demandes)}</td>
              <td className="chiffres px-3 py-2.5 text-right">{l.enAttente || "—"}</td>
              <td className={`chiffres px-3 py-2.5 text-right ${l.sansReponse ? "font-bold text-rouge-texte" : ""}`}>{l.sansReponse || "—"}</td>
              <td className="chiffres px-3 py-2.5 text-right">{pourcent(l.tauxReponse)}</td>
              <td className="chiffres px-3 py-2.5 text-right">{formaterDelaiMinutes(l.reponseMedianeMin)}</td>
              <td className="chiffres px-3 py-2.5 text-right">{l.refusees || "—"}</td>
              <td className="chiffres px-3 py-2.5 text-right">{l.honorees} / {l.absents}</td>
              <td className="chiffres px-5 py-2.5 text-right">{l.annulees ? `${l.annulees}${l.tardives ? ` (${l.tardives} tard.)` : ""}` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
