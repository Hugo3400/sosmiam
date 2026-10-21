import type { ReglagesReservationsLus } from "../../../../packages/commun/src/client-api/contrat-reglages-reservations.ts";
import { changerJoursFermes } from "../../../../packages/commun/src/fonctions/reservations/changer-jours-fermes.ts";
import { listerReservationsARevoir } from "../../../../packages/commun/src/fonctions/reservations/lister-reservations-a-revoir.ts";
import { calculerInstantParis } from "../../../../packages/commun/src/fonctions/temps/calculer-instant-paris.ts";
import { calculerJourParis } from "../../../../packages/commun/src/fonctions/temps/calculer-jour-paris.ts";
import { REGLAGES_RESERVATIONS_DEFAUT } from "../../../../packages/commun/src/regles/reglages-reservations.ts";
import type { ReglagesReservations, ReservationAComparer } from "../../../../packages/commun/src/types/reglages-reservations.ts";
import { validerReglagesReservations } from "../../../../packages/commun/src/validation/valider-reglages-reservations.ts";
import type { ContexteReservationsPro } from "./reservations-pro.ts";
import type { EchecReservation, LigneReservation } from "./reservations-regles.ts";
import type { TablesVisites } from "./visites-regles.ts";
import { creerOutilsVisites } from "./visites-outils.ts";

export type ReponseReglagesLus = ({ ok: true } & ReglagesReservationsLus) | EchecReservation;

const versAComparer = (r: LigneReservation): ReservationAComparer => ({
  id: r.id, creneau: r.creneau.toISOString(), creneauxProposes: r.creneauxProposes.map((x) => x.toISOString()), personnes: r.personnes, statut: r.statut,
});

const reglagesParDefaut = (): ReglagesReservations => ({ ...REGLAGES_RESERVATIONS_DEFAUT, services: [], joursFermes: [] });

export function creerReglagesReservations(c: ContexteReservationsPro) {
  const o = creerOutilsVisites(c);

  async function presenter(t: TablesVisites, lieuId: number, maintenant: Date): Promise<ReponseReglagesLus> {
    const [enregistres, lieu] = await Promise.all([t.lireReglagesReservations(lieuId, maintenant), t.lireLieu(lieuId, maintenant)]);
    const reglages = enregistres ?? reglagesParDefaut();
    const minuit = new Date(calculerInstantParis(calculerJourParis(maintenant.getTime()), "00:00"));
    const lignes = await t.listerReservations({ lieuId, statuts: ["demandee", "acceptee", "honoree"], creneauDepuis: minuit });
    return {
      ok: true,
      reglages,
      regle: enregistres !== null,
      aRevoir: listerReservationsARevoir(reglages, lignes.map(versAComparer), maintenant),
      reservable: lieu !== null && lieu.reservable && lieu.verifie,
      ouverture: lieu?.ouverture ?? [],
    };
  }

  return {
    lire(compteId: number, lieuId: number): Promise<ReponseReglagesLus> {
      return c.depot.lire(async (t) => {
        if (!(await c.roleDe(compteId, lieuId))) return o.echec("role-requis");
        return presenter(t, lieuId, o.maintenant());
      });
    },

    regler(compteId: number, lieuId: number, brut: unknown): Promise<ReponseReglagesLus> {
      return c.depot.ecrire(async (t) => {
        if ((await c.roleDe(compteId, lieuId)) !== "gerant") return o.echec("role-requis");
        const valide = validerReglagesReservations(brut);
        if (!valide.ok) return { ok: false, erreur: "reglages-invalides", champ: valide.champ };
        const maintenant = o.maintenant();
        await t.verrouillerLieu(lieuId);
        await t.ecrireReglagesReservations(lieuId, valide.reglages, maintenant);
        return presenter(t, lieuId, maintenant);
      });
    },

    fermerJour(compteId: number, lieuId: number, jour: string, ferme: boolean): Promise<ReponseReglagesLus> {
      return c.depot.ecrire(async (t) => {
        if (!(await c.roleDe(compteId, lieuId))) return o.echec("role-requis");
        const maintenant = o.maintenant();
        await t.verrouillerLieu(lieuId);
        const actuels = (await t.lireReglagesReservations(lieuId, maintenant))?.joursFermes ?? [];
        const change = changerJoursFermes(actuels, jour, ferme, maintenant);
        if (!change.ok) return { ok: false, erreur: change.champ === "jour" ? "champ-invalide" : "reglages-invalides", champ: change.champ };
        if (change.joursFermes.join(",") !== actuels.join(",")) await t.ecrireJoursFermes(lieuId, change.joursFermes, maintenant);
        return presenter(t, lieuId, maintenant);
      });
    },
  };
}
