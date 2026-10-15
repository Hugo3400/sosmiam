import type {
  EffetReservation,
  EtatReservationPourTransition,
  EvenementReservation,
  ReglesTransitionReservation,
  StatutReservation,
  TransitionReservation,
} from "../../types/reservation.ts";
import {
  ABSENT_APRES_CRENEAU_MS,
  EXPIRATION_AVANT_CRENEAU_MS,
  PRESENCE_APRES_CRENEAU_MS,
  PRESENCE_AVANT_CRENEAU_MS,
  VENU_APRES_CRENEAU_MS,
  VENU_AVANT_CRENEAU_MS,
} from "../../regles/reservations.ts";
import { estAnnulationTardive } from "./est-annulation-tardive.ts";

const INTERDITE: TransitionReservation = { ok: false, erreur: "transition-interdite" };
const DELAI_DEPASSE: TransitionReservation = { ok: false, erreur: "delai-depasse" };
const HORS_FENETRE: TransitionReservation = { ok: false, erreur: "hors-fenetre-presence" };

/**
 * Fait évoluer une réservation (machine à états partagée par la démo et l'API). Ne modifie rien : rend le nouvel état
 * et les effets à appliquer (créer la visite, contrôle), ou une erreur. `creneau` est un instant ISO.
 * - demandee : accepter (jusqu'au créneau − la marge d'expiration, 30 min sauf `regles.expirationAvantCreneauMs`, sinon
 *   delai-depasse) → acceptee ; refuser → refusee ; annuler-client → annulee ; expirer (à partir du créneau − cette marge) → expiree.
 * - acceptee : venu (créneau − 30 min à + 4 h) → honoree, et la visite seulement si « Je suis là » est fait ;
 *   absent (à partir du créneau + 30 min) → absent ; annuler-client (avant le créneau) → annulee, tardive à moins de
 *   2 h sauf dans les 15 min qui suivent `reponduLe` ; annuler-lieu (avant le créneau) → annulee ; presence (créneau − 1 h
 *   à + 4 h) → reste acceptee, avec l'heure de présence.
 * - honoree sans présence : presence dans la même plage → la visite est créée.
 * Tout le reste, et une date de créneau illisible : transition-interdite. Une présence déjà notée ne se refait pas.
 */
export function faireEvoluerReservation(
  r: EtatReservationPourTransition,
  e: EvenementReservation,
  maintenantMs: number,
  regles: ReglesTransitionReservation = {},
): TransitionReservation {
  const creneauMs = Date.parse(r.creneau);
  if (Number.isNaN(creneauMs)) return INTERDITE;
  const expiration = regles.expirationAvantCreneauMs ?? EXPIRATION_AVANT_CRENEAU_MS;
  const maintenant = new Date(maintenantMs).toISOString();
  const passer = (
    statut: StatutReservation,
    effets: EffetReservation[] = [],
    o: { tardive?: boolean; presenceLe?: string } = {},
  ): TransitionReservation => ({ ok: true, statut, presenceLe: o.presenceLe ?? r.presenceLe, tardive: o.tardive ?? false, effets });
  const dansFenetrePresence =
    maintenantMs >= creneauMs - PRESENCE_AVANT_CRENEAU_MS && maintenantMs <= creneauMs + PRESENCE_APRES_CRENEAU_MS;

  if (r.statut === "demandee") {
    switch (e.type) {
      case "accepter":
        return maintenantMs < creneauMs - expiration ? passer("acceptee") : DELAI_DEPASSE;
      case "refuser":
        return passer("refusee");
      case "annuler-client":
        return passer("annulee");
      case "expirer":
        return maintenantMs >= creneauMs - expiration ? passer("expiree") : INTERDITE;
      default:
        return INTERDITE;
    }
  }

  if (r.statut === "acceptee") {
    switch (e.type) {
      case "venu":
        if (maintenantMs < creneauMs - VENU_AVANT_CRENEAU_MS) return INTERDITE;
        if (maintenantMs > creneauMs + VENU_APRES_CRENEAU_MS) return DELAI_DEPASSE;
        return passer("honoree", r.presenceLe !== null ? [{ type: "creer-visite" }] : []);
      case "absent":
        return maintenantMs >= creneauMs + ABSENT_APRES_CRENEAU_MS
          ? passer("absent", [{ type: "controle", motif: "absence-reservation" }])
          : INTERDITE;
      case "annuler-client": {
        if (maintenantMs >= creneauMs) return DELAI_DEPASSE;
        const tardive = estAnnulationTardive(creneauMs, r.reponduLe ? Date.parse(r.reponduLe) : null, maintenantMs);
        return passer("annulee", tardive ? [{ type: "controle", motif: "annulation-tardive" }] : [], { tardive });
      }
      case "annuler-lieu":
        return maintenantMs >= creneauMs ? DELAI_DEPASSE : passer("annulee");
      case "presence":
        if (r.presenceLe !== null) return INTERDITE;
        return dansFenetrePresence ? passer("acceptee", [], { presenceLe: maintenant }) : HORS_FENETRE;
      default:
        return INTERDITE;
    }
  }

  if (r.statut === "honoree" && e.type === "presence" && r.presenceLe === null) {
    return dansFenetrePresence ? passer("honoree", [{ type: "creer-visite" }], { presenceLe: maintenant }) : HORS_FENETRE;
  }

  return INTERDITE;
}
