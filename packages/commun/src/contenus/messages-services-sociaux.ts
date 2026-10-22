// Le texte de chaque erreur de la partie sociale (potes, suivis, messagerie, sorties, listes, commentaires, signalements,
// décisions de la modération), identique dans l'app et ailleurs. Repris par MESSAGES_SERVICE (messages-services.ts), qui
// serait sinon trop long. Pas d'emoji dans titre ni texte : l'emoji est à part, caché aux lecteurs d'écran.
// Les nombres suivent les règles de regles/potes.ts, chat.ts, listes.ts et suivis.ts (vérifié par tests/social.test.ts).

import type { ErreurServiceSociale } from "../types/erreurs-service-sociales.ts";
import type { MessageService } from "./messages-services.ts";

export const MESSAGES_SERVICES_SOCIAUX: Readonly<Record<ErreurServiceSociale, MessageService>> = {
  "pseudo-requis": {
    emoji: "🏷️",
    titre: "Choisis d'abord ton pseudo",
    texte: "C'est lui que tes potes tapent pour te trouver. Profil › Modifier mon profil › Mes infos, et c'est parti.",
  },
  "personne-inconnue": {
    emoji: "🕵️",
    titre: "Personne à ce nom",
    texte: "Ce compte n'existe pas, ou plus. Vérifie le pseudo : une lettre a peut-être filé.",
  },
  "invitation-invalide": {
    emoji: "🔗",
    titre: "Ce lien ne marche plus",
    texte: "Ton pote a peut-être changé son lien. Demande-lui de te remontrer son QR code tout frais.",
  },
  "bande-pleine": {
    emoji: "🚌",
    titre: "La bande affiche complet",
    texte: "200 potes, c'est le maximum d'une bande. Il faut faire un peu de place d'un côté ou de l'autre.",
  },
  "trop-de-demandes-en-attente": {
    emoji: "📨",
    titre: "Plein de demandes en route",
    texte: "Attends que quelques potes répondent avant d'en envoyer d'autres.",
  },
  "demandes-fermees": {
    emoji: "🔒",
    titre: "Cette personne ne reçoit pas de demandes",
    texte: "Elle a choisi qu'on ne la trouve pas par son pseudo. Pour rejoindre sa bande, demande-lui son lien ou son QR code !",
  },
  "demande-inconnue": {
    emoji: "🍃",
    titre: "Demande envolée",
    texte: "Elle a été annulée, ou elle a expiré entre-temps.",
  },
  "pas-dans-la-bande": {
    emoji: "🤝",
    titre: "Seulement avec ta bande",
    texte: "Pour discuter, inviter ou remplir une liste à plusieurs, il faut être dans la même bande.",
  },
  "profil-prive": {
    emoji: "🔒",
    titre: "Réservé à sa bande",
    texte: "Cette personne garde ça pour ses potes. Le reste de son profil est juste au-dessus.",
  },
  "trop-d-abonnements": {
    emoji: "🧲",
    titre: "Tu suis déjà plein de monde",
    texte: "2 000 abonnements, c'est le maximum. Un petit tri, ça fait du bien aussi.",
  },
  "trop-de-blocages": {
    emoji: "🧱",
    titre: "Liste bien remplie",
    texte: "Tu as déjà bloqué 1 000 personnes. Écris-nous si quelqu'un t'embête vraiment.",
  },
  "conversation-inconnue": {
    emoji: "💨",
    titre: "Discussion introuvable",
    texte: "Elle a été effacée, ou tu n'en fais plus partie.",
  },
  "conversation-fermee": {
    emoji: "🔇",
    titre: "Discussion en lecture seule",
    texte: "Vous n'êtes plus dans la même bande : tu peux relire, mais plus écrire.",
  },
  "groupe-plein": {
    emoji: "🎪",
    titre: "Groupe au complet",
    texte: "20 personnes, invitations en attente comprises, c'est le maximum d'un groupe. Ça fait déjà une belle tablée !",
  },
  "reserve-aux-admins": {
    emoji: "🎩",
    titre: "C'est aux admins de jouer",
    texte: "Seuls les admins du groupe invitent, retirent ou renomment.",
  },
  "reserve-a-l-auteur": {
    emoji: "✍️",
    titre: "Pas touche, c'est son œuvre",
    texte: "Seul son auteur peut faire ça (et ses co-auteurs, pour remplir une liste).",
  },
  "reserve-au-gerant": {
    emoji: "🧑‍🍳",
    titre: "Réservé au gérant du lieu",
    texte: "Seul le gérant du lieu peut répondre en son nom ou masquer un commentaire sous sa publication.",
  },
  "reserve-a-l-organisateur": {
    emoji: "🧑‍✈️",
    titre: "L'organisateur décide",
    texte: "Seul l'organisateur de la sortie peut faire ça.",
  },
  "message-inconnu": {
    emoji: "💨",
    titre: "Message introuvable",
    texte: "Il a été supprimé entre-temps.",
  },
  "media-expire": {
    emoji: "⏳",
    titre: "Ce média a expiré",
    texte: "Photos et notes vocales s'effacent de notre serveur 90 jours après l'envoi.",
  },
  "media-invalide": {
    emoji: "🖼️",
    titre: "Ce fichier ne passe pas",
    texte: "Une photo de 4 096 pixels de côté au plus, ou une note vocale d'une minute au plus.",
  },
  "media-trop-lourd": {
    emoji: "🐘",
    titre: "Fichier trop lourd",
    texte: "5 Mo pour une photo, 2 Mo pour une note vocale. Essaie plus court ou plus léger.",
  },
  "format-refuse": {
    emoji: "🧩",
    titre: "Format inconnu",
    texte: "On prend les photos et les notes vocales envoyées depuis l'app.",
  },
  "trop-de-medias": {
    emoji: "📸",
    titre: "Pause photo !",
    texte: "50 photos et notes vocales par jour, c'est le maximum. La suite demain !",
  },
  "sortie-inconnue": {
    emoji: "🎈",
    titre: "Sortie envolée",
    texte: "Elle a été annulée, ou tu n'y es plus invité.",
  },
  "sortie-pleine": {
    emoji: "🪑",
    titre: "Plus une chaise de libre",
    texte: "15 personnes par sortie, organisateur compris.",
  },
  "sortie-passee": {
    emoji: "🕰️",
    titre: "C'est déjà passé",
    texte: "Cette sortie a eu lieu : on n'y invite plus personne, et on n'y entre plus.",
  },
  "vote-termine": {
    emoji: "🗳️",
    titre: "Les jeux sont faits",
    texte: "Le vote est fini : rendez-vous au lieu retenu !",
  },
  "max-propositions": {
    emoji: "📋",
    titre: "La liste des lieux est pleine",
    texte: "8 lieux proposés, c'est le maximum. Votez parmi eux !",
  },
  "trop-de-sorties": {
    emoji: "🗓️",
    titre: "Ton agenda déborde",
    texte: "20 sorties à venir, c'est le maximum. Profite d'abord de celles-là !",
  },
  "liste-inconnue": {
    emoji: "📭",
    titre: "Liste introuvable",
    texte: "Elle a été supprimée, ou elle n'est plus visible pour toi.",
  },
  "trop-de-listes": {
    emoji: "📚",
    titre: "Ça fait beaucoup de listes",
    texte: "50 listes, c'est le maximum. Fusionne ou supprime celles qui dorment.",
  },
  "liste-pleine": {
    emoji: "🧺",
    titre: "Liste pleine à craquer",
    texte: "100 lieux par liste, c'est le maximum. Et si tu en commençais une autre ?",
  },
  "trop-de-co-auteurs": {
    emoji: "👥",
    titre: "Assez de cuisiniers",
    texte: "10 co-auteurs par liste, c'est le maximum.",
  },
  "invitation-inconnue": {
    emoji: "🍃",
    titre: "Invitation envolée",
    texte: "Elle a été retirée, ou elle a expiré entre-temps.",
  },
  "commentaire-inconnu": {
    emoji: "💨",
    titre: "Commentaire introuvable",
    texte: "Il a été supprimé entre-temps.",
  },
  "contenu-inconnu": {
    emoji: "💨",
    titre: "Plus rien à signaler",
    texte: "Ce contenu a disparu entre-temps.",
  },
  "signalement-invalide": {
    emoji: "📝",
    titre: "Il manque un détail",
    texte: "Choisis une raison, et explique avec tes mots si c'est « Autre chose » (10 caractères au moins).",
  },
  // Clé des données absente : aussi rendu par l'inscription et le profil, donc un texte qui ne parle pas des messages
  "chiffrement-indisponible": {
    emoji: "🔐",
    titre: "Coffre-fort fermé",
    texte: "Notre coffre-fort est fermé pour un moment. Réessaie dans un instant : rien n'est perdu.",
  },
  "geree-par-la-sortie": {
    emoji: "🎉",
    titre: "Ça se passe dans la sortie",
    texte: "Pour inviter, retirer ou partir, passe par la sortie elle-même.",
  },
  "trop-de-masques": {
    emoji: "🙈",
    titre: "Ta vue est déjà bien rangée",
    texte: "2 000 éléments retirés, c'est le maximum. Remets-en quelques-uns avant d'en cacher d'autres.",
  },
  "deja-examine": {
    emoji: "🔎",
    titre: "Déjà examiné",
    texte: "La modération a déjà regardé ce commentaire et l'a laissé en ligne.",
  },
  "stockage-plein": {
    emoji: "📦",
    titre: "Nos placards débordent",
    texte: "On fait un peu de place sur le serveur. Ta photo ou ta note vocale pourra partir dans un moment.",
  },
  "decision-inconnue": {
    emoji: "🍃",
    titre: "Décision introuvable",
    texte: "Elle n'est pas encore prise, ou elle ne te concerne pas.",
  },
  "deja-contestee": {
    emoji: "📮",
    titre: "Déjà contestée",
    texte: "On a bien reçu ta contestation : on réexamine, et on te tient au courant.",
  },
  "contestation-hors-delai": {
    emoji: "🕰️",
    titre: "Trop tard pour contester",
    texte: "On peut contester une décision pendant 6 mois. Écris-nous si c'est vraiment important.",
  },
  "notification-inconnue": {
    emoji: "🍃",
    titre: "Déjà envolée",
    texte: "Cette notification a déjà quitté ta cloche, peut-être depuis ton autre téléphone.",
  },
  "trop-tard": {
    emoji: "⏱️",
    titre: "Trop tard pour corriger",
    texte: "Un message se corrige dans les 15 minutes qui suivent l'envoi. Rien ne t'empêche d'en écrire un nouveau !",
  },
  "non-modifiable": {
    emoji: "✋",
    titre: "Pas modifiable",
    texte: "Seuls tes messages texte se corrigent : une photo, un lieu ou un sondage restent tels quels.",
  },
  "pas-l-auteur": {
    emoji: "🙅",
    titre: "Ce n'est pas ton message",
    texte: "Seule la personne qui l'a écrit peut le corriger.",
  },
  "reponse-introuvable": {
    emoji: "💨",
    titre: "Message introuvable",
    texte: "Le message que tu cites a disparu entre-temps.",
  },
  "trop-d-epinglees": {
    emoji: "📌",
    titre: "Déjà 3 épinglées",
    texte: "Retire une discussion des épinglées pour en mettre une nouvelle en haut.",
  },
  "album-plein": {
    emoji: "🖼️",
    titre: "Album complet",
    texte: "10 photos d'un coup au plus : envoie la suite dans un autre message !",
  },
  "onde-invalide": {
    emoji: "🎙️",
    titre: "Note vocale abîmée",
    texte: "Elle n'a pas pu partir. Réenregistre-la, ça ne prend qu'une minute.",
  },
  "photo-inconnue": {
    emoji: "🖼️",
    titre: "Pas encore de photo",
    texte: "Ce groupe n'a pas encore sa photo.",
  },
  "reserve-aux-groupes": {
    emoji: "👥",
    titre: "Seulement dans un groupe",
    texte: "Les sondages « On mange où ? » se lancent dans un groupe de potes.",
  },
  "sondage-clos": {
    emoji: "🗳️",
    titre: "Le vote est fini",
    texte: "Ce sondage est terminé : va voir qui a gagné !",
  },
  "gif-indisponible": {
    emoji: "🎞️",
    titre: "Les GIF font la sieste",
    texte: "Impossible de les joindre pour l'instant. Réessaie dans un moment.",
  },
  "gif-inconnu": {
    emoji: "🎞️",
    titre: "GIF introuvable",
    texte: "Ce GIF n'existe plus. Choisis-en un autre !",
  },
  "gif-refuse": {
    emoji: "🙈",
    titre: "GIF refusé",
    texte: "Celui-là ne passe pas nos filtres. Choisis-en un autre !",
  },
};
