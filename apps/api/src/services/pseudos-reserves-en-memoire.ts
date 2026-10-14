// Pseudos libérés, réservés 30 jours, en mémoire (tests et API de démonstration) : mêmes règles que pseudos-reserves.ts
// (pseudos-reserves-regles.ts). Branché sur les comptes en mémoire (comptes-en-memoire.ts), qui le donnent aux tests.
import { normaliserPseudo } from "../fonctions/comptes/normaliser-pseudo.ts";
import { calculerFinReservation, type EstPseudoReserve, type RaisonReservationPseudo } from "./pseudos-reserves-regles.ts";

/** Une ligne de pseudos_reserves (moments en millisecondes) */
export type ReservationPseudoEnMemoire = { compteId: number | null; reserveJusquLe: number; raison: RaisonReservationPseudo; creeLe: number };

/** `pseudoPorte` : vrai si un compte porte ce pseudo aujourd'hui */
export function creerPseudosReservesEnMemoire(pseudoPorte: (pseudo: string) => boolean, horloge: () => number = Date.now) {
  const reservations = new Map<string, ReservationPseudoEnMemoire>();
  const active = (pseudo: string, maintenant: number) => {
    const reservation = reservations.get(pseudo);
    return reservation && reservation.reserveJusquLe > maintenant ? reservation : null;
  };

  const estPseudoReserve: EstPseudoReserve = async (pseudo, maintenant = new Date(horloge())) => {
    const forme = normaliserPseudo(pseudo);
    return forme !== "" && active(forme, maintenant.getTime()) !== null && !pseudoPorte(forme);
  };

  return {
    /** Les réservations elles-mêmes, que les tests peuvent lire ou retoucher */
    reservations,
    /** Réserve 30 jours (une réservation existante est remplacée et prolongée) */
    reserver(pseudo: string, compteId: number | null, raison: RaisonReservationPseudo, maintenant = horloge()) {
      reservations.set(pseudo, { compteId, raison, reserveJusquLe: calculerFinReservation(new Date(maintenant)).getTime(), creeLe: maintenant });
    },
    /** Vrai si réservé, pas expiré, pour un autre compte que `compteId` ou pour personne */
    reservePourUnAutre(pseudo: string, compteId: number | undefined, maintenant = horloge()): boolean {
      const reservation = active(pseudo, maintenant);
      return reservation !== null && (reservation.compteId === null || reservation.compteId !== compteId);
    },
    /** Pseudo repris par son ancien titulaire : la réservation part */
    retirer(pseudo: string) {
      reservations.delete(pseudo);
    },
    /** Compte supprimé : ses réservations restent, sans lui (ON DELETE SET NULL) */
    oublierCompte(compteId: number) {
      for (const reservation of reservations.values()) if (reservation.compteId === compteId) reservation.compteId = null;
    },
    estPseudoReserve,
    /** Ménage de nuit : efface les réservations expirées ; rend leur nombre */
    effacerExpires(maintenant = new Date(horloge())): number {
      let effacees = 0;
      for (const [pseudo, reservation] of reservations) {
        if (reservation.reserveJusquLe <= maintenant.getTime()) {
          reservations.delete(pseudo);
          effacees += 1;
        }
      }
      return effacees;
    },
  };
}

export type PseudosReservesEnMemoire = ReturnType<typeof creerPseudosReservesEnMemoire>;
