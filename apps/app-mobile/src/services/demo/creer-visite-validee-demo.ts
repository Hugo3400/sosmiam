import { calculerEffetsValidation } from "@sos-miam/commun/fonctions/visites/calculer-effets-validation";
import { calculerPointsVisite } from "@sos-miam/commun/fonctions/visites/calculer-points-visite";
import { DELAI_ANNULATION_LIEU_MS } from "@sos-miam/commun/regles/visites";
import type { ResultatPosition } from "@sos-miam/commun/types/position";
import type { ModeValidation, ReglementVisite } from "@sos-miam/commun/types/visite";

import { lieuxExemples } from "~/contenus/lieux-exemples";
import { estSosEnCours } from "~/fonctions/lieux/est-sos-en-cours";

import { appliquerEffetsVisite } from "./appliquer-effets-demo";
import type { ClientDemo, MagasinDemo, VisiteDemo } from "./types-demo";

export type EntreeVisiteValideeDemo = {
  lieuId: number;
  client: ClientDemo;
  mode: ModeValidation;
  presentationId: number | null;
  reservationId: number | null;
  resultatPosition: ResultatPosition | null;
  maintenantMs: number;
  delaiAvisMs: number;
  /** Comment ça a été réglé (QR : celui de la table ; absent : payée) */
  reglement?: ReglementVisite;
};

/**
 * Crée une visite validée d'un coup (QR du comptoir scanné, réservation honorée) : +15 points (+25 si un SOS est en
 * cours), un tampon, l'avis qui s'ouvre plus tard ; offerte par le lieu, seulement l'avis. Annulable par le lieu 15 min.
 */
export function creerVisiteValideeDemo(m: MagasinDemo, e: EntreeVisiteValideeDemo): { visite: VisiteDemo; recompenseGagnee: boolean } {
  const lieu = lieuxExemples.find((l) => l.id === e.lieuId);
  const pendantSos = lieu ? estSosEnCours(lieu, new Date(e.maintenantMs)) : false;
  const reglement: ReglementVisite = e.reglement ?? { type: "paye", reductionPourcent: null, avantages: [] };
  const le = new Date(e.maintenantMs).toISOString();
  const visite: VisiteDemo = {
    id: m.prochainId,
    lieuId: e.lieuId,
    client: e.client.cle,
    mode: e.mode,
    statut: "validee",
    code: null,
    creeLe: le,
    expireLe: null,
    valideLe: le,
    decideLe: le,
    pendantSos,
    points: calculerPointsVisite(pendantSos, reglement),
    tampon: false,
    resultatPosition: e.resultatPosition,
    motifRefus: null,
    contestee: false,
    avisOuvertLe: null,
    avisFermeLe: null,
    avisDonne: false,
    presentationId: e.presentationId,
    reservationId: e.reservationId,
    annulableJusqua: new Date(e.maintenantMs + DELAI_ANNULATION_LIEU_MS).toISOString(),
    reglement,
  };
  m.prochainId += 1;
  m.visites.push(visite);
  // Offerte : ni points ni tampon, seulement l'avis (marqué « Repas offert »)
  const effets = calculerEffetsValidation(pendantSos, e.maintenantMs, e.delaiAvisMs, reglement);
  const { recompenseGagnee } = appliquerEffetsVisite(m, visite, effets, e.maintenantMs, e.client);
  return { visite, recompenseGagnee };
}
