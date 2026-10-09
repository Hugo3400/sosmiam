import type { LieuResume } from "../../../../../packages/commun/src/types/lieu-resume.ts";
import type { Visite } from "../../../../../packages/commun/src/types/visite.ts";
import type { LigneVisite } from "../../services/visites-regles.ts";

const iso = (date: Date | null) => (date ? date.toISOString() : null);

/**
 * Une visite telle que la personne la voit (packages/commun, types/visite.ts) : le code à 4 chiffres seulement tant que
 * l'addition attend, le motif seulement d'un refus ou d'un retrait, jamais le mot de sa contestation ni qui l'a décidée. Jamais
 * « demo » : c'est une vraie visite.
 */
export function presenterVisite(v: LigneVisite, lieu: LieuResume): Visite {
  return {
    id: v.id,
    lieu,
    mode: v.mode,
    statut: v.statut,
    code: v.statut === "demandee" ? v.code : null,
    creeLe: v.creeLe.toISOString(),
    expireLe: iso(v.expireLe),
    valideLe: iso(v.valideLe),
    decideLe: iso(v.decideLe),
    pendantSos: v.pendantSos,
    points: v.points,
    tampon: v.tampon,
    resultatPosition: v.resultatPosition,
    // Une visite revalidée par l'équipe garde son motif dans la base (pour le logiciel), mais le client ne le voit plus
    motifRefus: v.statut === "refusee" || v.statut === "retiree" ? v.motifRefus : null,
    contestee: v.contestee,
    avis: v.avisOuvertLe && v.avisFermeLe ? { ouvertLe: v.avisOuvertLe.toISOString(), fermeLe: v.avisFermeLe.toISOString(), donne: v.avisDonne } : null,
    annulableJusqua: iso(v.annulableJusqua),
    reglement: v.reglement,
    demo: false,
  };
}
