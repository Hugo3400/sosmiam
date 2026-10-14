// Textes du « Mon compte » de sosmiam.fr (routes/compte/mon-compte.tsx) : « Mes données », tes droits, et la suppression
// d'un compte sans se connecter (l'adresse https://sosmiam.fr/mon-compte est celle donnée aux stores pour ça).
// Aucun import ici : le test (tests/mon-compte.test.ts) lance ce fichier directement avec Node. L'adresse de contact est
// ajoutée par les composants (site.emailContact). Rien n'est promis au-delà de la politique de confidentialité :
// réponse dans un délai d'un mois au plus (délai du RGPD), sauvegardes chiffrées 30 jours, journal des mails 90 jours.

/** Petits mots en arrivant : ?au-revoir après une suppression de compte, ?deconnecte après une déconnexion. */
export const accueilsMonCompte = {
  "au-revoir": "Ton compte est effacé. Merci d'avoir fait un bout de chemin avec SOS Miam !",
  deconnecte: "Tu es déconnecté. À bientôt !",
};

/** Sous le titre, quand personne n'est connecté (deux lignes). */
export const CHAPO_VISITEUR =
  "Un seul compte SOS Miam pour l'app, l'espace ambassadeur et l'espace pro. Connecte-toi pour voir tes infos, changer ton mot de passe ou supprimer ton compte.";

/** Sous le titre, une fois connecté. */
export const CHAPO_CONNECTE = "Tes infos, ton mot de passe, tes données, et la porte de sortie si tu en as besoin.";

/** Comptes créés avec Apple ou Google : pas de mot de passe, le même bouton les connecte ici aussi. */
export const AIDE_APPLE_GOOGLE =
  "Tu t'es inscrit avec Apple ou Google ? Touche le même bouton, juste au-dessus. Tu préfères un mot de passe ? Touche « Mot de passe oublié ? » et donne l'adresse e-mail de ton compte (celle qu'Apple ou Google nous a transmise) : tu reçois un lien pour en choisir un.";

/** « Mon mot de passe » d'un compte sans mot de passe (créé avec Apple ou Google) */
export const AIDE_SANS_MOT_DE_PASSE =
  "Tu te connectes avec Apple ou Google : ton compte n'a pas de mot de passe chez nous. Envie d'en avoir un quand même ? Touche « Ajouter un mot de passe », juste au-dessus : on t'envoie un lien pour le choisir.";

/** Le délai de réponse à une demande sur tes données (délai du RGPD, repris de la politique de confidentialité). */
export const DELAI_REPONSE = "dans un délai d'un mois au plus";

/** Le mail à écrire pour supprimer son compte sans se connecter : objet et texte, prêts à envoyer. */
export const mailSuppression = {
  objet: "Supprimer mon compte SOS Miam",
  texte: "Bonjour,\n\nJe demande la suppression de mon compte SOS Miam et de toutes les données qui y sont rattachées.\n\nMerci !",
};

/** Le mail à écrire pour recevoir une copie de ses données. */
export const mailCopie = {
  objet: "Copie de mes données SOS Miam",
  texte: "Bonjour,\n\nJe voudrais recevoir une copie de toutes les données que SOS Miam garde sur moi.\n\nMerci !",
};

/** Tes droits sur tes données (RGPD), en clair : le nom du droit, puis ce qu'il veut dire. */
export const droitsRgpd: { droit: string; explication: string }[] = [
  { droit: "Accès", explication: "savoir ce qu'on garde sur toi, et en recevoir une copie." },
  { droit: "Rectification", explication: "corriger ce qui est faux. Ton prénom (et ta ville d'ambassadeur) se changent ici même ; ton adresse e-mail, en nous écrivant." },
  { droit: "Effacement", explication: "faire effacer tes données : ton compte se supprime ici, dans l'app, ou par mail." },
  { droit: "Opposition", explication: "t'opposer à un usage de tes données fondé sur notre intérêt légitime (statistiques de visite, sécurité…), pour des raisons tenant à ta situation." },
  { droit: "Réclamation", explication: "si tu trouves qu'on ne respecte pas tes droits, tu peux te plaindre auprès de la CNIL, l'autorité française de protection des données." },
];

/** Ce qui peut rester un temps après la suppression d'un compte (politique de confidentialité). */
export const RESTE_APRES_SUPPRESSION =
  "Ce qui reste un temps, puis disparaît tout seul : le journal des mails qu'on t'a envoyés (90 jours au plus après chaque envoi) et une copie dans nos sauvegardes chiffrées (30 jours au plus).";
