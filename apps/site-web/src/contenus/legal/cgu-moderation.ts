// Conditions d'utilisation, section « Signalements et modération » (id « moderation », publié : ne jamais le renommer),
// reprise par cgu.ts. Règlement européen sur les services numériques (DSA, art. 16, 17 et 20) : signalement ouvert à tous,
// décision motivée, contestation. Apple (règle 1.2) : signaler, bloquer, et des règles claires.
// Relu contre le code le 14 octobre 2026 (session Site, lecture seule) :
// - packages/commun/src/regles/signalement.ts (raisons ; masquage immédiat d'un commentaire, d'un message ou d'une liste
//   « choquant » sous 3 conditions ; 183 jours pour contester) ;
// - apps/api/src/services/signalements-sociaux*.ts, routes/signalements-sociaux.ts (20 signalements par 24 h, un par
//   personne et par contenu), commentaires.ts (masquage par le gérant), routes/moderation-app.ts (mes-decisions, contester).
// Fait le 14 octobre 2026 au soir (session Logiciel, F.2) : décision appliquée aux publications, commentaires, messages et
// listes ; cloche « contenu-retire » et « signalement-decide » ; instantané déchiffré ; ménage des signalements à 1 an.
// Relu le 15 octobre 2026 (API redémarrée vers 13 h), passé au présent :
// - signalements sociaux envoyés depuis l'app avec un compte (apps/app-mobile/src/hooks/utiliser-signalements-compte.ts) ;
// - écran « Décisions de la modération » de l'app (Réglages › Tes données ; app/reglages/decisions-moderation.tsx) : règle,
//   explication, contestation une fois pendant 183 jours, et la limitation du compte avec « Contester » ;
// - profil, groupe ou sortie retenu : remis par défaut (services/gestion/moderation-sociale.ts, remettreParDefaut : avatar
//   effacé et pseudo neutre « miami » + chiffres, l'ancien réservé 30 jours pour personne ; titre « Sortie » ; groupe sans
//   titre ; un réexamen ne rend pas l'ancien titre) ;
// - avis et réponses des lieux (services/avis-gestion.ts, gestion/decisions-avis.ts) : réponse publiée tout de suite puis
//   relue ; un avis ou une réponse masqué par l'équipe est une décision écrite, contestable 6 mois dans l'app. Les points
//   d'une photo d'avis retirés au masquage ne sont PAS écrits : l'envoi d'une photo d'avis n'existe pas encore (demarrer.ts,
//   sans verifierPhoto, un avis avec photo est refusé).
// Toujours PAS dans le code : aucune suspension de compte (seulement la limitation, la suppression d'un compte et
// « déconnecter partout » dans le logiciel) : les CGU gardent le droit de le faire, sans dire que c'est automatique.
// Limitation d'un compte (décision de Hugo du 15 octobre 2026, docs/decisions.md, « Modération des avis et limitation d'un
// compte ») : table limitations_comptes et refus 403 « compte-limite » de l'API (services/limitations-comptes*.ts,
// middlewares/refuser-si-limite.ts), « Ton compte est limité » et « Contester » dans « Mon compte » du site (session Site,
// 15 octobre) ; décision, levée, réexamen, cloche, mail et ménage à 1 an : logiciel de gestion (session Logiciel) ; refus
// de la partie sociale : session App. La liste de ce qui reste permis vient de la décision : à garder en phase avec
// apps/site-web/src/contenus/limitation-compte.ts. Côté pro (relu le 15 octobre 2026 : routes/pro.ts et routes/comptoir.ts,
// refuserSiLimite) : fiche, carte, invitation dans l'équipe, programme de fidélité, SOS du soir, message du moment,
// événements (créer, modifier) et réponses aux avis ; arrêter un SOS, effacer un message, annuler un événement, retirer un
// membre et tout le comptoir (visites, réservations, récompenses) restent permis. Précisé par l'App le 15/10 pour le lot
// suivant (au prochain redémarrage) : arrêter un SOS ou annuler un événement, seulement les SIENS ; effacer le message du
// moment, refusé (il est au lieu) ; fidélité : désactiver permis, créer ou modifier en pause ; réservation avec un petit
// mot refusée, sans mot permise.
import { site } from "~/contenus/legal/informations-legales";
import type { SectionLegale } from "~/contenus/legal/type-legal";

const lienContact = `[${site.emailContact}](mailto:${site.emailContact})`;

export const sectionModerationCgu: SectionLegale = {
  id: "moderation",
  titre: "Signalements et modération",
  blocs: [
    `**Tout le monde peut signaler un contenu** : dans l'app, avec le menu « ⋯ » d'une publication, puis « Signaler » ; avec un compte, aussi un commentaire, un message, une liste, un profil, un groupe ou une sortie, depuis leur menu (20 signalements par jour au plus, un seul par contenu). Sans l'app, écris-nous à ${lienContact}, avec le lien ou la description du contenu et ce qui ne va pas.`,
    "Ce qui se passe ensuite :",
    {
      liste: [
        "une **publication** signalée pour **violence ou contenu sexuel** est **masquée pour tout le monde dès le premier signalement**, en attendant la décision ;",
        "un **commentaire**, un **message** ou une **liste** signalés pour violence ou contenu sexuel sont aussi masqués pour tout le monde dès le premier signalement, à trois conditions : la personne qui signale a confirmé son e-mail, elle a un compte depuis au moins **7 jours**, et ce contenu n'a jamais eu de signalement rejeté. Sinon, ils restent visibles jusqu'à la décision ;",
        "pour les autres raisons, une publication, un commentaire, un message ou une liste sont masqués **pour la personne qui signale**, en attendant qu'on les regarde ; un profil, un groupe ou une sortie restent visibles jusqu'à la décision ;",
        "si ton commentaire, ton message ou ta liste est masqué pour tout le monde, **on te prévient** dans l'app, sans te dire qui l'a signalé ;",
        "un membre de l'équipe examine chaque signalement **à la main**, dans notre logiciel de gestion : aucun algorithme ne décide à notre place. Pour un message, il ne lit que la copie du message signalé, jamais le reste de la conversation ;",
        "si le signalement est retenu, le contenu est retiré pour de bon, avec la règle en cause et une explication ; sinon, il est remis en ligne, et un nouveau signalement ne peut plus le masquer d'office. Un profil, un groupe ou une sortie ne peuvent pas être retirés : si le signalement est retenu, ce que tout le monde en voit est remis par défaut. Le profil perd son avatar et reçoit un pseudo neutre (« miami » suivi de chiffres) : la personne peut en choisir un autre, mais pas reprendre l'ancien, bloqué 30 jours pour tout le monde ; une sortie reprend le titre « Sortie », et un groupe perd son titre. L'auteur et la personne qui a signalé sont prévenus dans la cloche de l'app.",
      ],
    },
    "**Le gérant d'un lieu** peut aussi masquer un commentaire sous sa propre publication : le commentaire ne se voit plus que de son auteur, qui est prévenu dans l'app, et il part en modération comme s'il était signalé (voir « Les commentaires et les listes »).",
    "**Les avis et les réponses des lieux** : certains avis sont relus avant d'être publiés (par des ambassadeurs, qui ne voient jamais qui les a écrits), et c'est l'équipe qui tranche. La réponse d'un lieu à un avis est publiée tout de suite, puis relue par l'équipe. Si l'équipe masque un avis ou une réponse, c'est une décision comme les autres : son auteur est prévenu dans la cloche de l'app, avec la règle en cause et l'explication, et peut la contester.",
    `**Pas d'accord avec une décision ?** Que tu sois l'auteur du contenu ou la personne qui l'a signalé, conteste-la dans l'app : l'écran « Décisions de la modération » (Réglages › Tes données, ou depuis la cloche) te montre les décisions qui te concernent (sur tes contenus, tes avis et tes réponses d'un lieu, et sur tes signalements), avec la règle en cause et l'explication, et te laisse les contester directement, **une fois par décision, pendant 6 mois**. Tu peux aussi nous répondre ou écrire à ${lienContact}. Une autre personne de l'équipe réexamine alors la décision, à la main. Tu gardes aussi, toujours, la possibilité de saisir la justice.`,
    "**Selon la gravité**, et surtout si les règles ne sont pas respectées à plusieurs reprises, on peut aussi **limiter** ton compte, suspendre son utilisation ou le supprimer ; on te dit toujours pourquoi. **Signaler exprès** des contenus qui respectent les règles (pour nuire à quelqu'un, ou à un concurrent) est aussi un manquement.",
    "**Un compte limité**, c'est un compte qui ne peut plus rien faire **qui se voie des autres utilisateurs**, pendant un temps donné ou jusqu'à nouvel ordre. C'est une décision de l'équipe, prise à la main, jamais par un algorithme. Pendant la limitation :",
    {
      liste: [
        "**ce qui attend la fin** : tout ce que les autres verraient, c'est-à-dire les messages, les réactions et les groupes, les commentaires, les avis, les sorties, les listes, les lieux envoyés à tes potes, les invitations et les demandes, les suggestions sur la fiche d'un lieu, l'arrivée dans l'équipe d'un lieu, et un nouveau prénom, pseudo ou avatar. Si tu tiens un lieu : les changements de sa fiche, de sa carte, la création ou la modification de son programme de fidélité, les invitations dans son équipe, ses réponses aux avis, son SOS du soir, son message du moment (le publier comme l'effacer) et ses événements (les autres membres de son équipe, eux, publient toujours pour le lieu) ; et, pour une réservation, le petit mot au lieu ;",
        "**ce qui reste permis** : lire, valider tes visites, Miam Safe, le comptoir de ton lieu (visites, réservations, récompenses), arrêter un SOS du soir ou annuler un événement que tu as toi-même lancés (pas ceux d'un collègue), désactiver le programme de fidélité, retirer un membre de ton équipe, réserver sans petit mot, signaler, bloquer, masquer, quitter, refuser, supprimer tes contenus, changer tes réglages, ce que seule notre équipe lit (proposer un lieu, candidater pour être fondateur ou ambassadeur certifié, demander à gérer un lieu, envoyer tes missions d'ambassadeur), « Mon compte », l'export de tes données, la contestation et la suppression de ton compte ;",
        "**tu es prévenu**, dans l'app et par e-mail, avec la règle en cause, l'explication écrite par l'équipe et la date de fin (ou « jusqu'à nouvel ordre ») ; tout est aussi dans « Mon compte », sur le site ;",
        "**pas d'accord ?** Tu peux contester **une fois**, tant que la limitation dure, depuis « Mon compte » sur le site ou depuis l'écran « Décisions de la modération » de l'app : une autre personne de l'équipe que celle qui a décidé réexamine, à la main, et te répond. La limitation s'arrête à sa date de fin, ou plus tôt si on la lève.",
      ],
    },
    "Pour un contenu grave, préviens aussi les autorités : le **17** ou le **112** en cas d'urgence, et [Pharos](https://www.internet-signalement.gouv.fr) pour signaler un contenu illégal. De notre côté, on retire rapidement un contenu illégal qui nous est signalé, et on le transmet aux autorités quand la loi le demande.",
  ],
};
