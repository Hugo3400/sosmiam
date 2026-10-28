import { ABSENT_APRES_CRENEAU_MS, VENU_AVANT_CRENEAU_MS } from "@sos-miam/commun/regles/reservations";
import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";

import { TEXTES_RESERVATIONS_PRO_ANGLAIS } from "~/contenus/anglais/textes-reservations-pro";
import { ecrireAttente } from "~/fonctions/dates/ecrire-attente";

const AVANT_VENU = ecrireAttente(VENU_AVANT_CRENEAU_MS);
const APRES_ABSENT = ecrireAttente(ABSENT_APRES_CRENEAU_MS);

export const TEXTES_RESERVATIONS_PRO = {
  entreeTitre: "Réservations",
  entreeVide: "Les demandes de tes clients arrivent ici",
  titre: "Réservations",
  sansLieuTitre: "Aucun lieu à gérer pour l'instant",
  sansLieuTexte: "Les réservations s'affichent ici dès que ton rattachement à un lieu est validé.",
  sousTitre: "Réponds d'un geste : le client voit ta réponse tout de suite dans l'app. Sans réponse à temps, la demande s'endort toute seule.",
  chargement: "On rassemble les réservations…",
  reessayer: "Réessayer",
  indiceReessayer: "Relit les réservations du lieu",
  aRepondre: "À répondre",
  aujourdhui: "Aujourd'hui",
  aVenir: "Les jours qui viennent",
  videTitre: "Pas de réservation en vue",
  videTexte: "Le calme avant le rush : les demandes faites dans l'app arriveront ici, avec le petit mot du client.",
  accepter: "Accepter",
  refuser: "Refuser",
  venu: "Venu",
  absent: "Pas venu",
  petitMot: "Son petit mot",
  code: "Code d'arrivée",
  presenceNotee: "📍 Sur place : sa position a été vérifiée.",
  attendreVenu: `« Venu » s'allume ${AVANT_VENU} avant le créneau.`,
  attendreAbsent: `Pas encore là ? « Pas venu » s'allume ${APRES_ABSENT} après le créneau : un retard, ça arrive.`,
  venuSansPresence: "La visite comptera dès que ton client touche « Je suis là » sur place.",
  refusTitre: "Refuser la demande de {nom} ?",
  refusDetail: "Le client lit le motif que tu choisis, jamais un texte libre. Il pourra tenter un autre créneau.",
  refusConfirmer: "Refuser la demande",
  refusRester: "Finalement non",
  annonceAcceptee: "✅ Réservation de {nom} acceptée · code {code}",
  annonceRefusee: "Demande de {nom} refusée",
  annonceVenu: "🎉 Passage de {nom} noté",
  annonceAbsent: "Absence de {nom} notée",
} as const;

export const TEXTES_RESERVATIONS_PRO_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_RESERVATIONS_PRO>> = {
  fr: TEXTES_RESERVATIONS_PRO,
  en: TEXTES_RESERVATIONS_PRO_ANGLAIS,
};
