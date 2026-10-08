// Le magasin de démo au départ (ou après « Remettre la démo à zéro »), à partir des données d'exemple de contenus/.
// Les dates sont posées par rapport à maintenant ; la visite validée d'exemple est rejouée avec les vraies règles.
import { calculerDecalageParis } from "@sos-miam/commun/fonctions/temps/calculer-decalage-paris";
import { calculerInstantParis } from "@sos-miam/commun/fonctions/temps/calculer-instant-paris";
import { DELAI_INVITATION_AVIS_MS, DUREE_DEMANDE_ADDITION_MS } from "@sos-miam/commun/regles/visites";

import { avisExemples } from "~/contenus/avis-exemples";
import { avisARelireExemples, messagesAmbassadeurExemples, missionsExemples } from "~/contenus/espace-ambassadeur-exemples";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { cartesExemples, figurantsExemples, programmesExemples, reservationsExemples, visitesExemples } from "~/contenus/visites-exemples";
import { formaterDateIso } from "~/fonctions/dates/formater-date-iso";
import { estSosEnCours } from "~/fonctions/lieux/est-sos-en-cours";
import { resumerLieu } from "~/fonctions/lieux/resumer-lieu";

import { deciderVisiteDemo } from "./decider-visite-demo";
import type { MagasinDemo, VisiteDemo } from "./types-demo";

const HEURE = 60 * 60_000;
const JOUR = 24 * HEURE;

const iso = (ms: number) => new Date(ms).toISOString();
const trouverLieu = (id: number) => lieuxExemples.find((l) => l.id === id);

/** Jour « AAAA-MM-JJ » à Paris à cet instant (quel que soit le fuseau du téléphone) */
const lireJourParis = (ms: number) => new Date(ms + calculerDecalageParis(ms)).toISOString().slice(0, 10);

/** Créneau « ce soir à HH:MM » (heure de Paris) ; demain si ce soir est passé depuis plus de 3 h */
function calculerCreneauDuSoir(heure: string, maintenantMs: number): string {
  let instant = calculerInstantParis(lireJourParis(maintenantMs), heure);
  if (instant < maintenantMs - 3 * HEURE) instant = calculerInstantParis(lireJourParis(maintenantMs + JOUR), heure);
  return iso(instant);
}

function ajouterVisites(m: MagasinDemo, maintenantMs: number) {
  for (const e of visitesExemples) {
    const lieu = trouverLieu(e.lieuId);
    if (!lieu) continue;
    const creeLeMs = maintenantMs - e.ilYaMs;
    const visite: VisiteDemo = {
      id: m.prochainId++,
      lieuId: e.lieuId,
      client: e.client,
      mode: e.mode,
      statut: "demandee",
      code: e.code,
      creeLe: iso(creeLeMs),
      expireLe: iso(creeLeMs + DUREE_DEMANDE_ADDITION_MS),
      valideLe: null,
      decideLe: null,
      pendantSos: estSosEnCours(lieu, new Date(creeLeMs)),
      points: 0,
      tampon: false,
      resultatPosition: "dans-rayon",
      motifRefus: null,
      contestee: false,
      avisOuvertLe: null,
      avisFermeLe: null,
      avisDonne: false,
      presentationId: null,
      reservationId: null,
      annulableJusqua: null,
    };
    m.visites.push(visite);
    if (e.statut === "validee") deciderVisiteDemo(m, visite.id, { type: "regler" }, creeLeMs + e.regleeApresMs, DELAI_INVITATION_AVIS_MS);
  }
}

function ajouterEspaceAmbassadeur(m: MagasinDemo, maintenantMs: number) {
  for (const a of avisARelireExemples) {
    const lieu = trouverLieu(a.lieuId);
    if (!lieu) continue;
    m.avisARelire.push({
      id: m.prochainId++,
      lieu: resumerLieu(lieu),
      note: a.note,
      texte: a.texte,
      photo: null,
      preuve: a.preuve,
      mois: formaterDateIso(new Date(maintenantMs - a.ilYaJours * JOUR)).slice(0, 7),
      raison: a.raison,
    });
  }
  for (const mission of missionsExemples) {
    const lieu = trouverLieu(mission.lieuId);
    m.missions.push({
      id: m.prochainId++,
      type: mission.type,
      titre: mission.titre,
      detail: mission.detail,
      echeance: mission.echeanceDansJours === null ? null : iso(maintenantMs + mission.echeanceDansJours * JOUR),
      statut: "a-faire",
      compteRendu: null,
      creeLe: iso(maintenantMs - mission.creeIlYaJours * JOUR),
      faiteLe: null,
      presenceVerifieeLe: null,
      lieu: lieu ? { id: lieu.id, nom: lieu.nom, ville: lieu.ville, emoji: lieu.emoji, position: lieu.position ?? null } : null,
    });
  }
  for (const message of messagesAmbassadeurExemples) {
    m.messages.push({ id: m.prochainId++, titre: message.titre, texte: message.texte, creeLe: iso(maintenantMs - message.ilYaJours * JOUR), luLe: null });
  }
}

/** Le magasin de démo tout neuf, daté par rapport à maintenant. */
export function creerMagasinInitial(maintenantMs: number): MagasinDemo {
  const m: MagasinDemo = {
    v: 1,
    creeLe: iso(maintenantMs),
    prochainId: 1,
    figurants: figurantsExemples.map((f) => ({ ...f })),
    visites: [],
    presentations: [],
    programmes: programmesExemples.map((p) => ({ ...p, modifieLe: iso(maintenantMs - 30 * JOUR) })),
    cartes: cartesExemples.map((c) => ({ ...c, pretes: [], demande: null })),
    reservations: [],
    avis: [],
    avisARelire: [],
    relectures: [],
    missions: [],
    messages: [],
    journal: [],
    contestations: [],
  };
  ajouterVisites(m, maintenantMs);
  for (const r of reservationsExemples) {
    m.reservations.push({
      id: m.prochainId++,
      lieuId: r.lieuId,
      client: r.client,
      personnes: r.personnes,
      creneau: calculerCreneauDuSoir(r.heure, maintenantMs),
      message: null,
      statut: "acceptee",
      motifRefus: null,
      tardive: false,
      creeLe: iso(maintenantMs - r.demandeeIlYaMs),
      reponduLe: iso(maintenantMs - r.reponduIlYaMs),
      presenceLe: null,
      code: null,
      visiteId: null,
    });
  }
  for (const a of avisExemples) {
    m.avis.push({
      id: m.prochainId++,
      visiteId: null,
      lieuId: a.lieuId,
      client: "exemple",
      signature: a.signature,
      note: a.note,
      texte: a.texte,
      photo: null,
      preuve: a.preuve,
      creeLe: iso(maintenantMs - a.ilYaJours * JOUR),
      statut: "publie",
      reponseLieu: a.reponseLieu ? { texte: a.reponseLieu.texte, le: iso(maintenantMs - a.reponseLieu.ilYaJours * JOUR) } : null,
    });
  }
  ajouterEspaceAmbassadeur(m, maintenantMs);
  return m;
}
