import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { listerReservationsARevoir } from "@sos-miam/commun/fonctions/reservations/lister-reservations-a-revoir";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { ReglagesReservations, ReglagesServicesReservations, ReservationAComparer } from "@sos-miam/commun/types/reglages-reservations";
import type { ReservationPro } from "@sos-miam/commun/types/reservation";

import { AVERTISSEMENTS_REGLAGES, AVERTISSEMENTS_REGLAGES_PAR_LANGUE, TEXTES_AVERTISSEMENTS_REGLAGES_PAR_LANGUE } from "~/contenus/textes-reglages-reservations";
import { ecrireNombrePersonnesLangue } from "~/fonctions/langue/ecrire-nombre-personnes-langue";
import { compterDemandesARepondre } from "~/fonctions/reservations/compter-demandes-a-repondre";
import { decrireCreneauReservation } from "~/fonctions/reservations/decrire-creneau-reservation";
import { nommerClientReservation } from "~/fonctions/reservations/nommer-client-reservation";

export type AvertissementReglages = { cle: string; emoji: string; texte: string };

export type ReglagesAComparer = { avant: ReglagesServicesReservations; apres: ReglagesServicesReservations; joursFermes: readonly string[] };

const comparer = (r: ReservationPro): ReservationAComparer => ({
  id: r.id,
  creneau: r.creneau,
  creneauxProposes: r.statut === "demandee" ? r.propositions.map((p) => p.creneau) : undefined,
  personnes: r.personnes,
  statut: r.statut,
});

export function listerAvertissementsReglages(reglages: ReglagesAComparer, reservations: readonly ReservationPro[], maintenantMs: number, langue: Langue): AvertissementReglages[] {
  const T = choisirTextes(TEXTES_AVERTISSEMENTS_REGLAGES_PAR_LANGUE, langue);
  const modeles = choisirTextes(AVERTISSEMENTS_REGLAGES_PAR_LANGUE, langue);
  const maintenant = new Date(maintenantMs);
  const comparees = reservations.map(comparer);
  const lire = (r: ReglagesServicesReservations): ReglagesReservations => ({ ...r, joursFermes: [...reglages.joursFermes] });
  const dejaLa = new Set(listerReservationsARevoir(lire(reglages.avant), comparees, maintenant).map((a) => `${a.id}-${a.raison}`));
  const avertissements = listerReservationsARevoir(lire(reglages.apres), comparees, maintenant)
    .filter((a) => !dejaLa.has(`${a.id}-${a.raison}`))
    .flatMap((a): AvertissementReglages[] => {
      const r = reservations.find((x) => x.id === a.id);
      if (!r) return [];
      const quoi = remplirModele(r.statut === "demandee" ? T.demande : T.table, { nom: nommerClientReservation(r) });
      const texte = remplirModele(modeles[a.raison].texte, {
        quand: decrireCreneauReservation(a.creneau, maintenantMs, langue).lu,
        quoi,
        personnes: ecrireNombrePersonnesLangue(r.personnes, langue),
      });
      return [{ cle: `${a.id}-${a.raison}`, emoji: AVERTISSEMENTS_REGLAGES[a.raison].emoji, texte }];
    });
  const enAttente = reglages.avant.acceptation === "manuelle" && reglages.apres.acceptation === "automatique" ? compterDemandesARepondre(reservations, maintenantMs) : 0;
  if (enAttente === 0) return avertissements;
  const demandes = enAttente === 1 ? T.demandesUn : remplirModele(T.demandesPlusieurs, { nombre: String(enAttente) });
  return [...avertissements, { cle: "demandes-en-attente", emoji: "📬", texte: demandes }];
}
