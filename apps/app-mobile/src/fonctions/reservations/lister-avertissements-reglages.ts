import { listerReservationsARevoir } from "@sos-miam/commun/fonctions/reservations/lister-reservations-a-revoir";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { ReglagesReservations, ReglagesServicesReservations, ReservationAComparer } from "@sos-miam/commun/types/reglages-reservations";
import type { ReservationPro } from "@sos-miam/commun/types/reservation";

import { AVERTISSEMENTS_REGLAGES, TEXTES_AVERTISSEMENTS_REGLAGES as T } from "~/contenus/textes-reglages-reservations";
import { compterDemandesARepondre } from "~/fonctions/reservations/compter-demandes-a-repondre";
import { decrireCreneauReservation } from "~/fonctions/reservations/decrire-creneau-reservation";
import { ecrireNombrePersonnes } from "~/fonctions/reservations/ecrire-nombre-personnes";
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

export function listerAvertissementsReglages(reglages: ReglagesAComparer, reservations: readonly ReservationPro[], maintenantMs: number): AvertissementReglages[] {
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
      const modele = AVERTISSEMENTS_REGLAGES[a.raison];
      const texte = remplirModele(modele.texte, { quand: decrireCreneauReservation(a.creneau, maintenantMs).lu, quoi, personnes: ecrireNombrePersonnes(r.personnes) });
      return [{ cle: `${a.id}-${a.raison}`, emoji: modele.emoji, texte }];
    });
  const enAttente = reglages.avant.acceptation === "manuelle" && reglages.apres.acceptation === "automatique" ? compterDemandesARepondre(reservations, maintenantMs) : 0;
  if (enAttente === 0) return avertissements;
  const demandes = enAttente === 1 ? T.demandesUn : remplirModele(T.demandesPlusieurs, { nombre: String(enAttente) });
  return [...avertissements, { cle: "demandes-en-attente", emoji: "📬", texte: demandes }];
}
