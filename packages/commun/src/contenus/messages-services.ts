// Le texte de chaque erreur des services (visites, fidélité, réservations, avis, comptoir, espace ambassadeur),
// identique dans l'app et sur le site. Les valeurs entre accolades ({lieu}, {distance}, {precision}, {date})
// sont remplacées par remplirModele. Pas d'emoji dans titre ni texte : l'emoji est à part, caché aux lecteurs d'écran.

import type { ErreurService } from "../types/erreurs-service.ts";

export type MessageService = { emoji: string; titre: string; texte: string };

export const MESSAGES_SERVICE: Readonly<Record<ErreurService, MessageService>> = {
  "connexion-requise": {
    emoji: "🔑",
    titre: "Il te faut un compte",
    texte: "Crée ton compte pour que tes visites comptent : points, tampons et avis vérifiés.",
  },
  "service-indisponible": {
    emoji: "🛠️",
    titre: "Ça arrive avec les comptes",
    texte: "La validation des visites s'allume dès que les comptes SOS Miam sont ouverts. Encore un peu de patience !",
  },
  "hors-ligne": {
    emoji: "📶",
    titre: "Pas de réseau ici",
    texte: "Rien n'est parti. Rapproche-toi de la porte ou du wifi du lieu, puis réessaie : rien n'est perdu.",
  },
  "trop-de-demandes": {
    emoji: "🐢",
    titre: "Doucement !",
    texte: "Beaucoup d'essais d'un coup : réessaie dans quelques minutes.",
  },
  "compte-limite": {
    emoji: "⏸️",
    titre: "Validations en pause jusqu'au {date}",
    texte: "On t'a écrit pour t'expliquer pourquoi. Si c'est une erreur, réponds-nous : un humain relira.",
  },
  introuvable: {
    emoji: "🔍",
    titre: "Introuvable",
    texte: "Ça n'existe plus, ou ça n'a jamais existé. Reprends depuis le début.",
  },
  "transition-interdite": {
    emoji: "🔁",
    titre: "C'est déjà réglé",
    texte: "Quelqu'un a été plus rapide : l'écran se met à jour.",
  },
  "delai-depasse": {
    emoji: "⌛",
    titre: "Trop tard pour ça",
    texte: "Le délai est passé. Pas grave : ce sera pour le prochain passage.",
  },
  "role-requis": {
    emoji: "🚪",
    titre: "Pas d'accès ici",
    texte: "Cet espace est réservé à l'équipe du lieu ou aux ambassadeurs validés.",
  },
  "lieu-sans-validation": {
    emoji: "🌱",
    titre: "{lieu} ne valide pas encore les visites",
    texte: "Ça arrive bientôt. En attendant, une rescousse leur fait toujours plaisir.",
  },
  "mineur-bar": {
    emoji: "🚫",
    titre: "Ce lieu n'est pas disponible avec ton compte",
    texte: "Il y en a plein d'autres qui t'attendent dans Explorer.",
  },
  "membre-du-lieu": {
    emoji: "🧑‍🍳",
    titre: "Tu fais partie de l'équipe ici",
    texte: "Tes passages chez toi ne comptent pas, sinon ce serait trop facile. Va goûter chez les voisins !",
  },
  "email-non-verifie": {
    emoji: "📬",
    titre: "Confirme d'abord ton e-mail",
    texte: "Pour valider une visite, on a besoin d'un e-mail confirmé. Touche le lien qu'on t'a envoyé, ou redemande-le depuis ton compte.",
  },

  "position-refusee": {
    emoji: "📍",
    titre: "Sans ta position, on ne peut pas vérifier que tu es là",
    texte: "… et ta visite ne compterait pas. Pas de pression : le repas reste bon même sans points.",
  },
  "position-bloquee": {
    emoji: "📍",
    titre: "Ta position est bloquée pour SOS Miam",
    texte: "Tu peux l'autoriser dans les réglages de ton téléphone, juste le temps de valider.",
  },
  "position-coupee": {
    emoji: "📡",
    titre: "La localisation est coupée",
    texte: "Rallume-la dans les réglages du téléphone, puis réessaie.",
  },
  "position-introuvable": {
    emoji: "🛰️",
    titre: "Ton téléphone ne sait pas où il est",
    texte: "Approche-toi d'une fenêtre ou sors une seconde, puis réessaie.",
  },
  "position-approximative": {
    emoji: "🎯",
    titre: "Ta position est en mode approximatif",
    texte: "Active « Position exacte » pour SOS Miam, juste le temps de valider. Tu pourras la couper après.",
  },
  "position-imprecise": {
    emoji: "🌫️",
    titre: "Ton téléphone hésite",
    texte: "Il te situe à {precision} près, c'est trop flou pour valider. Approche-toi d'une fenêtre, puis réessaie.",
  },
  "position-perimee": {
    emoji: "⏱️",
    titre: "Ta position date un peu",
    texte: "On en lit une toute fraîche : réessaie.",
  },
  "position-simulee": {
    emoji: "🕹️",
    titre: "Ta position a l'air simulée par une app",
    texte: "Coupe-la pour valider ta visite.",
  },
  "hors-zone": {
    emoji: "🗺️",
    titre: "Tu as l'air un peu loin",
    texte: "On te situe à environ {distance} de {lieu}. Pour valider, il faut être sur place.",
  },
  "qr-illisible": {
    emoji: "🤔",
    titre: "Ce QR ne vient pas de chez nous",
    texte: "Joli quand même. Cherche celui que te montre l'équipe, ou demande l'addition dans l'app.",
  },
  "qr-vitrine": {
    emoji: "🪧",
    titre: "C'est le QR de la vitrine",
    texte: "Il ouvre la fiche de {lieu}. Pour valider ta visite, c'est au moment de payer : l'équipe te montre un QR qui change.",
  },
  "qr-invitation": {
    emoji: "👋",
    titre: "C'est le QR d'un pote, pas celui du comptoir",
    texte: "Pour ajouter un pote, passe par l'onglet Potes.",
  },
  "qr-expire": {
    emoji: "⏳",
    titre: "Ce QR a déjà changé",
    texte: "Il change toutes les 30 secondes pour décourager les petits malins. Demande à l'équipe de te le remontrer.",
  },
  "qr-invalide": {
    emoji: "🤔",
    titre: "Ce QR n'a pas l'air valable",
    texte: "Demande à l'équipe de te le remontrer, ou demande l'addition dans l'app.",
  },
  "qr-epuise": {
    emoji: "🎟️",
    titre: "Ce QR a déjà servi pour tout le monde",
    texte: "L'équipe peut en montrer un autre.",
  },
  "qr-demo": {
    emoji: "🧪",
    titre: "C'est un QR de démo",
    texte: "Il ne marche que dans la démo, pas pour de vrai.",
  },
  "deja-validee": {
    emoji: "✅",
    titre: "C'est déjà validé",
    texte: "Tu as tout bon !",
  },
  "demande-en-cours": {
    emoji: "🧾",
    titre: "Une addition à la fois",
    texte: "Tu en as déjà une en attente chez {lieu}. Annule-la d'abord si tu as changé de table.",
  },
  "code-faux": {
    emoji: "🔢",
    titre: "Ce n'est pas le bon code",
    texte: "Demande à la personne de remontrer son écran : 4 chiffres, à côté de son prénom.",
  },
  "lieu-non-reservable": {
    emoji: "📵",
    titre: "{lieu} ne prend pas les réservations dans l'app",
    texte: "Tu peux passer directement, ou leur donner une rescousse.",
  },
  "creneau-invalide": {
    emoji: "🕰️",
    titre: "Ce créneau ne marche pas",
    texte: "Le lieu est fermé à cette heure-là, ou c'est trop proche. Choisis-en un autre.",
  },
  "personnes-invalides": {
    emoji: "👥",
    titre: "Combien vous êtes ?",
    texte: "Entre 1 et 12 personnes. Pour un plus grand groupe, appelle directement le lieu.",
  },
  "message-refuse": {
    emoji: "✋",
    titre: "On reformule ?",
    texte: "Ton petit mot contient un terme qu'on ne laisse pas passer.",
  },
  "reservation-en-cours": {
    emoji: "📅",
    titre: "Tu as déjà une demande ici",
    texte: "Attends leur réponse, ou annule-la pour en faire une autre.",
  },
  "hors-fenetre-presence": {
    emoji: "🕒",
    titre: "Pas encore l'heure",
    texte: "« Je suis là » s'ouvre une heure avant ton créneau, et jusqu'à 4 h après.",
  },
  "pas-de-recompense": {
    emoji: "🎁",
    titre: "Pas encore de récompense",
    texte: "Encore quelques tampons et c'est pour toi.",
  },
  "programme-invalide": {
    emoji: "🎁",
    titre: "Il manque quelque chose",
    texte: "Vérifie la récompense, le nombre de visites, et la version sans alcool s'il y en a.",
  },
  "proposition-invalide": {
    emoji: "✏️",
    titre: "Ta proposition ne passe pas",
    texte: "Change au moins une info, sans gros mot ni texte trop long, et vérifie le téléphone et le site.",
  },
  "rien-a-changer": {
    emoji: "🤔",
    titre: "Rien n'a changé",
    texte: "Tout ce que tu proposes est déjà sur la fiche. Merci quand même d'avoir vérifié !",
  },
  "lieu-inconnu": {
    emoji: "🔍",
    titre: "Lieu introuvable",
    texte: "Ce lieu n'est plus sur SOS Miam, ou pas encore publié.",
  },
  "trop-de-suggestions": {
    emoji: "✏️",
    titre: "Beaucoup de propositions d'un coup",
    texte: "Tu en as déjà envoyé beaucoup aujourd'hui, ou ce lieu en a déjà plusieurs en attente. L'équipe les relit : réessaie demain.",
  },
  "lieu-non-verifie": {
    emoji: "🛟",
    titre: "Pas encore de rescousse ici",
    texte: "Ce lieu n'a pas encore été vérifié par l'équipe. Garde-le sous le coude, tu pourras lui donner un coup de main bientôt.",
  },
  "plus-de-rescousse": {
    emoji: "🛟",
    titre: "Tes 3 rescousses sont données",
    texte: "Bravo, tu as tout donné cette semaine ! Elles reviennent lundi.",
  },
  "publication-inconnue": {
    emoji: "🔍",
    titre: "Publication introuvable",
    texte: "Elle a été retirée ou n'est plus en ligne.",
  },
  "infos-invalides": {
    emoji: "📋",
    titre: "Une info ne passe pas",
    texte: "Vérifie le téléphone (un numéro français), le site (en https) et le nom Instagram.",
  },
  "carte-invalide": {
    emoji: "🍽️",
    titre: "Ta carte ne passe pas",
    texte: "Vérifie les noms (sans gros mot ni texte trop long) et les prix, comme 12 ou 4,50.",
  },
  "reglement-invalide": {
    emoji: "🧾",
    titre: "Ce règlement ne passe pas",
    texte: "Choisis payé, avec réduction ou offert, et les avantages de la liste.",
  },
  "avis-pas-ouvert": {
    emoji: "🕐",
    titre: "Ton avis s'ouvre bientôt",
    texte: "Une heure après ta visite, à tête reposée. Pas devant le patron.",
  },
  "avis-deja-donne": {
    emoji: "💬",
    titre: "Tu as déjà donné ton avis",
    texte: "Merci, il compte ! Un avis par visite.",
  },
  "avis-invalide": {
    emoji: "✍️",
    titre: "Ton avis a besoin d'une retouche",
    texte: "Entre 10 et 1000 caractères, sans insulte. Critique, c'est permis !",
  },
  "compte-rendu-invalide": {
    emoji: "✍️",
    titre: "Raconte un peu plus",
    texte: "Entre 5 et 2000 caractères, sans insulte.",
  },
  "deja-relu": {
    emoji: "👀",
    titre: "Déjà relu",
    texte: "Cet avis a déjà ton verdict, merci !",
  },
  // Miam Safe : ton doux et sérieux, pas de blague
  "pas-miam-safe": {
    emoji: "🛟",
    titre: "Ce lieu ne reçoit pas les alertes",
    texte: "Il n'a pas signé la charte Miam Safe. Appelle les secours si tu es en danger, ou préviens un pote.",
  },
  "charte-retiree": {
    emoji: "🛡",
    titre: "Charte retirée par l'équipe",
    texte: "L'équipe SOS Miam a retiré la charte de ce lieu. Écris-nous à bonjour@sosmiam.fr pour en parler.",
  },
};
