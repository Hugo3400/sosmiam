import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import {
  TEXTES_ECRAN_CE_SOIR_ANGLAIS,
  TEXTES_ECRAN_FIDELITE_ANGLAIS,
  TEXTES_ECRAN_INFOS_PRATIQUES_ANGLAIS,
  TEXTES_ECRAN_KIT_ANGLAIS,
  TEXTES_ECRAN_MON_LIEU_ANGLAIS,
  TEXTES_ECRAN_STATISTIQUES_ANGLAIS,
} from "~/contenus/anglais/textes-ecran-pro-mon-lieu";

export const TEXTES_ECRAN_MON_LIEU = {
  titre: "Mon lieu",
  programmeVide: "Pas encore de carte : crée la tienne en une minute.",
  programmeActif: "active",
  programmeEnPause: "en pause",
  programme: (visites: number, recompense: string, etat: string) => `${visites} visites → ${recompense} · ${etat}`,
  carteVide: "Pas encore de carte : ajoute tes plats et tes boissons.",
  carte: (sections: number, nombre: number) => `${sections} section${sections > 1 ? "s" : ""} · ${nombre} sur la carte`,
  charteInconnue: "La charte, ses engagements et ta signature",
  charteSignee: "Charte signée",
  charteRetiree: "Retirée par l'équipe SOS Miam",
  charteNonSignee: "Pas encore signée : le badge sur ta fiche, gratuit",
  verifieLu: "Lieu vérifié : il a un compte SOS Miam. Il valide les visites, lance des SOS et répond aux avis.",
  verifieTitre: "Lieu vérifié",
  verifieTexte: "Tu valides les visites, tu lances des SOS et tu réponds aux avis.",
  carteTitre: "La carte",
  fidelite: "Carte de fidélité",
  infos: "Infos pratiques",
  infosDetail: "Téléphone, animaux, accès, terrasse, paiements… ce qu'on voit sur ta fiche",
  miamSafe: "Miam Safe",
  kit: "Mon kit",
  kitDetail: "Le QR de ta vitrine, qui ouvre ta fiche",
  equipe: "Équipe et appareils",
  equipeDetail: "Invite tes serveurs : chacun son compte, on sait qui a validé quoi",
  ceSoir: "Ce soir",
  ceSoirDetail: "SOS du soir et message du moment : préviens les gourmands du coin",
  evenements: "Événements",
  evenementsDetail: "Concert, quiz, atelier : sur ta fiche et chez qui te suit",
  reglagesReservations: "Réglages des réservations",
  avis: "Les avis",
  avisDetail: "Ce que disent les Miamis, et ta réponse publique sous chacun",
  statistiques: "Statistiques de la semaine",
  statistiquesDetail: "Vues de ta fiche, rescousses, visites validées, nouveaux clients",
} as const;

export const TEXTES_ECRAN_MON_LIEU_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ECRAN_MON_LIEU>> = { fr: TEXTES_ECRAN_MON_LIEU, en: TEXTES_ECRAN_MON_LIEU_ANGLAIS };

export const TEXTES_ECRAN_KIT = {
  retour: "Retour",
  titre: "Mon kit",
  intro: "Le QR de ta vitrine et de tes chevalets de table : un scan, et on tombe sur ta fiche dans SOS Miam.",
  qrLu: (lieu: string) => `QR de vitrine de ${lieu}, il ouvre ta fiche`,
  tonLieu: "ton lieu",
  chargement: "On prépare ton QR…",
  bonASavoir: "🔒 Bon à savoir",
  explication: "Ce QR ouvre ta fiche : il ne valide jamais une visite (ça, c'est le QR du comptoir, qui change toutes les 30 s). Un scan ne demande jamais de mot de passe.",
  affichette: "L'affichette de table à imprimer est dans l'espace pro du site : pro.sosmiam.fr.",
  partager: "Partager le lien de ma fiche",
  messagePartage: (lien: string) => `Retrouve-nous sur SOS Miam : ${lien}`,
} as const;

export const TEXTES_ECRAN_KIT_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ECRAN_KIT>> = { fr: TEXTES_ECRAN_KIT, en: TEXTES_ECRAN_KIT_ANGLAIS };

export const TEXTES_ECRAN_INFOS_PRATIQUES = {
  retour: "Retour",
  titre: "Infos pratiques",
  intro: "Ce que les gourmands voient sur ta fiche avant de venir. Ce que tu ne coches pas n'apparaît pas.",
  apercu: "Aperçu sur ta fiche",
  echec: "Les infos n'ont pas pu être enregistrées. Réessaie dans un instant ?",
  enregistrement: "Enregistrement…",
  enregistrer: "Enregistrer",
} as const;

export const TEXTES_ECRAN_INFOS_PRATIQUES_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ECRAN_INFOS_PRATIQUES>> = {
  fr: TEXTES_ECRAN_INFOS_PRATIQUES,
  en: TEXTES_ECRAN_INFOS_PRATIQUES_ANGLAIS,
};

export const TEXTES_ECRAN_FIDELITE = {
  retour: "Retour",
  titre: "Carte de fidélité",
  intro: "C'est toi qui offres, c'est toi qui choisis. Prends quelque chose que tu peux tenir même un samedi soir plein.",
  actif: "Carte active",
  actifDetail: "En pause, tes clients ne la voient plus (les récompenses gagnées restent valables 30 jours)",
  recompense: "Ce que tu offres",
  recompenseAide: "Un café, un dessert maison, une boule de glace…",
  alcoolDetecte: "🍷 Il y a de l'alcool dedans : tes clients verront le petit message de prévention à côté.",
  alcool: "Il y a de l'alcool dedans",
  sansAlcool: "Et une version sans alcool ?",
  facultatif: "facultatif",
  sansAlcoolAide: "Si tu veux, une idée sans une goutte d'alcool en plus : un jus pressé, un sirop maison…",
  visites: "Visites avant la récompense",
  visitesUnite: (n: number) => `${n} visites`,
  echec: "La carte n'a pas pu être enregistrée. Réessaie dans un instant ?",
  enregistrement: "Enregistrement…",
  enregistrer: "Enregistrer la carte",
  erreurs: {
    recompense: "Entre 3 et 60 caractères, sans gros mot : un café, un dessert maison…",
    recompenseSansAlcool: "Entre 3 et 60 caractères, sans gros mot et sans une goutte d'alcool : un jus pressé, un sirop maison…",
    visitesRequises: "Entre 3 et 10 visites.",
  },
} as const;

export const TEXTES_ECRAN_FIDELITE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ECRAN_FIDELITE>> = { fr: TEXTES_ECRAN_FIDELITE, en: TEXTES_ECRAN_FIDELITE_ANGLAIS };

export const TEXTES_ECRAN_STATISTIQUES = {
  titre: "Statistiques",
  semaine: (date: string) => `Semaine du ${date}`,
  vide: "Pas encore de chiffres : ils arrivent avec tes premières visites.",
  note: "Semaines du lundi au dimanche, à l'heure de Paris. Les vues sont comptées sans pister personne : on ne sait jamais qui a regardé.",
  mesures: {
    vues: "Vues de ta fiche",
    rescousses: "Rescousses reçues",
    visitesValidees: "Visites validées",
    nouveauxClients: "Nouveaux clients",
  },
} as const;

export const TEXTES_ECRAN_STATISTIQUES_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ECRAN_STATISTIQUES>> = {
  fr: TEXTES_ECRAN_STATISTIQUES,
  en: TEXTES_ECRAN_STATISTIQUES_ANGLAIS,
};

export const TEXTES_ECRAN_CE_SOIR = {
  titre: "Ce soir",
  sousTitre: "le SOS du soir et ton message du moment",
  sos: "SOS du soir",
  sosLance: "🛟 SOS lancé : les gourmands du coin arrivent !",
  sosArrete: "SOS arrêté. À demain pour le prochain !",
  message: "Message du moment",
  messageAffiche: "📣 Message affiché sur ta fiche",
  messageEfface: "Message effacé",
  alcool: "Ce qui parle d'alcool s'affiche avec le message sanitaire, et jamais en visite sans compte.",
} as const;

export const TEXTES_ECRAN_CE_SOIR_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ECRAN_CE_SOIR>> = { fr: TEXTES_ECRAN_CE_SOIR, en: TEXTES_ECRAN_CE_SOIR_ANGLAIS };
