// Politique de confidentialité, section « Signaler et modérer dans la partie sociale » (id « signalements-sociaux »),
// reprise par confidentialite.ts dans le chapitre « Ta bande et tes messages ».
// Relu contre le code le 14 octobre 2026 (session Site, lecture seule) : apps/api/prisma/schema/lieux.prisma (Signalement :
// signalePar, auteurContenu, instantaneChiffre, fichierMedia, motif, motivation, contestation), apps/api/src/services/
// instantanes-signalements.ts (contenu de l'instantané), signalements-sociaux*.ts, commentaires.ts (masquage par le gérant),
// packages/commun/src/regles/signalement.ts (7 jours, 183 jours, 365 jours).
// Fait le 14 au soir (session Logiciel, F.2) : effacement à 1 an après la décision (ou le réexamen), publications comprises,
// et instantané déchiffré dans le logiciel (écran en place depuis la version 1.0.2).
// Relu le 15 octobre 2026 (API redémarrée vers 13 h), passé au présent :
// - envoi depuis l'app (lot A7) : apps/app-mobile/src/hooks/utiliser-signalements-compte.ts (POST /app/signalements avec un
//   compte ; sans réseau, stockage/signalements-sociaux-a-envoyer.ts, effacé à la déconnexion) ;
// - écran « Décisions de la modération » (Réglages › Tes données, et depuis la cloche) : app/reglages/decisions-moderation.tsx,
//   API routes/moderation-app.ts (mes-decisions, contestation une fois, 183 jours) ;
// - preuve gardée (décision de Hugo du 15 octobre 2026) : le fichier chiffré d'un média signalé reste tant que le
//   signalement est ouvert, ou jugé (ou réexaminé) depuis moins de 183 jours, même retenu (effacer-conversations.ts,
//   signalementsGardantLeurFichier) ; le logiciel ne l'ouvre que pendant que le signalement est ouvert
//   (controleurs/gestion/controleurs-moderation.ts) ;
// - contenus retirés vidés ou effacés 1 an après la décision, sauf contestation en attente (menage-social-etapes.ts, étape 7) ;
// - profil, groupe ou sortie retenu : remis par défaut (services/gestion/moderation-sociale.ts, remettreParDefaut).
// Limitation d'un compte (décision de Hugo du 15 octobre 2026) : apps/api/prisma/schema/limitations-comptes.prisma (motif,
// motivation, début, fin, levée, contestation, réexamen ; rien sur la personne de l'équipe), services/limitations-comptes*.ts
// (estLimite, contestation une fois pendant la limitation, effacerLimitationsAnciennes : 1 an après la fin ou la levée,
// lancé chaque nuit par le logiciel de gestion), suppression du compte : ON DELETE CASCADE.
import type { SectionLegale } from "~/contenus/legal/type-legal";

export const sectionSignalementsSociaux: SectionLegale = {
  id: "signalements-sociaux",
  titre: "Signaler et modérer dans la partie sociale",
  blocs: [
    "Avec un compte, tu peux signaler à notre équipe un message, un commentaire, une liste, un profil, un groupe ou une sortie entre potes, et, chez les Miamis, une sortie des Miamis, une idée ou un commentaire d'idée, depuis leur menu dans l'app (sans réseau, ton signalement attend sur ton téléphone, puis part dès que possible). Contrairement aux signalements de publications du fil (anonymes, voir « L'app SOS Miam : ton compte »), ceux-ci sont **liés à ton compte** : c'est ce qui nous permet de te dire ce qu'on a décidé, et de ne compter qu'un signalement par personne. Les règles de la modération sont dans les [conditions d'utilisation](/cgu#moderation).",
    {
      liste: [
        "**Ce qu'on garde** : qui signale, qui est l'auteur du contenu, la raison, la précision et ton explication, et une **copie du contenu tel qu'il était** au moment du signalement, **chiffrée** (pour un message : son texte ou le lieu envoyé, le type et la durée d'une photo ou d'une note vocale, le titre et l'emoji du groupe, le pseudo et le prénom de l'auteur ; pour un commentaire : son texte et ses mentions ; pour une liste : son titre, sa description et ses lieux ; pour un profil : le pseudo, le prénom et l'avatar ; pour un groupe ou une sortie entre potes : le titre, l'emoji et les lieux proposés ; pour une sortie des Miamis : son titre, sa description, sa date, son lieu, ses étiquettes libres, le pseudo et le prénom de l'organisateur ; pour une idée : son titre, son détail, son étape, le pseudo et le prénom de son auteur ; pour un commentaire d'idée : son texte, le pseudo et le prénom de son auteur). Cette copie sert de preuve : effacer ou modifier le contenu ne la fait pas disparaître.",
        "**La photo ou la note vocale d'un message signalé** : elle disparaît quand même de la conversation 90 jours après l'envoi, mais son fichier chiffré reste sur notre serveur tant que le signalement attend une décision, puis **6 mois** après la décision (ou après le réexamen, s'il y en a un), même si le signalement est retenu : c'est le délai pour contester, et un réexamen se fait avec la preuve. Seule l'équipe de modération peut l'ouvrir, et seulement pour juger ou réexaminer ce signalement. Ensuite, le ménage de nuit l'efface.",
        "**La photo de profil d'un profil signalé** : tant qu'elle est affichée, l'équipe la regarde sur le profil. Si elle est remplacée ou retirée (par la personne, par l'équipe ou avec son compte) alors qu'un signalement fait pendant qu'elle était affichée attend une décision, ou a été jugé il y a moins de 6 mois, une copie **chiffrée** est gardée avec ce signalement, aux mêmes conditions que la photo d'un message signalé, puis effacée par le ménage de nuit.",
        "**Qui la voit** : seulement l'équipe de modération, dans notre logiciel de gestion. **L'auteur du contenu ne sait jamais qui l'a signalé**, et la personne qui signale ne voit que la décision.",
        "**Le masquage par le gérant d'un lieu** : quand un gérant masque un commentaire sous sa publication, c'est un signalement comme un autre, au nom du gérant, avec une copie chiffrée du commentaire ; son auteur est prévenu dans l'app.",
        "**La décision** : la règle en cause et l'explication écrite par l'équipe, la date, et ta contestation si tu en fais une (de 10 à 1 000 caractères, possible une fois, pendant 6 mois). L'auteur reçoit la règle et l'explication, jamais le nom de qui a signalé, ni son explication. Chacun retrouve les décisions qui le concernent dans l'écran « Décisions de la modération » de l'app (Réglages › Tes données), et peut les y contester.",
        "**Pourquoi et sur quelle base** : traiter les signalements, motiver nos décisions et te laisser les contester, comme nous y oblige le règlement européen sur les services numériques (obligation légale, article 6.1.c du RGPD) ; garder la preuve et repérer les signalements abusifs, ce qui protège tout le monde (intérêt légitime, article 6.1.f du RGPD).",
        "**Combien de temps** : jusqu'à la décision, puis **1 an** après elle (ou après le réexamen), le temps d'une contestation ou de repérer des abus ; ils sont ensuite effacés automatiquement, copie chiffrée comprise (le fichier d'une photo ou d'une note vocale, lui, part plus tôt : voir plus haut). Un contenu retiré par la modération est vidé ou effacé lui aussi **1 an** après la décision, sauf si une contestation attend encore son réexamen : un message ne garde que la mention « retiré », un commentaire qui a des réponses devient « Commentaire supprimé », et une liste est effacée. Une idée ou un commentaire d'idée retiré est effacé 1 an après la décision ; une sortie des Miamis retirée est annulée tout de suite pour tout le monde, sa discussion effacée, puis elle part 1 an après sa date (voir [Les sorties des Miamis](#sorties-miamis)). Si tu supprimes ton compte, tes signalements restent, sans plus aucun lien avec toi.",
      ],
    },
    "**Si ton compte est limité** (ce que ça veut dire : voir les [conditions d'utilisation](/cgu#moderation)) :",
    {
      liste: [
        "**Ce qu'on garde** : le motif (la règle en cause), l'explication écrite pour toi par l'équipe, les dates (début, fin prévue ou « jusqu'à nouvel ordre », levée, réexamen) et ta contestation si tu en fais une (de 10 à 1 000 caractères, une seule fois, pendant la limitation). Le nom de la personne de l'équipe qui a décidé n'est pas gardé avec.",
        "**Qui la voit** : toi, dans « Mon compte », dans l'app (« Décisions de la modération ») et dans « Télécharger mes données sociales » (sans aucun nom de l'équipe), et l'équipe de modération, dans notre logiciel de gestion. Les autres utilisateurs n'en sont pas informés.",
        "**Pourquoi et sur quelle base** : te dire pourquoi ton compte est limité, te laisser contester et faire réexaminer la décision par une autre personne, comme nous y oblige le règlement européen sur les services numériques (obligation légale, article 6.1.c du RGPD) ; faire respecter les règles et protéger les autres utilisateurs (intérêt légitime, article 6.1.f du RGPD).",
        "**Combien de temps** : pendant la limitation, puis **1 an** après sa fin ou sa levée, le temps de répondre à une réclamation ou de repérer une récidive ; elle est ensuite effacée automatiquement. Si tu supprimes ton compte, elle est effacée avec lui.",
      ],
    },
  ],
};
