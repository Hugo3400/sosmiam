// Ce que partagent les réservations côté client et côté équipe : les refus propres aux réservations, et la visite créée
// quand « Venu » et « Je suis là » sont réunis (mêmes effets qu'une visite validée au comptoir).
import type { DetailsErreur } from "../../../../packages/commun/src/client-api/reponse-api.ts";
import type { ReglementVisite } from "../../../../packages/commun/src/types/visite.ts";
import { creerVisiteValidee, type VisiteValidee } from "../fonctions/visites/creer-visite-validee.ts";
import type { EchecReservation, ErreurReservation, LigneReservation } from "./reservations-regles.ts";
import type { LieuVisite, TablesVisites } from "./visites-regles.ts";
import { creerOutilsVisites, type ContexteVisites, type Visiteur } from "./visites-outils.ts";

/** Une réservation honorée se lit « payée » : « Venu » se touche à l'arrivée, avant l'addition (voir docs/decisions.md) */
const payee = (): ReglementVisite => ({ type: "paye", reductionPourcent: null, avantages: [] });

export function creerOutilsReservations(c: ContexteVisites) {
  const o = creerOutilsVisites(c);
  const echec = (erreur: ErreurReservation, details?: DetailsErreur): EchecReservation => (details ? { ok: false, erreur, details } : { ok: false, erreur });

  return {
    echec,

    /**
     * Peut-on réserver chez ce lieu ? Un bar n'existe pas pour un 15-17 ans (son nom n'est jamais rendu) ; le lieu prend les
     * réservations dans l'app et il est vérifié (un compte pro pour répondre) ; on ne réserve pas chez soi. null si oui.
     */
    verifierLieu(lieu: LieuVisite, v: Visiteur): EchecReservation | null {
      if (lieu.type === "bar" && !v.majeur) return echec("mineur-bar");
      if (!lieu.reservable || !lieu.verifie) return echec("lieu-non-reservable", { lieu: lieu.nom });
      if (v.rattachements.some((r) => r.lieuId === lieu.id)) return echec("membre-du-lieu");
      return null;
    },

    /**
     * La visite d'une réservation où « Venu » et « Je suis là » sont réunis (position déjà vérifiée), dans la transaction :
     * mêmes droits qu'une visite (le lieu valide les visites, pas de bar avant 18 ans, pas chez soi, e-mail vérifié), une
     * seule par réservation. +25 au lieu de +15 si un SOS était en cours à la demande de réservation et que le créneau
     * tombe avant sa fin prévue. null : pas de visite (droits, lieu plus publié, déjà créée). `majeur` : le client.
     */
    async honorer(t: TablesVisites, r: LigneReservation, maintenant: Date): Promise<(VisiteValidee & { majeur: boolean }) | null> {
      const lieu = await t.lireLieu(r.lieuId, maintenant);
      if (!lieu) return null;
      const visiteur = await o.lireVisiteur(t, r.compteId);
      if (o.verifierDroits(lieu, visiteur) ?? o.verifierEmail(visiteur)) return null;
      const [deja] = await t.listerVisites({ compteId: r.compteId, reservationIds: [r.id], limite: 1 });
      if (deja) return null;
      const sos = await t.lireSosA(r.lieuId, r.creeLe);
      const validee = await creerVisiteValidee(t, {
        compteId: r.compteId, lieuId: r.lieuId, mode: "reservation", pendantSos: sos !== null && r.creneau <= sos.jusqua,
        // Le membre de l'équipe qui a touché « Venu » : on sait qui a validé quoi
        decideParId: r.reponduParId, presentationId: null, reservationId: r.id, reglement: payee(),
      }, maintenant, visiteur.majeur);
      return { ...validee, majeur: visiteur.majeur };
    },

    /**
     * Les visites nées des réservations de ce compte : identifiant de la réservation → identifiant de la visite (le compte
     * sert d'index : la table des visites n'en a pas sur la réservation)
     */
    async lireVisitesNees(t: TablesVisites, compteId: number, reservationIds: number[]): Promise<Map<number, number>> {
      if (reservationIds.length === 0) return new Map();
      const visites = await t.listerVisites({ compteId, reservationIds });
      return new Map(visites.flatMap((v) => (v.reservationId === null ? [] : [[v.reservationId, v.id] as const])));
    },
  };
}
