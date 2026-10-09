import { calculerEffetsValidation } from "../../../../../packages/commun/src/fonctions/visites/calculer-effets-validation.ts";
import { calculerPointsVisite } from "../../../../../packages/commun/src/fonctions/visites/calculer-points-visite.ts";
import { DELAI_ANNULATION_LIEU_MS } from "../../../../../packages/commun/src/regles/visites.ts";
import type { ReglementVisite } from "../../../../../packages/commun/src/types/visite.ts";
import type { LigneVisite, TablesVisites } from "../../services/visites-regles.ts";
import { appliquerEffetsVisite, type PointsVisite } from "./appliquer-effets-visite.ts";

/** Une visite validée d'un coup : QR du comptoir scanné, ou réservation honorée (« Venu » et « Je suis là ») */
export type VisiteAValider = {
  compteId: number;
  lieuId: number;
  mode: "comptoir" | "reservation";
  /** Un SOS était en cours (QR : au scan ; réservation : à la demande, pour ce créneau) */
  pendantSos: boolean;
  /** Le membre de l'équipe qui a validé (QR montré, « Venu ») ; null s'il a supprimé son compte depuis */
  decideParId: number | null;
  presentationId: number | null;
  reservationId: number | null;
  reglement: ReglementVisite;
};

export type VisiteValidee = { visite: LigneVisite; points: PointsVisite[]; recompenseGagnee: boolean };

/**
 * Crée une visite validée dans la transaction (position déjà vérifiée : « dans-rayon ») et applique ses effets comme une
 * addition réglée : +15 (+25 pendant un SOS), tampon selon l'âge du client (`majeur`), avis ouvert dans 1 h ; offerte par
 * le lieu : seulement l'avis. Annulable par le lieu pendant 15 min. Les points sont rendus, à poser après la transaction.
 */
export async function creerVisiteValidee(t: TablesVisites, a: VisiteAValider, maintenant: Date, majeur: boolean): Promise<VisiteValidee> {
  const visite = await t.creerVisite({
    compteId: a.compteId, lieuId: a.lieuId, mode: a.mode, statut: "validee", code: null, creeLe: maintenant, expireLe: null,
    valideLe: maintenant, decideLe: maintenant, decideParId: a.decideParId, pendantSos: a.pendantSos,
    points: calculerPointsVisite(a.pendantSos, a.reglement), tampon: false, resultatPosition: "dans-rayon", motifRefus: null,
    contestee: false, contestation: null, avisOuvertLe: null, avisFermeLe: null, avisDonne: false, presentationId: a.presentationId,
    reservationId: a.reservationId, annulableJusqua: new Date(maintenant.getTime() + DELAI_ANNULATION_LIEU_MS), reglement: a.reglement,
  });
  const effets = calculerEffetsValidation(a.pendantSos, maintenant.getTime(), undefined, a.reglement);
  const { champs, points, recompenseGagnee } = await appliquerEffetsVisite(t, visite, effets, maintenant, majeur);
  await t.modifierVisite(visite.id, champs);
  return { visite: { ...visite, ...champs }, points, recompenseGagnee };
}
