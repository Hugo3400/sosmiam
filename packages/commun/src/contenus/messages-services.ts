// Le texte de chaque erreur des services (visites, fidélité, réservations, avis, comptoir, espace ambassadeur),
// identique dans l'app et sur le site. Les valeurs entre accolades ({lieu}, {distance}, {precision}, {date})
// sont remplacées par remplirModele. Pas d'emoji dans titre ni texte : l'emoji est à part, caché aux lecteurs d'écran.
// Les textes de la partie sociale sont dans messages-services-sociaux.ts, repris à la fin de MESSAGES_SERVICE.

import type { ErreurService } from "../types/erreurs-service.ts";
import type { ParLangue } from "../types/traduction.ts";
import { MESSAGES_SERVICE_ANGLAIS } from "./anglais/messages-services.ts";
import { MESSAGES_SERVICES_SOCIAUX } from "./messages-services-sociaux.ts";
import { MESSAGES_CONNEXION_QR } from "./messages-connexion-qr.ts";
import { MESSAGES_RESERVATIONS } from "./messages-reservations.ts";
import { MESSAGES_SERVICES_COMMUNAUTE } from "./messages-services-communaute.ts";
import { MESSAGES_CARRIERE } from "./messages-carriere.ts";
import { MESSAGES_SECURITE } from "./messages-securite.ts";
import { MESSAGES_IMAGES_LIEU } from "./messages-images-lieu.ts";

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
  "erreur-serveur": {
    emoji: "🧯",
    titre: "Petit pépin de notre côté",
    texte: "Notre serveur a trébuché, ce n'est pas toi. Réessaie dans un instant ; si ça continue, écris-nous.",
  },
  "champ-invalide": {
    emoji: "✏️",
    titre: "Une info ne va pas",
    texte: "Jette un œil au champ indiqué, corrige-le, et c'est reparti.",
  },
  "identifiants": {
    emoji: "🔑",
    titre: "E-mail ou mot de passe incorrect",
    texte: "Vérifie les deux. Compte créé avec Apple ou Google ? Passe par leur bouton, ou choisis un mot de passe avec « Mot de passe oublié ».",
  },
  "email-deja-utilise": {
    emoji: "📮",
    titre: "Cet e-mail a déjà un compte",
    texte: "Connecte-toi avec, ou passe par « Mot de passe oublié » si tu ne t'en souviens plus.",
  },
  "age-minimum": {
    emoji: "🎂",
    titre: "Encore un peu de patience",
    texte: "SOS Miam, c'est dès ta majorité : 18 ans en France. On te garde une table au chaud pour ce jour-là !",
  },
  "pseudo-pris": {
    emoji: "🏷️",
    titre: "Ce pseudo est déjà pris",
    texte: "Quelqu'un a eu la même idée géniale. Essaie une variante, avec ton quartier ou ton plat préféré.",
  },
  "mot-de-passe-incorrect": {
    emoji: "🔒",
    titre: "Mot de passe incorrect",
    texte: "Ce n'est pas le bon. Réessaie, ou passe par « Mot de passe oublié ».",
  },
  "jeton-externe-invalide": {
    emoji: "🪪",
    titre: "La connexion n'est pas passée",
    texte: "Apple ou Google n'a pas confirmé que c'est bien toi. Réessaie dans un instant.",
  },
  "compte-deja-rattache": {
    emoji: "🔗",
    titre: "Déjà lié à un autre compte",
    texte: "Ce compte Apple ou Google est déjà relié à un autre compte SOS Miam. Connecte-toi avec lui.",
  },
  "confirmation-incorrecte": {
    emoji: "🛑",
    titre: "Confirmation refusée",
    texte: "Pour effacer ton compte, reconnecte-toi avec le même compte Apple ou Google que d'habitude.",
  },
  // « Mes façons de me connecter » (Mon compte) : relier ou délier Apple et Google, mêmes mots que sur le site
  "deja-relie": {
    emoji: "🔗",
    titre: "Une clé est déjà là",
    texte: "Ton compte SOS Miam a déjà un autre compte de ce genre relié. Délie-le d'abord, puis relie le nouveau.",
  },
  "identite-deja-reliee": {
    emoji: "🔗",
    titre: "Déjà relié à un autre compte",
    texte: "Ce compte est déjà relié à un autre compte SOS Miam. On ne fusionne jamais deux comptes : délie-le depuis l'autre compte (ou supprime celui-là), puis reviens le relier ici.",
  },
  "derniere-connexion": {
    emoji: "🚪",
    titre: "C'est ta seule clé",
    texte: "Sans elle, tu resterais à la porte ! Ajoute un mot de passe ou relie un autre compte d'abord.",
  },
  "apple-indisponible": {
    emoji: "🍎",
    titre: "Apple ne répond pas",
    texte: "La connexion avec Apple n'est pas possible pour l'instant. Réessaie un peu plus tard.",
  },
  "google-indisponible": {
    emoji: "🔍",
    titre: "Google ne répond pas",
    texte: "La connexion avec Google n'est pas possible pour l'instant. Réessaie un peu plus tard.",
  },
  "verification-indisponible": {
    emoji: "⏳",
    titre: "Vérification en pause",
    texte: "On n'arrive pas à vérifier ta connexion en ce moment. Réessaie dans 30 secondes.",
  },
  "email-manquant": {
    emoji: "📭",
    titre: "Il nous faut ton e-mail",
    texte: "Autorise le partage de ton e-mail (même masqué) au moment de te connecter, puis réessaie.",
  },
  "profil-a-completer": {
    emoji: "👋",
    titre: "Encore quelques infos",
    texte: "Ton prénom, ta date de naissance et ta ville, et on y est.",
  },
  "reserve-aux-majeurs": {
    emoji: "🔞",
    titre: "C'est pour les 18 ans et plus",
    texte: "Ce coin-là de SOS Miam est réservé aux 18 ans et plus. Une erreur sur ta date de naissance ? Écris-nous à bonjour@sosmiam.fr, on regarde ça ensemble.",
  },
  "compte-mineur": {
    emoji: "🧑‍🍳",
    titre: "Pas avant 18 ans",
    texte: "Cette personne n'a pas encore 18 ans : elle ne peut pas rejoindre l'équipe d'un lieu sur SOS Miam.",
  },
  "evenement-invalide": {
    emoji: "📝",
    titre: "Un détail à revoir",
    texte: "Un champ de ton événement coince : celui qui est surligné. Pas de gros mot, pas d'open bar, et 3 mois à l'avance au plus.",
  },
  "trop-d-evenements": {
    emoji: "🗓️",
    titre: "Ton agenda déborde",
    texte: "10 événements à venir, c'est le maximum par lieu. Annules-en un ou attends que le prochain soit passé.",
  },
  "evenement-passe": {
    emoji: "🎬",
    titre: "C'est déjà fini",
    texte: "Cet événement est passé : il ne se modifie plus et ne s'annule plus. Le prochain sera encore mieux !",
  },
  "evenement-inconnu": {
    emoji: "🎈",
    titre: "Événement envolé",
    texte: "Il a été annulé ou retiré entre-temps. Jette un œil aux autres événements du coin !",
  },
  "avis-ferme": {
    emoji: "⌛",
    titre: "Trop tard pour cet avis",
    texte: "Les avis se donnent dans les 14 jours après ta visite. Repasse les voir : ta prochaine visite t'en ouvre un tout neuf !",
  },
  "avis-visite-requise": {
    emoji: "🧾",
    titre: "Ici, l'avis se gagne à table",
    texte: "Ce lieu est vérifié : fais valider ta visite en payant, et ton avis s'ouvre une heure après.",
  },
  "avis-recent": {
    emoji: "📆",
    titre: "Tu as déjà donné ton avis ici",
    texte: "Un avis par lieu tous les 30 jours : le prochain sera possible à partir du {date}. Tes papilles ont bonne mémoire !",
  },
  "reponse-deja-donnee": {
    emoji: "💬",
    titre: "Tu as déjà répondu",
    texte: "Une réponse par avis, et la tienne est déjà passée. L'équipe SOS Miam la relit, comme toutes les autres.",
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
    titre: "Compte limité jusqu'au {date}",
    texte: "Certaines actions sont en pause pour l'instant. On t'explique pourquoi dans Paramètres › Décisions de la modération : si c'est une erreur, conteste, un humain relira.",
  },
  "aucune-limitation": {
    emoji: "🌤️",
    titre: "Rien à contester",
    texte: "Ton compte n'est pas limité (ou ne l'est plus) : tout marche normalement.",
  },
  "deja-conteste": {
    emoji: "📨",
    titre: "Contestation déjà envoyée",
    texte: "On a bien ta contestation : une autre personne de l'équipe la relit, et tu auras sa réponse. Une seule par limitation.",
  },
  "validations-en-pause": {
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
  "membre-du-lieu": {
    emoji: "🧑‍🍳",
    titre: "Tu fais partie de l'équipe ici",
    texte: "Tes passages chez toi ne comptent pas, sinon ce serait trop facile. Va goûter chez les voisins !",
  },
  "sos-deja-lance": {
    emoji: "🆘",
    titre: "Un SOS par jour",
    texte: "Ton SOS de ce soir a déjà été lancé (même s'il est arrêté). On remet ça demain, promis.",
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
    texte: "Pour ajouter un pote, passe par l'onglet Communauté.",
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
  "message-refuse": {
    emoji: "✋",
    titre: "On reformule ?",
    texte: "Ton petit mot contient un terme qu'on ne laisse pas passer.",
  },
  "pas-de-recompense": {
    emoji: "🎁",
    titre: "Pas encore de récompense",
    texte: "Encore quelques tampons et c'est pour toi.",
  },
  "programme-invalide": {
    emoji: "🎁",
    titre: "Il manque quelque chose",
    texte: "Vérifie la récompense et le nombre de visites. La version sans alcool est facultative, mais sans une goutte d'alcool !",
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
  "deja-sur-place": {
    emoji: "📍",
    titre: "Ta présence est déjà notée",
    texte: "Pas besoin de le redire : l'équipe a déjà l'heure de ton passage. Il ne reste que ton compte rendu.",
  },
  "lieu-sans-position": {
    emoji: "🧭",
    titre: "Ce lieu n'a pas encore son épingle",
    texte: "Sans elle, impossible de vérifier que tu y es. Raconte ton passage dans le compte rendu : ça suffit à l'équipe.",
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
  "visite-requise": {
    emoji: "🧾",
    titre: "Après une visite seulement",
    texte: "On te pose la question après une visite validée dans ce lieu : c'est ce qui rend le repère fiable.",
  },
  "pote-inconnu": {
    emoji: "👋",
    titre: "Cette personne n'est plus dans ta bande",
    texte: "On ne peut prévenir qu'un pote de ta bande. Appelle-la directement, ou appelle les secours si tu es en danger.",
  },
  "partage-inconnu": {
    emoji: "📍",
    titre: "Partage introuvable",
    texte: "Ce partage de position n'existe plus, ou il ne t'est pas destiné.",
  },
  "partage-termine": {
    emoji: "📍",
    titre: "Le partage est terminé",
    texte: "La position n'est plus partagée : l'heure est passée, ou le partage a été arrêté.",
  },
  "position-non-partagee": {
    emoji: "📍",
    titre: "Position non partagée",
    texte: "Tu as choisi de ne pas partager ta position avec ce pote : rien n'est envoyé.",
  },
  ...MESSAGES_SERVICES_SOCIAUX,
  // Connexion par QR code (messages-connexion-qr.ts)
  ...MESSAGES_CONNEXION_QR,
  ...MESSAGES_RESERVATIONS,
  ...MESSAGES_SERVICES_COMMUNAUTE,
  ...MESSAGES_CARRIERE,
  ...MESSAGES_SECURITE,
  ...MESSAGES_IMAGES_LIEU,
};

export const MESSAGES_SERVICE_PAR_LANGUE: ParLangue<Readonly<Record<ErreurService, MessageService>>> = { fr: MESSAGES_SERVICE, en: MESSAGES_SERVICE_ANGLAIS };
