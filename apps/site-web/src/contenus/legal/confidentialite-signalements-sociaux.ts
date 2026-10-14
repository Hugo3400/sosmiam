// Politique de confidentialité, section « Signaler et modérer dans la partie sociale » (id « signalements-sociaux »),
// reprise par confidentialite.ts dans le chapitre « Ta bande et tes messages ».
// Relu contre le code le 14 octobre 2026 (session Site, lecture seule) : apps/api/prisma/schema/lieux.prisma (Signalement :
// signalePar, auteurContenu, instantaneChiffre, fichierMedia, motif, motivation, contestation), apps/api/src/services/
// instantanes-signalements.ts (contenu de l'instantané), signalements-sociaux*.ts, commentaires.ts (masquage par le gérant),
// packages/commun/src/regles/signalement.ts (7 jours, 183 jours, 365 jours).
// PAS ENCORE CONSTRUIT au 14 octobre 2026 : l'envoi des signalements sociaux depuis l'app (lot A7 : ils restent sur le
// téléphone) et l'écran « décisions » de l'app. Fait le 14 au soir (session Logiciel, F.2) : effacement à 1 an après la
// décision, publications comprises, et instantané déchiffré dans le logiciel (écran en place depuis la version 1.0.2).
import type { SectionLegale } from "~/contenus/legal/type-legal";

export const sectionSignalementsSociaux: SectionLegale = {
  id: "signalements-sociaux",
  titre: "Signaler et modérer dans la partie sociale",
  blocs: [
    "Bientôt, tu pourras signaler un message, un commentaire, une liste, un profil, un groupe ou une sortie jusqu'à notre équipe : pour l'instant, le bouton « Signaler » de ces contenus garde ton signalement **sur ton téléphone**, sans rien nous envoyer. Voici comment ça se passera dès qu'il partira chez nous. Contrairement aux signalements de publications du fil (anonymes, voir « L'app SOS Miam : ton compte »), ceux-ci sont **liés à ton compte** : c'est ce qui nous permet de te dire ce qu'on a décidé, et de ne compter qu'un signalement par personne. Les règles de la modération sont dans les [conditions d'utilisation](/cgu#moderation).",
    {
      liste: [
        "**Ce qu'on garde** : qui signale, qui est l'auteur du contenu, la raison, la précision et ton explication, et une **copie du contenu tel qu'il était** au moment du signalement, **chiffrée** (pour un message : son texte ou le lieu envoyé, le type et la durée d'une photo ou d'une note vocale, le titre et l'emoji du groupe, le pseudo et le prénom de l'auteur ; pour un commentaire : son texte et ses mentions ; pour une liste : son titre, sa description et ses lieux ; pour un profil : le pseudo, le prénom et l'avatar ; pour un groupe ou une sortie : le titre, l'emoji et les lieux proposés). Pour une photo ou une note vocale signalée, son fichier chiffré est gardé tant que le signalement n'est pas tranché, même si le message disparaît. Cette copie sert de preuve : effacer ou modifier le contenu ne la fait pas disparaître.",
        "**Qui la voit** : seulement l'équipe de modération, dans notre logiciel de gestion. **L'auteur du contenu ne sait jamais qui l'a signalé**, et la personne qui signale ne voit que la décision.",
        "**Le masquage par le gérant d'un lieu** : quand un gérant masque un commentaire sous sa publication, c'est un signalement comme un autre, au nom du gérant, avec une copie chiffrée du commentaire ; son auteur est prévenu dans l'app.",
        "**La décision** : la règle en cause et l'explication écrite par l'équipe, la date, et ta contestation si tu en fais une (de 10 à 1 000 caractères, possible une fois, pendant 6 mois). L'auteur reçoit la règle et l'explication, jamais le nom de qui a signalé, ni son explication.",
        "**Pourquoi et sur quelle base** : traiter les signalements, motiver nos décisions et te laisser les contester, comme nous y oblige le règlement européen sur les services numériques (obligation légale, article 6.1.c du RGPD) ; garder la preuve et repérer les signalements abusifs, ce qui protège tout le monde (intérêt légitime, article 6.1.f du RGPD).",
        "**Combien de temps** : jusqu'à la décision, puis **1 an** après elle, le temps d'une contestation ou de repérer des abus ; ils sont ensuite effacés automatiquement, copie chiffrée et fichier compris. Si tu supprimes ton compte, tes signalements restent, sans plus aucun lien avec toi.",
      ],
    },
  ],
};
