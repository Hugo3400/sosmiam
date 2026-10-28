import type { MotifRefusReservation } from "@sos-miam/commun/types/reservation";
import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import {
  ANNULATION_RESERVATION_ANGLAIS,
  ARRIVEE_RESERVATION_ANGLAIS,
  CARTE_RESERVATION_ANGLAIS,
  EXPLICATIONS_RESERVATION_ANGLAIS,
} from "~/contenus/anglais/textes-reservations-client";

type Place = "table" | "place";

const JE_SUIS_LA = "« Je suis là »";

const CONSOLATIONS: Readonly<Record<MotifRefusReservation, string>> = {
  complet: "Pas de panique, il reste plein d'autres créneaux (et plein d'autres pépites).",
  ferme: "Pas de panique, il reste plein d'autres créneaux (et plein d'autres pépites).",
  "groupe-trop-grand": "Appelle le lieu pour en parler de vive voix, ou tente une autre pépite.",
  autre: "Pas de panique, il reste plein d'autres pépites à découvrir.",
};

export const EXPLICATIONS_RESERVATION = {
  consolations: CONSOLATIONS,
  annuleeParLieu: (motif: string) => `Le lieu a dû annuler : ${motif}. Désolé pour le contretemps, tu n'y es pour rien.`,
  retireeAvantReponse: (place: Place) => `Tu l'as retirée avant sa réponse : le lieu ne cherchera pas de ${place} pour rien. Pas de souci !`,
  annuleeTardive: (heures: number) => `Annulée moins de ${heures} h avant : le lieu l'a vue passer. Rien de grave si ça reste rare.`,
  annuleeATemps: (place: Place) => `Annulée à temps : ta ${place} est repartie pour un autre Miami. Merci pour le lieu !`,
  nonPointeeAvecPresence: `Tu as touché ${JE_SUIS_LA}, mais le lieu n'a pas noté ton passage à temps : cette visite ne pourra pas compter. Rien n'est noté contre toi.`,
  nonPointee: "Le créneau est passé sans que le lieu note ton passage : cette visite ne pourra pas compter. Rien n'est noté contre toi, promis.",
  honoreePresencePossible: `Le lieu a noté ton arrivée ! Touche ${JE_SUIS_LA} pour que ta visite compte.`,
  honoreeAvecPresence: "Le lieu a noté ton passage, et ta visite compte dans « Mes visites ». Reviens quand tu veux !",
  honoreeSansPresence: `Le lieu a noté ton passage, mais sans ${JE_SUIS_LA} sur place, la visite n'a pas pu compter. La prochaine fois, touche-le en arrivant !`,
  demandeePlusieurs:
    "Le lieu choisit l'horaire qui l'arrange parmi les tiens et te répond ici. Sans réponse à temps, la demande s'endort toute seule : rien n'est compté contre toi.",
  demandee: "Le lieu te répond ici, avant ton créneau. Sans réponse à temps, la demande s'endort toute seule : rien n'est compté contre toi.",
  refusee: (motif: string, consolation: string) => `Le lieu a répondu : ${motif}. ${consolation}`,
  expiree: "Le lieu n'a pas répondu à temps, alors la demande s'est endormie. Rien n'est compté contre toi.",
  absent: (place: Place) => `Le lieu a noté une absence. Un imprévu, ça arrive ! La prochaine fois, annule dans l'app : ta ${place} fera le bonheur d'un autre Miami.`,
} as const;

export const EXPLICATIONS_RESERVATION_PAR_LANGUE: ParLangue<Traduction<typeof EXPLICATIONS_RESERVATION>> = {
  fr: EXPLICATIONS_RESERVATION,
  en: EXPLICATIONS_RESERVATION_ANGLAIS,
};

export const ANNULATION_RESERVATION = {
  demande: {
    titre: "Annuler ta demande ?",
    detail: (resume: string, place: Place) => `${resume} Le lieu n'a pas encore répondu : il ne cherchera pas de ${place} pour rien.`,
    libelleConfirmer: "Annuler la demande",
    libelleRester: "Je garde ma demande",
    annonce: "Demande annulée.",
  },
  reservation: {
    titre: "Annuler ta réservation ?",
    detailTardive: (resume: string, heures: number) =>
      `${resume} Il reste moins de ${heures} h : le lieu verra passer cette annulation de dernière minute. Rien de grave si ça reste rare, promis.`,
    detail: (resume: string, place: Place) => `${resume} En annulant maintenant, ta ${place} repart pour un autre Miami.`,
    libelleConfirmer: "Annuler la réservation",
    libelleRester: (place: Place) => `Je garde ma ${place}`,
    annonce: "Réservation annulée.",
  },
} as const;

export const ANNULATION_RESERVATION_PAR_LANGUE: ParLangue<Traduction<typeof ANNULATION_RESERVATION>> = {
  fr: ANNULATION_RESERVATION,
  en: ANNULATION_RESERVATION_ANGLAIS,
};

export const ARRIVEE_RESERVATION = {
  surPlace: "📍 C'est noté, tu es sur place !",
  legendeCode: "Donne ce code à l'équipe",
  visiteComptera: (souhait: string) => `Ta visite comptera dès que l'équipe touche « Venu ». ${souhait}`,
  souhaitRepas: "Bon appétit !",
  souhaitSortie: "Profite bien !",
  presencePossible: "Tu arrives ? Une fois sur place, touche « Je suis là » : c'est ce qui fait compter ta visite.",
  bouton: "📍 Je suis là",
  boutonLu: (chezLieu: string) => `Je suis là, ${chezLieu}`,
  boutonIndice: (chezLieu: string) => `Confirme que tu es bien ${chezLieu}, grâce à ta position`,
  position: "Ta position sert juste à vérifier que tu es là : elle n'est jamais gardée.",
  attenteCreneau: (heures: number) =>
    `Le lieu t'attend ! « Je suis là » s'allume ${heures} h avant ton créneau : touche-le sur place pour que ta visite compte.`,
  code: "Ton code d'arrivée",
  codeLu: (code: string) => `Ton code d'arrivée : ${code}`,
} as const;

export const ARRIVEE_RESERVATION_PAR_LANGUE: ParLangue<Traduction<typeof ARRIVEE_RESERVATION>> = { fr: ARRIVEE_RESERVATION, en: ARRIVEE_RESERVATION_ANGLAIS };

export const CARTE_RESERVATION = {
  petitMot: "Ton petit mot",
  voirLieu: "Voir le lieu",
  voirLieuLu: (deLieu: string, _nom: string) => `Voir la fiche ${deLieu}`,
  voirLieuIndice: "Ouvre la fiche du lieu",
  annulerDemande: "Annuler la demande",
  annulerReservation: "Annuler la réservation",
  annuler: "Annuler",
  annulerLu: (libelle: string, chezLieu: string) => `${libelle} ${chezLieu}`,
  annulerIndice: "Te demande de confirmer avant d'annuler",
  ouEtVille: (nom: string, ville: string) => `${nom}, à ${ville}`,
  plage: (premier: string, dernier: string) => `· ${premier} – ${dernier}`,
  plageLu: (titre: string, premier: string, dernier: string) => `${titre}, de ${premier} à ${dernier}`,
  videTitre: "Pas encore de table en vue",
  videTexte:
    "Ton agenda gourmand est plus vide qu'un frigo un dimanche soir. Repère une pépite qui prend les réservations dans l'app : ta demande et sa réponse t'attendront ici.",
  videBouton: "Trouver une pépite",
  videIndice: "Ouvre l'onglet Explorer",
  aVenir: "À venir",
  passees: "Passées",
  sectionLu: (titre: string, nombre: number) => `${titre}, ${nombre} réservation${nombre > 1 ? "s" : ""}`,
  scanLu: (titre: string, nombre: number) => `${titre}, ${nombre} à venir`,
  entreeAVenir: (nombre: number) => `${nombre} à venir`,
  entreeEnAttente: (aVenir: string, nombre: number) => `${aVenir} · ${nombre} en attente du lieu`,
  jourPlace: (index: number, total: number) => `, ${index} sur ${total}`,
  ouvrirReglages: "Ouvrir les réglages",
  reessayer: "Réessayer",
  toi: "Toi",
} as const;

export const CARTE_RESERVATION_PAR_LANGUE: ParLangue<Traduction<typeof CARTE_RESERVATION>> = { fr: CARTE_RESERVATION, en: CARTE_RESERVATION_ANGLAIS };
