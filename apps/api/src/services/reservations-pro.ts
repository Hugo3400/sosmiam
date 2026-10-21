// Les réservations côté équipe du lieu (routes /pro/comptoir/…, voir routes/comptoir.ts) : la liste du jour et à venir,
// accepter (code d'arrivée à 4 chiffres), refuser ou annuler (motifs fermés), « Venu » et « Pas venu ». Le lieu est
// toujours relu sur la réservation, jamais pris dans la demande ; le rôle (gérant ou équipe) est revérifié à chaque
// geste. L'équipe ne voit que le prénom, l'initiale et l'emoji du client.
import { calculerMargeExpirationReservation } from "../../../../packages/commun/src/fonctions/reservations/calculer-marge-expiration-reservation.ts";
import { verifierAcceptationHoraire } from "../../../../packages/commun/src/fonctions/reservations/verifier-acceptation-horaire.ts";
import { calculerJourParis } from "../../../../packages/commun/src/fonctions/temps/calculer-jour-paris.ts";
import { choisirCodeAddition } from "../../../../packages/commun/src/fonctions/visites/choisir-code-addition.ts";
import type {
  EvenementReservation, MotifRefusReservation, ReglesTransitionReservation, ReservationPro,
} from "../../../../packages/commun/src/types/reservation.ts";
import { calculerFenetreArrivees } from "../fonctions/reservations/calculer-fenetre-arrivees.ts";
import { deciderReservation } from "../fonctions/reservations/decider-reservation.ts";
import { presenterReservationPro } from "../fonctions/reservations/presenter-reservation-pro.ts";
import { presenterClientComptoir } from "../fonctions/visites/presenter-client-comptoir.ts";
import type { RoleRattachement } from "./pro-regles.ts";
import {
  RESERVATIONS_AU_COMPTOIR, type ChampsReservation, type EchecReservation, type LigneReservation, type ReponseReservation,
} from "./reservations-regles.ts";
import { creerOutilsReservations, type CapaciteLue } from "./reservations-outils.ts";
import type { PointsAPoser } from "./visites-client.ts";
import type { TablesVisites } from "./visites-regles.ts";
import { creerOutilsVisites, type ContexteVisites } from "./visites-outils.ts";

export type ContexteReservationsPro = ContexteVisites & {
  /** comptoir.roleDe : rattachement VALIDÉ au lieu (null sinon) */
  roleDe: (compteId: number, lieuId: number) => Promise<RoleRattachement | null>;
};

type ReponseGeste = { ok: true; reservation: ReservationPro; pointsAPoser: PointsAPoser; reponseLieu: ReponseReservation | null } | EchecReservation;

export type ChoixAcceptation = { creneau: string | null; depasser: boolean };

type Preparation = { ok: true; champs: ChampsReservation; regles: ReglesTransitionReservation } | EchecReservation;

const RIEN_A_PREPARER: Preparation = { ok: true, champs: {}, regles: {} };

const REPONSES_AU_CLIENT: ReadonlySet<EvenementReservation["type"]> = new Set(["accepter", "refuser", "annuler-lieu"]);

export function creerReservationsPro(c: ContexteReservationsPro) {
  const o = creerOutilsVisites(c);
  const outils = creerOutilsReservations(c);

  /** Les réservations telles que l'équipe les voit */
  async function presenterPourLeLieu(t: TablesVisites, lignes: LigneReservation[], capacite?: CapaciteLue): Promise<ReservationPro[]> {
    const comptes = await t.lireComptes([...new Set(lignes.map((r) => r.compteId))]);
    return lignes.map((r) => presenterReservationPro(r, presenterClientComptoir(comptes.get(r.compteId), c.chiffrement), capacite));
  }

  async function decrireReponse(t: TablesVisites, r: LigneReservation, evenement: EvenementReservation, compteId: number): Promise<ReponseReservation | null> {
    if (!REPONSES_AU_CLIENT.has(evenement.type) || r.compteId === compteId) return null;
    if (r.statut !== "acceptee" && r.statut !== "refusee" && r.statut !== "annulee") return null;
    const lieu = (await t.resumerLieux([r.lieuId])).get(r.lieuId) ?? o.lieuDisparu(r.lieuId);
    return { compteId: r.compteId, lieu, creneau: r.creneau, statut: r.statut, motif: r.motifRefus };
  }

  /**
   * Un geste de l'équipe du lieu de la réservation : rôle vérifié sur la ressource, compte du client verrouillé puis
   * réservation relue, transition de packages/commun, visite créée si « Venu » rejoint « Je suis là ». `preparer` : des
   * champs à écrire avec la transition (le code d'arrivée).
   */
  function agir(
    compteId: number, id: number, evenement: EvenementReservation, preparer?: (t: TablesVisites, r: LigneReservation, maintenant: Date) => Promise<Preparation>,
  ): Promise<ReponseGeste> {
    return c.depot.ecrire(async (t) => {
      const maintenant = o.maintenant();
      const avant = await t.lireReservation(id);
      if (!avant) return o.echec("introuvable");
      if (!(await c.roleDe(compteId, avant.lieuId))) return o.echec("role-requis");
      await t.verrouillerCompte(avant.compteId);
      await t.verrouillerReservation(id);
      await t.expirerReservations(maintenant, { reservationId: id });
      const r = await t.lireReservation(id);
      if (!r) return o.echec("introuvable");
      if (r.statut === "expiree") return o.echec("delai-depasse");
      const preparation = preparer ? await preparer(t, r, maintenant) : RIEN_A_PREPARER;
      if (!preparation.ok) return preparation;
      const decision = await deciderReservation(t, r, evenement, maintenant, compteId, preparation.champs, preparation.regles);
      if (!decision.ok) return o.echec(decision.erreur);
      const nee = decision.creerVisite ? await outils.honorer(t, decision.reservation, maintenant) : null;
      const [reservation] = await presenterPourLeLieu(t, [decision.reservation]);
      const reponseLieu = await decrireReponse(t, decision.reservation, evenement, compteId);
      return { ok: true, reservation, pointsAPoser: { compteId: r.compteId, points: nee?.points ?? [] }, reponseLieu };
    });
  }

  async function preparerAcceptation(t: TablesVisites, r: LigneReservation, maintenant: Date, choix: ChoixAcceptation): Promise<Preparation> {
    if (r.statut !== "demandee") return RIEN_A_PREPARER;
    await t.verrouillerLieu(r.lieuId);
    const { reglages, occupees } = await outils.lireCapacite(t, r.lieuId, calculerJourParis(r.creneau.getTime()), maintenant);
    const demande = { creneau: r.creneau.toISOString(), creneauxProposes: r.creneauxProposes.map((x) => x.toISOString()), personnes: r.personnes };
    const horaire = verifierAcceptationHoraire(demande, choix.creneau, { reglages, occupees, maintenant }, choix.depasser);
    if (!horaire.ok) return "places" in horaire && horaire.places !== null ? outils.echec(horaire.erreur, { places: horaire.places }) : outils.echec(horaire.erreur);
    const code = choisirCodeAddition(await t.listerCodesPris(r.lieuId, maintenant), c.tirer);
    return { ok: true, champs: { code, creneau: new Date(horaire.creneau) }, regles: { expirationAvantCreneauMs: calculerMargeExpirationReservation(reglages) } };
  }

  return {
    /** GET /pro/comptoir/lieux/:id/reservations : celles du jour (et de la soirée d'hier tant que « Venu » est possible) et à venir */
    lister(compteId: number, lieuId: number): Promise<{ ok: true; reservations: ReservationPro[] } | EchecReservation> {
      return c.depot.lire(async (t) => {
        if (!(await c.roleDe(compteId, lieuId))) return o.echec("role-requis");
        const maintenant = o.maintenant();
        await t.expirerReservations(maintenant, { lieuId });
        const { depuis } = calculerFenetreArrivees(maintenant);
        const lignes = await t.listerReservations({ lieuId, creneauDepuis: depuis, limite: RESERVATIONS_AU_COMPTOIR });
        const capacite = await outils.lireCapaciteAVenir(t, lieuId, maintenant, depuis);
        return { ok: true, reservations: await presenterPourLeLieu(t, lignes, capacite) };
      });
    },

    accepter(compteId: number, id: number, choix: ChoixAcceptation = { creneau: null, depasser: false }): Promise<ReponseGeste> {
      return agir(compteId, id, { type: "accepter" }, (t, r, maintenant) => preparerAcceptation(t, r, maintenant, choix));
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
