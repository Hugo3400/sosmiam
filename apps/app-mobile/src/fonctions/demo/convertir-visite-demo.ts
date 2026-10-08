import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Visite } from "@sos-miam/commun/types/visite";

import { resumerLieu } from "~/fonctions/lieux/resumer-lieu";
import type { VisiteDemo } from "~/services/demo/types-demo";

/**
 * Visite du magasin de démo, telle que l'API la rendra au client. Le code de rapprochement n'est montré que tant que
 * l'addition attend ; la visite porte toujours « demo » (elle ne sera jamais importée dans un vrai compte).
 */
export function convertirVisiteDemo(v: VisiteDemo, lieu: Lieu): Visite {
  return {
    id: v.id,
    lieu: resumerLieu(lieu),
    mode: v.mode,
    statut: v.statut,
    code: v.statut === "demandee" ? v.code : null,
    creeLe: v.creeLe,
    expireLe: v.expireLe,
    valideLe: v.valideLe,
    decideLe: v.decideLe,
    pendantSos: v.pendantSos,
    points: v.points,
    tampon: v.tampon,
    resultatPosition: v.resultatPosition,
    motifRefus: v.motifRefus,
    contestee: v.contestee,
    avis: v.avisOuvertLe && v.avisFermeLe ? { ouvertLe: v.avisOuvertLe, fermeLe: v.avisFermeLe, donne: v.avisDonne } : null,
    annulableJusqua: v.annulableJusqua,
    demo: true,
  };
}
