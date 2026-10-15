// Les textes de la synchro du profil d'un compte : la carte d'annonce de l'onglet Profil (AnnonceProfil) et les messages
// de Mes infos (vérification du pseudo pendant la saisie, refus du serveur dits sous la bonne case, attente du réseau).
// Au tutoiement ; un profil retenu par la modération, on en parle simplement, sans gronder. {pseudo} et {date} sont remplis
// par remplirModele.

/** Ce que dit la carte, pour chaque annonce ; `bouton` : l'action principale, `vers` : l'écran qu'elle ouvre */
export const ANNONCES_PROFIL = {
  "pseudo-neutre": {
    emoji: "🏷️",
    titre: "Petit changement de pseudo",
    texte: "L'équipe a remplacé ton pseudo par un pseudo neutre, @{pseudo}. Tu peux en choisir un autre dans Réglages › Mes infos.",
    bouton: "Choisir un autre pseudo",
    vers: "/reglages/infos",
  },
  "pseudo-du-serveur": {
    emoji: "🏷️",
    titre: "Petit changement de pseudo",
    texte: "Ton pseudo pour tes potes, c'est @{pseudo} : le changement fait sur ce téléphone n'était jamais parti. Tu peux le refaire dans Réglages › Mes infos.",
    bouton: "Changer de pseudo",
    vers: "/reglages/infos",
  },
  "prenom-limite": {
    emoji: "⏸️",
    // Le titre vient de MESSAGES_SERVICE["compte-limite"] (« Compte limité jusqu'au {date} », ou « pour l'instant »)
    titre: "",
    texte: "Ton prénom n'a pas pu changer, alors on a gardé celui de ton compte. On t'explique pourquoi dans Réglages › Décisions de la modération : si c'est une erreur, conteste, un humain relira.",
    bouton: "Voir les décisions",
    vers: "/reglages/decisions-moderation",
  },
} as const;

export const BOUTON_COMPRIS = "Compris";

/** Les messages de Mes infos avec un compte */
export const MESSAGES_INFOS = {
  prenomInterdit: "Ce prénom-là ne passera pas chez nous ! Mets ton vrai prénom, ou un petit surnom sympa.",
  pseudoInterdit: "Ce pseudo-là ne passera pas : choisis-en un plus sympa.",
  pseudoMisDeCote: "Celui-là, l'équipe l'a mis de côté : il ne peut plus servir pour l'instant. Choisis-en un tout neuf !",
  pseudoSansReseau: "Pour changer de pseudo, il faut un peu de réseau : on vérifie qu'il est libre. Réessaie quand ça capte !",
  nomTropLong: "Ton nom est un poil trop long (ou plein d'emojis) : raccourcis-le.",
  pseudoVerification: "On regarde s'il est libre…",
  pseudoLibre: "Libre ! Il est à toi dès que tu enregistres.",
  aidePseudoAvecCompte: "C'est avec lui que tes potes te trouvent (ton lien d'invitation et ton QR code suivront s'il change). On vérifie qu'il est libre pendant que tu tapes.",
  aidePseudoManquantAvecCompte:
    "Tu n'en as pas encore : choisis-en un pour que tes potes te trouvent. 3 à 20 caractères, en minuscules, chiffres, point ou tiret bas. On vérifie qu'il est libre pendant que tu tapes.",
  enAttenteDuReseau: "C'est noté ! Ça partira dès que le réseau revient.",
} as const;
