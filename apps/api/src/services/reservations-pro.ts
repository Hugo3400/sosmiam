// Les réservations côté équipe du lieu (routes /pro/comptoir/…, voir routes/comptoir.ts) : la liste du jour et à venir,
// accepter (code d'arrivée à 4 chiffres), refuser ou annuler (motifs fermés), « Venu » et « Pas venu ». Le lieu est
// toujours relu sur la réservation, jamais pris dans la demande ; le rôle (gérant ou équipe, 18 ans) est revérifié à
// chaque geste. L'équipe ne voit que le prénom, l'initiale et l'emoji du client.
import { choisirCodeAddition } from "../../../../packages/commun/src/fonctions/visites/choisir-code-addition.ts";
import type { EvenementReservation, MotifRefusReservation, ReservationPro } from "../../../../packages/commun/src/types/reservation.ts";
import { calculerFenetreArrivees } from "../fonctions/reservations/calculer-fenetre-arrivees.ts";
import { deciderReservation } from "../fonctions/reservations/decider-reservation.ts";
import { presenterReservationPro } from "../fonctions/reservations/presenter-reservation-pro.ts";
import { presenterClientComptoir } from "../fonctions/visites/presenter-client-comptoir.ts";
import type { RoleRattachement } from "./pro-regles.ts";
import { RESERVATIONS_AU_COMPTOIR, type ChampsReservation, type EchecReservation, type LigneReservation } from "./reservations-regles.ts";
import { creerOutilsReservations } from "./reservations-outils.ts";
import type { PointsAPoser } from "./visites-client.ts";
import type { TablesVisites } from "./visites-regles.ts";
import { creerOutilsVisites, type ContexteVisites } from "./visites-outils.ts";

export type ContexteReservationsPro = ContexteVisites & {
  /** comptoir.roleDe : rattachement VALIDÉ au lieu et 18 ans (null sinon) */
  roleDe: (compteId: number, lieuId: number) => Promise<RoleRattachement | null>;
};

type ReponseGeste = { ok: true; reservation: ReservationPro; pointsAPoser: PointsAPoser } | EchecReservation;

export function creerReservationsPro(c: ContexteReservationsPro) {
  const o = creerOutilsVisites(c);
  const outils = creerOutilsReservations(c);

  /** Les réservations telles que l'équipe les voit */
  async function presenterPourLeLieu(t: TablesVisites, lignes: LigneReservation[]): Promise<ReservationPro[]> {
    const comptes = await t.lireComptes([...new Set(lignes.map((r) => r.compteId))]);
    return lignes.map((r) => presenterReservationPro(r, presenterClientComptoir(comptes.get(r.compteId), c.chiffrement)));
  }

  /**
   * Un geste de l'équipe du lieu de la réservation : rôle vérifié sur la ressource, compte du client verrouillé puis
   * réservation relue, transition de packages/commun, visite créée si « Venu » rejoint « Je suis là ». `preparer` : des
   * champs à écrire avec la transition (le code d'arrivée).
   */
  function agir(compteId: number, id: number, evenement: EvenementReservation, preparer?: (t: TablesVisites, r: LigneReservation) => Promise<ChampsReservation>): Promise<ReponseGeste> {
    return c.depot.ecrire(async (t) => {
      const maintenant = o.maintenant();
      const avant = await t.lireReservation(id);
      if (!avant) return o.echec("introuvable");
      if (!(await c.roleDe(compteId, avant.lieuId))) return o.echec("role-requis");
      await t.verrouillerCompte(avant.compteId);
      await t.expirerReservations(maintenant);
      const r = await t.lireReservation(id);
      if (!r) return o.echec("introuvable");
      // Restée sans réponse jusqu'à 30 min du créneau : c'est trop tard, pas « déjà réglé »
      if (r.statut === "expiree") return o.echec("delai-depasse");
      const enPlus = preparer ? await preparer(t, r) : {};
      const decision = await deciderReservation(t, r, evenement, maintenant, compteId, enPlus);
      if (!decision.ok) return o.echec(decision.erreur);
      const nee = decision.creerVisite ? await outils.honorer(t, decision.reservation, maintenant) : null;
      const [reservation] = await presenterPourLeLieu(t, [decision.reservation]);
      return { ok: true, reservation, pointsAPoser: { compteId: r.compteId, points: nee?.points ?? [] } };
    });
  }

  return {
    /** GET /pro/comptoir/lieux/:id/reservations : celles du jour (et de la soirée d'hier tant que « Venu » est possible) et à venir */
    lister(compteId: number, lieuId: number): Promise<{ ok: true; reservations: ReservationPro[] } | EchecReservation> {
      return c.depot.lire(async (t) => {
        if (!(await c.roleDe(compteId, lieuId))) return o.echec("role-requis");
        const maintenant = o.maintenant();
        await t.expirerReservations(maintenant);
        const lignes = await t.listerReservations({ lieuId, creneauDepuis: calculerFenetreArrivees(maintenant).depuis, limite: RESERVATIONS_AU_COMPTOIR });
        return { ok: true, reservations: await presenterPourLeLieu(t, lignes) };
      });
    },

    /** POST /pro/comptoir/reservations/:id/accepter : jusqu'à 30 min avant le créneau ; un code d'arrivée libre chez le lieu */
    accepter(compteId: number, id: number): Promise<ReponseGeste> {
      return agir(compteId, id, { type: "accepter" }, async (t, r) => {
        await t.verrouillerLieu(r.lieuId);
        return { code: choisirCodeAddition(await t.listerCodesPris(r.lieuId, o.maintenant()), c.tirer) };
      });
    },

    /** POST /pro/comptoir/reservations/:id/refuser { motif } */
    refuser(compteId: number, id: number, motif: MotifRefusReservation): Promise<ReponseGeste> {
      return agir(compteId, id, { type: "refuser", motif });
    },

    /** POST /pro/comptoir/reservations/:id/annuler { motif } : une réservation acceptée que le lieu ne peut plus honorer */
    annuler(compteId: number, id: number, motif: MotifRefusReservation): Promise<ReponseGeste> {
      return agir(compteId, id, { type: "annuler-lieu", motif });
    },

    /** POST /pro/comptoir/reservations/:id/venu : de 30 min avant le créneau à 4 h après ; la visite compte avec « Je suis là » */
    marquerVenu(compteId: number, id: number): Promise<ReponseGeste> {
      return agir(compteId, id, { type: "venu" });
    },

    /** POST /pro/comptoir/reservations/:id/absent : à partir de 30 min après le créneau */
    marquerAbsent(compteId: number, id: number): Promise<ReponseGeste> {
      return agir(compteId, id, { type: "absent" });
    },
  };
}
