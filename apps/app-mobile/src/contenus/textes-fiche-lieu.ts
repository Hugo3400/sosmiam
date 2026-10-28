import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_FICHE_LIEU_ANGLAIS } from "~/contenus/anglais/textes-fiche-lieu";

export const TEXTES_FICHE_LIEU = {
  retour: "Retour",
  retourFiche: "Retour à la fiche",
  indisponible: "Ce lieu n'est pas disponible",
  indisponibleTexte: "Il s'est peut-être éclipsé. Plein d'autres adresses t'attendent dans Explorer !",
  ouvertureLu: "On ouvre la fiche du lieu",
  qrIntrouvable: "Ce QR code ne mène nulle part",
  qrIntrouvableTexte: "Le lieu n'est peut-être plus sur SOS Miam. Plein d'autres adresses t'attendent dans Explorer !",
  voirAdresses: "Voir les adresses",
  miamSafe: "Miam Safe",
  miamSafeIndice: "Tu ne te sens pas en sécurité ici ? Les secours, un pote, le comptoir",
  rescousse: {
    sauve: "Sauvé !",
    reviensLundi: "Reviens lundi",
    aLaRescousse: "À la rescousse",
    indiceSansCompte: "Il te faut un compte pour donner une rescousse à ce lieu, une minute suffit",
    indiceSauve: "Reprend ta rescousse, elle te sera rendue pour un autre lieu",
    indiceEpuisee: "Plus de rescousse cette semaine, elles reviennent lundi",
    indiceDonner: (restantes: number) => `Donne une de tes rescousses à ce lieu, il t'en reste ${restantes} cette semaine`,
  },
  inviter: "Inviter ce lieu",
  inviterIndice: "Partage-lui le lien d'inscription, c'est gratuit",
  yAller: "Y aller",
  itineraireIos: "Ouvre l'itinéraire dans Plans",
  itineraireAndroid: "Ouvre l'itinéraire dans ton app de cartes",
  envoyer: "Envoyer à un pote",
  envoyerIndice: "Choisis des potes de ta bande à qui envoyer ce lieu",
  sections: {
    horaires: "Horaires",
    plat: "Le plat signature",
    denichePar: "Déniché par",
  },
  attente: {
    pasDeReseau: "Pas de réseau",
    pasDeReseauTexte: "Impossible d'ouvrir ce lieu pour l'instant. Vérifie ta connexion, puis réessaie : il t'attend.",
    reessayer: "Réessayer",
    ouvertureLu: "On ouvre ce lieu",
    ouverture: "On ouvre la porte…",
  },
  reserveAdultes: {
    titre: "Réservé aux 18 ans et plus",
    texte: "Ici, on vient surtout trinquer. Sans compte, on ne connaît pas encore ton âge : en attendant, on reste tout public.",
    question: "Tu as 18 ans ou plus ? Crée ton compte, et ce lieu t'ouvre ses portes.",
    inscrire: "Je m'inscris (1 min)",
    inscrireIndice: "Ouvre l'inscription : Apple, Google ou ton e-mail",
    autresAdresses: "Voir d'autres adresses",
    autresAdressesIndice: "Ouvre Explorer, la carte et la liste des lieux",
  },
  verification: {
    verifieLu: "Lieu vérifié : il a un compte SOS Miam",
    nonVerifieLu: "Lieu non vérifié : il n'a pas encore de compte SOS Miam",
    verifie: "✓ Vérifié",
    nonVerifie: "Non vérifié",
  },
  nonVerifie: {
    titre: "Ce lieu n'a pas encore de compte SOS Miam",
    source: (source: string) => `Ses infos viennent de ${source}.`,
    ajoute: "Il a été ajouté par l'équipe ou par un ambassadeur.",
    texte: (origine: string) =>
      `${origine} Tu peux le garder, t'y rendre et donner ton avis, mais pas encore valider ta visite ni lui donner une rescousse : ça s'ouvre dès qu'il nous rejoint.`,
  },
  modification: {
    lu: "Une info a changé ? Propose une modification de la fiche",
    indice: "L'équipe relit ta proposition avant de changer la fiche",
    titre: "Une info a changé ?",
    texte: "Propose une modification, l'équipe vérifie",
  },
  evenements: {
    aVenir: "À venir",
    chaqueSemaine: " · chaque semaine",
    places: (n: number) => `${n} places`,
    interesseLu: (titre: string) => `Ça t'intéresse : ${titre}`,
    interesserLu: (titre: string) => `Ça m'intéresse : ${titre}`,
    interesseIndice: "Touche pour ne plus le garder",
    interesserIndice: "On te le garde de côté",
    interesse: "✓ Ça m'intéresse",
    interesser: "🎟️ Ça m'intéresse",
  },
};

export const TEXTES_FICHE_LIEU_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_FICHE_LIEU>> = { fr: TEXTES_FICHE_LIEU, en: TEXTES_FICHE_LIEU_ANGLAIS };
