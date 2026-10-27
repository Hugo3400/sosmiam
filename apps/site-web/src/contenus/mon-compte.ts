// Textes du « Mon compte » de sosmiam.fr (routes/compte/mon-compte.tsx) : « Mes données », tes droits, et la suppression
// d'un compte sans se connecter (l'adresse https://sosmiam.fr/mon-compte est celle donnée aux stores pour ça).
// L'adresse de contact est ajoutée par les composants (site.emailContact). Rien n'est promis au-delà de la politique de confidentialité :
// réponse dans un délai d'un mois au plus (délai du RGPD), sauvegardes chiffrées 30 jours, journal des mails 90 jours.
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_MON_COMPTE_ANGLAIS } from "./anglais/mon-compte.ts";

export const TEXTES_MON_COMPTE = {
  titre: "Mon compte",
  descriptions: {
    ambassadeur: "Ton compte ambassadeur SOS Miam.",
    pro: "Ton compte SOS Miam, dans l'espace pro.",
    site: "Ton compte SOS Miam : tes infos, tes données, et la suppression de ton compte, même sans te connecter.",
  },
  retours: {
    ambassadeur: "Retour à mon espace",
    pro: "Retour à mon tableau",
    site: "Retour à l'accueil",
  },
  chapoVisiteur:
    "Un seul compte SOS Miam pour l'app, l'espace ambassadeur et l'espace pro. Connecte-toi pour voir tes infos, changer ton mot de passe ou supprimer ton compte.",
  chapoConnecte: "Tes infos, ton mot de passe, tes données, et la porte de sortie si tu en as besoin.",
  chapoEspace: "Tes infos, ton mot de passe, et la porte de sortie si tu en as besoin.",
  aideAppleGoogle:
    "Tu t'es inscrit avec Apple ou Google ? Touche le même bouton, juste au-dessus. Tu préfères un mot de passe ? Touche « Mot de passe oublié ? » et donne l'adresse e-mail de ton compte (celle qu'Apple ou Google nous a transmise) : tu reçois un lien pour en choisir un.",
  aideSansMotDePasse:
    "Tu te connectes avec Apple ou Google : ton compte n'a pas de mot de passe chez nous. Envie d'en avoir un quand même ? Touche « Ajouter un mot de passe », juste au-dessus : on t'envoie un lien pour le choisir.",
  parties: {
    meConnecter: "Me connecter",
    mesInfos: "Mes infos",
    monMotDePasse: "Mon mot de passe",
    meDeconnecter: "Me déconnecter",
    supprimer: "Supprimer mon compte",
  },
  deconnexionAppleGoogle: "Sur cet appareil. Tu pourras te reconnecter quand tu veux avec Apple ou Google.",
  deconnexionEmail: "Sur cet appareil. Tu pourras te reconnecter quand tu veux avec ton e-mail et ton mot de passe.",
  motDePasseChange: "C'est fait ! Ton nouveau mot de passe est enregistré, et tes autres connexions sont fermées.",
  enregistre: "C'est enregistré.",
  messages: {
    actuel: "Indique ton mot de passe actuel.",
    actuelIncorrect: "Ce n'est pas ton mot de passe actuel.",
    nouveau: "Ton nouveau mot de passe doit faire au moins 12 caractères (et 128 au plus).",
  },
  profil: {
    bouton: "Enregistrer",
    tonEmail: "Ton e-mail : ",
    nePasChanger: ". Il ne se change pas en ligne : pour le changer, écris-nous à ",
    aidePrenom:
      "Il peut s'afficher « Déniché par … » sur la fiche d'un lieu que tu as proposé. Une fiche déjà en ligne garde le prénom d'alors : écris-nous pour le changer.",
  },
  delaiReponse: "dans un délai d'un mois au plus",
  mailSuppression: {
    objet: "Supprimer mon compte SOS Miam",
    texte: "Bonjour,\n\nJe demande la suppression de mon compte SOS Miam et de toutes les données qui y sont rattachées.\n\nMerci !",
  },
  mailCopie: {
    objet: "Copie de mes données SOS Miam",
    texte: "Bonjour,\n\nJe voudrais recevoir une copie de toutes les données que SOS Miam garde sur moi.\n\nMerci !",
  },
  droitsRgpd: [
    { droit: "Accès", explication: "savoir ce qu'on garde sur toi, et en recevoir une copie." },
    { droit: "Rectification", explication: "corriger ce qui est faux. Ton prénom (et ta ville d'ambassadeur) se changent ici même ; ton adresse e-mail, en nous écrivant." },
    { droit: "Effacement", explication: "faire effacer tes données : ton compte se supprime ici, dans l'app, ou par mail." },
    { droit: "Opposition", explication: "t'opposer à un usage de tes données fondé sur notre intérêt légitime (statistiques de visite, sécurité…), pour des raisons tenant à ta situation." },
    { droit: "Réclamation", explication: "si tu trouves qu'on ne respecte pas tes droits, tu peux te plaindre auprès de la CNIL, l'autorité française de protection des données." },
  ],
  resteApresSuppression:
    "Ce qui reste un temps, puis disparaît tout seul : le journal des mails qu'on t'a envoyés (90 jours au plus après chaque envoi) et une copie dans nos sauvegardes chiffrées (30 jours au plus).",
  mesDonnees: {
    titre: "Mes données",
    ceQuOnGarde: "Ce qu'on garde",
    garde: "Ton e-mail, ton prénom ou ton pseudo, et ce que tu fais sur SOS Miam. Jamais ton mot de passe en clair, et zéro revente. Le détail (quoi, pourquoi, combien de temps) est dans notre ",
    politique: "politique de confidentialité",
    copie: "Avoir une copie de mes données",
    copieTexte: "Écris-nous depuis l'adresse de ton compte, avec l'objet « Copie de mes données ». On te l'envoie ",
    mailToutPret: "Écrire le mail tout prêt",
    toutSupprimer: "Tout supprimer",
    supprimerConnecte: "Le bouton « Supprimer mon compte », juste au-dessus : ton compte part tout de suite, avec ce qui y est rattaché.",
    supprimerVisiteur:
      "Connecte-toi et utilise « Supprimer mon compte », ou fais-le dans l'app (« Mon compte », dans tes réglages), ou écris-nous : la marche à suivre est juste au-dessus.",
    newsletter: " Inscrit à la newsletter ? Le lien « Me désinscrire » en bas de chaque mail suffit.",
    mesDroits: "Mes droits, en clair",
    separateurDroit: " : ",
    pourToutCa: "Pour tout ça, un mail à ",
    reponse: (delai: string) => ` suffit. On te répond ${delai} (deux mois de plus seulement pour une demande complexe, et on te prévient). Pour la CNIL, c'est `,
    parIci: "par ici",
    details: " ; et tous les détails sont dans ",
    tesDroits: "tes droits",
  },
  sansConnexion: {
    titre: "Supprimer mon compte sans me connecter",
    intro: "Plus l'app, pas de mot de passe, ou juste pas envie de te connecter ? Pas de souci, un mail suffit :",
    ecrisA: "Écris à ",
    depuisAdresse: " depuis l'adresse e-mail de ton compte.",
    objet: (objet: string) => `Objet : « ${objet} ». Dans le mail, dis simplement que tu veux supprimer ton compte et tes données.`,
    onEfface: (delai: string) => `On efface ton compte et tout ce qui y est rattaché, et on te répond ${delai}.`,
    adresseImpossible:
      "Tu ne peux pas écrire depuis cette adresse (adresse masquée par Apple, boîte fermée…) ? Écris-nous quand même en la donnant : on vérifie juste que c'est bien toi avant d'effacer quoi que ce soit.",
  },
};

export const TEXTES_MON_COMPTE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MON_COMPTE>> = {
  fr: TEXTES_MON_COMPTE,
  en: TEXTES_MON_COMPTE_ANGLAIS,
};
