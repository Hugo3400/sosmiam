import type { ServiceReservations } from "@sos-miam/commun/client-api/contrat-reservations";
import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import { faireEvoluerReservation } from "@sos-miam/commun/fonctions/reservations/faire-evoluer-reservation";
import { listerCreneauxReservation } from "@sos-miam/commun/fonctions/reservations/lister-creneaux-reservation";
import { peutAgirAuComptoir } from "@sos-miam/commun/fonctions/roles/peut-agir-au-comptoir";
import { calculerInstantParis } from "@sos-miam/commun/fonctions/temps/calculer-instant-paris";
import { RESERVATIONS_A_VENIR_MAX, RESERVATIONS_EN_ATTENTE_PAR_LIEU, VENU_AVANT_CRENEAU_MS } from "@sos-miam/commun/regles/reservations";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { DemandeReservation, Reservation } from "@sos-miam/commun/types/reservation";
import { validerDemandeReservation } from "@sos-miam/commun/validation/valider-demande-reservation";

import { lieuxExemples } from "~/contenus/lieux-exemples";

import { construireResultatValidationDemo } from "./construire-resultat-validation-demo";
import { convertirReservationDemo } from "./convertir-reservation-demo";
import { deciderReservationDemo } from "./decider-reservation-demo";
import { lireDelaiAvisDemo } from "./lire-delai-avis-demo";
import { planifierReponseReservationDemo } from "./planifier-reponse-reservation-demo";
import { consommerPepin } from "./reglages-demo-vivants";
import { traduirePepinDemo } from "./traduire-pepin-demo";
import type { ContexteDemo, MagasinDemo, ReservationDemo } from "./types-demo";
import { verifierPositionDemo } from "./verifier-position-demo";

type Echec = Extract<ReponseApi, { ok: false }>;
type ReponseReservation = ReponseApi<{ reservation: Reservation }>;

const REPONSE_AUTO_MS = 8_000;
const REFUS_PEPIN_MS = 3_000;
const SANS_COMPTE: Echec = { ok: false, erreur: "connexion-requise" };
const INTROUVABLE: Echec = { ok: false, erreur: "introuvable" };
const MEMBRE_DU_LIEU: Echec = { ok: false, erreur: "membre-du-lieu" };

const trouverLieu = (id: number) => lieuxExemples.find((l) => l.id === id);

function verifierLieu(lieu: Lieu | undefined): Echec | null {
  if (!lieu) return INTROUVABLE;
  return lieu.reservable ? null : { ok: false, erreur: "lieu-non-reservable", details: { lieu: lieu.nom } };
}

function nettoyerMessage(message: string | null): string | null {
  const texte = typeof message === "string" ? message.trim().replace(/\s+/g, " ") : "";
  return texte === "" ? null : texte;
}

function creerDemande(m: MagasinDemo, lieu: Lieu, demande: DemandeReservation, maintenantMs: number): ReponseReservation {
  const erreur = validerDemandeReservation(demande, lieu.ouverture, new Date(maintenantMs));
  if (erreur) return { ok: false, erreur };
  const aVenir = m.reservations.filter((r) => r.client === "moi" && (r.statut === "demandee" || r.statut === "acceptee") && Date.parse(r.creneau) >= maintenantMs);
  if (aVenir.filter((r) => r.lieuId === lieu.id && r.statut === "demandee").length >= RESERVATIONS_EN_ATTENTE_PAR_LIEU) {
    return { ok: false, erreur: "reservation-en-cours", details: { lieu: lieu.nom, lieuId: lieu.id } };
  }
  if (aVenir.length >= RESERVATIONS_A_VENIR_MAX) return { ok: false, erreur: "trop-de-reservations" };
  const r: ReservationDemo = {
    id: m.prochainId,
    lieuId: lieu.id,
    client: "moi",
    personnes: demande.personnes,
    creneau: new Date(calculerInstantParis(demande.jour, demande.heure)).toISOString(),
    message: nettoyerMessage(demande.message),
    statut: "demandee",
    motifRefus: null,
    tardive: false,
    creeLe: new Date(maintenantMs).toISOString(),
    reponduLe: null,
    presenceLe: null,
    code: null,
    visiteId: null,
  };
  m.prochainId += 1;
  m.reservations.push(r);
  return { ok: true, reservation: convertirReservationDemo(r) };
}

export function creerReservationsDemo(ctx: ContexteDemo): ServiceReservations {
  const repondSeul = (lieuId: number) => ctx.lireReglages().lieuxRepondentSeuls && !peutAgirAuComptoir(ctx.lireRoles(), lieuId);
  const verifierLieuPourMoi = (lieu: Lieu | undefined): Echec | null => {
    const refus = verifierLieu(lieu);
    if (refus || !lieu) return refus ?? INTROUVABLE;
    return peutAgirAuComptoir(ctx.lireRoles(), lieu.id) ? MEMBRE_DU_LIEU : null;
  };
  const trouverLaMienne = (m: Readonly<MagasinDemo>, id: number) => m.reservations.find((r) => r.id === id && r.client === "moi");

  return {
    async listerCreneaux(lieuId, jour) {
      const lieu = trouverLieu(lieuId);
      const refus = verifierLieuPourMoi(lieu);
      if (refus || !lieu) return refus ?? INTROUVABLE;
      return { ok: true, creneaux: listerCreneauxReservation(lieu.ouverture, jour, new Date(ctx.maintenant())) };
    },

    async reserver(demande) {
      if (!ctx.lireClient()) return SANS_COMPTE;
      const lieu = trouverLieu(demande.lieuId);
      const refus = verifierLieuPourMoi(lieu);
      if (refus || !lieu) return refus ?? INTROUVABLE;
      const pepin = consommerPepin(["hors-ligne", "refus-lieu"]);
      const echecPepin = traduirePepinDemo(pepin, lieu.nom);
      if (echecPepin) return echecPepin;
      const reponse = await ctx.magasin.modifier((m, maintenantMs) => creerDemande(m, lieu, demande, maintenantMs));
      if (!reponse.ok) return reponse;
      if (pepin === "refus-lieu") planifierReponseReservationDemo(ctx, reponse.reservation, { type: "refuser", motif: "complet" }, REFUS_PEPIN_MS);
      else if (repondSeul(lieu.id)) planifierReponseReservationDemo(ctx, reponse.reservation, { type: "accepter" }, REPONSE_AUTO_MS);
      return reponse;
    },

    async listerReservations() {
      if (!ctx.lireClient()) return { ok: true, reservations: [] };
      return ctx.magasin.lire((m) => ({
        ok: true,
        reservations: m.reservations
          .filter((r) => r.client === "moi")
          .sort((a, b) => Date.parse(b.creneau) - Date.parse(a.creneau))
          .map(convertirReservationDemo),
      }));
    },

    async lireReservation(id) {
      if (!ctx.lireClient()) return SANS_COMPTE;
      return ctx.magasin.lire((m): ReponseReservation => {
        const r = trouverLaMienne(m, id);
        return r ? { ok: true, reservation: convertirReservationDemo(r) } : INTROUVABLE;
      });
    },

    async annulerReservation(id) {
      const client = ctx.lireClient();
      if (!client) return SANS_COMPTE;
      return ctx.magasin.modifier((m, maintenantMs): ReponseReservation => {
        const r = trouverLaMienne(m, id);
        if (!r) return INTROUVABLE;
        const decision = deciderReservationDemo(m, r, { type: "annuler-client" }, { maintenantMs, client, delaiAvisMs: lireDelaiAvisDemo(ctx.lireReglages()) });
        return decision.ok ? { ok: true, reservation: convertirReservationDemo(r) } : { ok: false, erreur: decision.erreur };
      });
    },

    async signalerPresence(id, position) {
      const client = ctx.lireClient();
      if (!client) return SANS_COMPTE;
      const reponse = await ctx.magasin.modifier((m, maintenantMs) => {
        const r = trouverLaMienne(m, id);
        const lieu = r ? trouverLieu(r.lieuId) : undefined;
        if (!r || !lieu) return INTROUVABLE;
        const essai = faireEvoluerReservation(r, { type: "presence" }, maintenantMs);
        if (!essai.ok) return { ok: false as const, erreur: essai.erreur };
        const echec = traduirePepinDemo(consommerPepin(["hors-zone", "position-imprecise", "hors-ligne"]), lieu.nom) ?? verifierPositionDemo(position, lieu);
        if (echec) return echec;
        const faite = deciderReservationDemo(m, r, { type: "presence" }, { maintenantMs, client, delaiAvisMs: lireDelaiAvisDemo(ctx.lireReglages()) });
        if (!faite.ok) return { ok: false as const, erreur: faite.erreur };
        const validation = faite.visite ? construireResultatValidationDemo(m, faite.visite, client, { recompenseGagnee: faite.recompenseGagnee }) : null;
        return { ok: true as const, reservation: convertirReservationDemo(r), validation };
      });
      if (reponse.ok && reponse.reservation.statut === "acceptee" && repondSeul(reponse.reservation.lieu.id)) {
        const venuPossibleDansMs = Date.parse(reponse.reservation.creneau) - VENU_AVANT_CRENEAU_MS - ctx.maintenant();
        planifierReponseReservationDemo(ctx, reponse.reservation, { type: "venu" }, Math.max(REPONSE_AUTO_MS, venuPossibleDansMs));
      }
      return reponse;
    },
  };
}
