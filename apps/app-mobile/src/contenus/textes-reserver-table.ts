import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { MomentCreneau } from "@sos-miam/commun/types/reglages-reservations";

import type { RaisonSansCreneau } from "~/fonctions/reservations/lire-raison-sans-creneau";

export const TEXTES_RESERVER_TABLE = {
  titre: "Réserver une table",
  titreSortie: "Réserver ta place",
  sousTitre: "Gratuit, sans carte bancaire : l'équipe te répond dans l'app.",
  sousTitreAuto: "Gratuit, sans carte bancaire, et confirmé tout de suite s'il reste de la place.",
  confirmationImmediate: "⚡ Confirmation immédiate",
  confirmationImmediateLu: "Confirmation immédiate s'il reste de la place",
  jour: "Quel jour ?",
  heure: "À quelle heure ?",
  heureDeParis: "Les heures sont celles du lieu, à l'heure de Paris.",
  personnes: "Vous serez combien ?",
  personnesLu: "Nombre de personnes",
  grandeTablee: "Plus de {max} ? Appelle directement le lieu : les grandes tablées, ça s'organise de vive voix.",
  petitMot: "Un petit mot pour l'équipe",
  petitMotMention: "facultatif",
  petitMotExemple: "Une chaise haute pour Léon, c'est possible ?",
  petitMotAide: "L'équipe le lit avec ta demande",
  recapTitre: "Ta demande",
  recapTitreAuto: "Ta réservation",
  recapSansPetitMot: "Sans petit mot",
  recapSecours: "Sinon {heures}",
  recapNote: "Gratuit, sans carte bancaire. Sans réponse {minutes} min avant le créneau, la demande s'endort toute seule.",
  recapNotePlanB: "Gratuit, sans carte bancaire. Sans réponse {minutes} min avant le plus tôt de tes horaires, la demande s'endort toute seule.",
  recapNoteAuto: "Gratuit, sans carte bancaire. Confirmé tout de suite s'il reste de la place.",
  envoyer: "Envoyer ma demande",
  envoyerAutoTable: "Réserver ma table",
  envoyerAutoPlace: "Réserver ma place",
  envoyerSansPetitMot: "Envoyer sans petit mot",
  envoi: "Envoi…",
  envoiAuto: "Réservation…",
  indiceEnvoyer: "Envoie ta demande au lieu, qui te répond dans l'app",
  indiceEnvoyerAuto: "Réserve tout de suite s'il reste de la place",
  indiceSansHeure: "Choisis d'abord le jour et l'heure",
  prochainJourOuvert: "Voir le prochain jour avec de la place",
  indiceProchainJourOuvert: "Choisit le prochain jour où il reste un horaire pour vous",
  chargementCreneaux: "On regarde les places…",
  horsLigneCreneauxTitre: "Pas de réseau, pas de places",
  horsLigneCreneauxTexte: "On n'arrive pas à voir les horaires libres. Vérifie ta connexion, puis réessaie : tes choix t'attendent ici.",
  reessayer: "Réessayer",
  indiceReessayer: "Relit les horaires libres",
  horsLigneCourt: "Pas de réseau : ces horaires datent un peu.",
  serviceComplet: "Complet pour {personnes}. Moins nombreux, ou un autre jour ?",
  serviceTropTard: "Trop tard pour ce service : on réserve au moins {delai} à l'avance ici.",
  serviceTropTardVeille: "Trop tard pour ce service : ici, on réserve au plus tard la veille.",
  peuDePlaces: "peu de places",
  sansHorairesTitre: "Pas encore d'horaires ici",
  sansHorairesTexte: "L'équipe {deLieu} n'a pas encore mis ses horaires dans l'app, alors on ne peut pas te proposer de créneau. Passe les voir ou appelle-les : ils seront ravis.",
  lieuIntrouvableTitre: "Ce lieu n'est plus là",
  lieuIntrouvableTexte: "Il n'est plus sur SOS Miam pour l'instant. Plein d'autres pépites t'attendent dans l'Explorer.",
  voirExplorer: "Voir d'autres pépites",
} as const;

export const SANS_CRENEAU: Readonly<Record<RaisonSansCreneau, { emoji: string; court: string; lu: string; titre: string; texte: string }>> = {
  ferme: {
    emoji: "😴",
    court: "Fermé",
    lu: "fermé",
    titre: "Fermé ce jour-là",
    texte: "L'équipe {deLieu} recharge les batteries. Choisis un autre jour : elle t'attend de pied ferme.",
  },
  "sans-resa": {
    emoji: "🪑",
    court: "Sans résa",
    lu: "pas de réservation ce jour-là",
    titre: "Pas de résa ce jour-là",
    texte: "L'équipe {deLieu} ne prend pas de réservation ce jour-là. Tente ta chance sur place, ou choisis un autre jour.",
  },
  complet: {
    emoji: "🫶",
    court: "Complet",
    lu: "complet",
    titre: "Complet pour {personnes}",
    texte: "Victime de son succès ! Essaie un autre jour, ou à moins nombreux.",
  },
  "trop-tard": {
    emoji: "🌙",
    court: "Trop tard",
    lu: "trop tard pour réserver",
    titre: "Plus de créneau à temps",
    texte: "On réserve au moins {delai} à l'avance ici, et le dernier créneau du jour est passé. Un autre jour, ça te dit ?",
  },
};

export const TROP_TARD_VEILLE = "Ici, on réserve au plus tard la veille : l'équipe aime s'organiser. Demain, ça te dit ?";

export const MOMENTS_CRENEAUX: Readonly<Record<MomentCreneau, { emoji: string; libelle: string }>> = {
  matin: { emoji: "🌅", libelle: "Le matin" },
  midi: { emoji: "☀️", libelle: "Le midi" },
  "apres-midi": { emoji: "🍰", libelle: "L'après-midi" },
  soir: { emoji: "🌙", libelle: "Le soir" },
};

export const TEXTES_PLAN_B = {
  ouvrir: "＋ Ajouter un plan B",
  mention: "facultatif",
  ouvrirIndice: "Propose 1 ou 2 autres horaires le même jour, au cas où",
  titre: "Un plan B ?",
  texte: "Ajoute 1 ou 2 autres horaires : si {heure} ne colle pas, l'équipe pourra en prendre un.",
  texteAuto: "Ajoute 1 ou 2 autres horaires : si {heure} part pendant que tu choisis, on prend le suivant tout seul.",
  max: "2 plans B au plus : enlève-en un pour en choisir un autre.",
  vide: "Pas d'autre horaire libre ce jour-là : ton premier choix est le bon.",
  fermer: "Sans plan B",
  indiceFermer: "Referme le plan B et le vide",
  indiceAjouter: "Touche pour l'ajouter en plan B",
  indiceRetirer: "Touche encore pour l'enlever",
  lu: "{heure}, plan B {rang}",
  principalParti: "{heure} n'a plus assez de place pour {personnes} : choisis un autre horaire.",
  secoursParti: "{heures} n'est plus libre : on l'a retiré de ton plan B.",
  secoursPartis: "{heures} ne sont plus libres : on les a retirés de ton plan B.",
} as const;

export const TEXTES_REFUS_RESERVATION: Readonly<Partial<Record<ErreurService, string>>> = {
  "email-non-verifie": "Pour réserver, il faut un e-mail confirmé. Touche le lien qu'on t'a envoyé, ou redemande-le depuis ton compte.",
  "membre-du-lieu": "On ne réserve pas chez soi : ta table, tu la connais déjà ! Va plutôt goûter chez les voisins.",
  "hors-ligne": "Rien n'est parti. Vérifie ta connexion, puis renvoie : tes choix t'attendent ici.",
  introuvable: "Ce lieu n'est plus sur SOS Miam pour l'instant. Reviens à l'Explorer pour en dénicher un autre.",
};

export const PETIT_MOT_REFUSE = {
  emoji: "✋",
  titre: "Ton petit mot ne passe pas",
  texte: "Il contient un terme qu'on ne laisse pas passer. Reformule-le juste au-dessus, ou envoie ta demande sans.",
  sousLeChamp: "On reformule ? Ton petit mot contient un terme qu'on ne laisse pas passer.",
} as const;

export const ACTIONS_REFUS_RESERVATION = {
  retourFiche: "Retour à la fiche",
  voirExplorer: "Voir l'Explorer",
  voirReservations: "Voir mes réservations",
  confirmerEmail: "Confirmer mon e-mail",
} as const;

export const TEXTES_DEMANDE_ENVOYEE = {
  titre: "Demande envoyée !",
  sousTitre: "L'équipe {deLieu} te répond ici, dans l'app : sa réponse arrive dans Mes réservations.",
  titreAcceptee: "C'est réservé !",
  sousTitreAcceptee: "L'équipe {deLieu} t'attend. Le jour J, touche « Je suis là » en arrivant : ici, ou dans Mes réservations.",
  titreRefusee: "Pas cette fois",
  sousTitreRefusee: "L'équipe {deLieu} a répondu : la carte t'explique pourquoi. Un autre créneau te tente ?",
  titreEndormie: "Demande endormie",
  sousTitreEndormie: "L'équipe {deLieu} n'a pas répondu à temps. Un autre créneau te tente ?",
  titreAnnulee: "Demande annulée",
  titreReservationAnnulee: "Réservation annulée",
  sousTitreAnnulee: "Une autre date te tente ? Choisis un nouveau créneau : le lieu t'attend peut-être déjà.",
  etapesTitre: "Et ensuite ?",
  etapes: [
    { emoji: "📬", texte: "L'équipe regarde son planning et accepte, ou te dit si c'est complet (ça arrive aux meilleurs)." },
    { emoji: "📍", texte: "Le jour J, touche « Je suis là » en arrivant, dans Mes réservations : l'équipe sait que c'est toi." },
    { emoji: "🛟", texte: "Ta visite compte pour de vrai : des points, un tampon s'il y a une carte de fidélité, et ton avis vérifié." },
  ],
  planBRetenuTitre: "Ton plan B a servi",
  planBRetenu: "{premier} est parti entre-temps : on t'a gardé {retenu}, ton plan B.",
  voirReservations: "Voir mes réservations",
  retourFiche: "Retour à la fiche",
  autreCreneau: "Choisir un autre créneau",
  annonce: "Demande envoyée. Le lieu te répond dans l'app.",
  annonceAcceptee: "C'est réservé ! Ton code d'arrivée t'attend dans Mes réservations.",
} as const;

export const TEXTES_HORAIRES_SECOURS = {
  ou: "ou {heures}",
  lu: "Horaires de secours : {heures}",
  planB: "🔁 Ton plan B : {retenu}, au lieu de {premier}",
  planBLu: "Ton plan B a servi : {retenu}, au lieu de {premier}",
} as const;
