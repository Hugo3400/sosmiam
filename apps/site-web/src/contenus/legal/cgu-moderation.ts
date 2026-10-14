// Conditions d'utilisation, section « Signalements et modération » (id « moderation », publié : ne jamais le renommer),
// reprise par cgu.ts. Règlement européen sur les services numériques (DSA, art. 16, 17 et 20) : signalement ouvert à tous,
// décision motivée, contestation. Apple (règle 1.2) : signaler, bloquer, et des règles claires.
// Relu contre le code le 14 octobre 2026 (session Site, lecture seule) :
// - packages/commun/src/regles/signalement.ts (raisons ; masquage immédiat d'un commentaire, d'un message ou d'une liste
//   « choquant » sous 3 conditions ; 183 jours pour contester) ;
// - apps/api/src/services/signalements-sociaux*.ts, routes/signalements-sociaux.ts (20 signalements par 24 h, un par
//   personne et par contenu), commentaires.ts (masquage par le gérant), routes/moderation-app.ts (mes-decisions, contester).
// PAS ENCORE CONSTRUIT au 14 octobre 2026, donc écrit au futur (« bientôt ») :
// - gestion/moderation.ts deciderSignalement n'applique la décision qu'à une PUBLICATION : pour un commentaire, un message
//   ou une liste, « retenu » ne retire rien et « rejeté » ne remet rien en ligne ; le logiciel ne déchiffre pas encore
//   l'instantané (dechiffrerInstantane jamais appelée) ;
// - cloche « contenu-retire » et « signalement-decide » jamais écrites ; pas d'écran « décisions » dans l'app (la route
//   GET /app/moderation/mes-decisions et la contestation existent dans l'API) ;
// - aucune suspension de compte ni interdiction d'écrire dans le code (seulement la suppression d'un compte et
//   « déconnecter partout » dans le logiciel) : les CGU gardent le droit de le faire, sans dire que c'est automatique.
import { site } from "~/contenus/legal/informations-legales";
import type { SectionLegale } from "~/contenus/legal/type-legal";

const lienContact = `[${site.emailContact}](mailto:${site.emailContact})`;

export const sectionModerationCgu: SectionLegale = {
  id: "moderation",
  titre: "Signalements et modération",
  blocs: [
    `**Tout le monde peut signaler un contenu** : dans l'app, avec le menu « ⋯ » d'une publication, puis « Signaler » ; avec un compte, aussi un commentaire, un message, une liste, un profil, un groupe ou une sortie (20 signalements par jour au plus, un seul par contenu). Sans l'app, écris-nous à ${lienContact}, avec le lien ou la description du contenu et ce qui ne va pas.`,
    "Ce qui se passe ensuite :",
    {
      liste: [
        "une **publication** signalée pour **violence ou contenu sexuel** est **masquée pour tout le monde dès le premier signalement**, en attendant la décision ;",
        "un **commentaire**, un **message** ou une **liste** signalés pour violence ou contenu sexuel sont aussi masqués pour tout le monde dès le premier signalement, à trois conditions : la personne qui signale a confirmé son e-mail, elle a un compte depuis au moins **7 jours**, et ce contenu n'a jamais eu de signalement rejeté. Sinon, ils restent visibles jusqu'à la décision ;",
        "pour les autres raisons, une publication, un commentaire, un message ou une liste sont masqués **pour la personne qui signale**, en attendant qu'on les regarde ; un profil, un groupe ou une sortie restent visibles jusqu'à la décision ;",
        "si ton contenu est masqué pour tout le monde, **on te prévient** dans l'app, sans te dire qui l'a signalé ;",
        "un membre de l'équipe examine chaque signalement **à la main**, dans notre logiciel de gestion : aucun algorithme ne décide à notre place. Pour un message, il ne lit que la copie du message signalé, jamais le reste de la conversation ;",
        "si le signalement est retenu, le contenu est retiré pour de bon, avec la règle en cause et une explication ; sinon, il est remis en ligne, et un nouveau signalement ne peut plus le masquer d'office. Pour les publications, c'est déjà le cas ; pour les commentaires, les messages et les listes, l'outil qui applique la décision arrive **bientôt** dans notre logiciel (d'ici là, un contenu masqué le reste).",
      ],
    },
    "**Le gérant d'un lieu** peut aussi masquer un commentaire sous sa propre publication : le commentaire ne se voit plus que de son auteur, qui est prévenu dans l'app, et il part en modération comme s'il était signalé (voir « Les commentaires et les listes »).",
    `**Pas d'accord avec une décision ?** Que tu sois l'auteur du contenu ou la personne qui l'a signalé, réponds-nous ou écris à ${lienContact} : une autre personne de l'équipe réexamine la décision, à la main. **Bientôt**, un écran de l'app te montrera les décisions qui te concernent, avec leur explication, et te laissera les contester directement, **une fois par décision, pendant 6 mois**. Tu gardes aussi, toujours, la possibilité de saisir la justice.`,
    "**Selon la gravité**, et surtout si les règles ne sont pas respectées à plusieurs reprises, on peut aussi supprimer ton compte, ou limiter ou suspendre son utilisation ; on te dit toujours pourquoi. **Signaler exprès** des contenus qui respectent les règles (pour nuire à quelqu'un, ou à un concurrent) est aussi un manquement.",
    "Pour un contenu grave, préviens aussi les autorités : le **17** ou le **112** en cas d'urgence, et [Pharos](https://www.internet-signalement.gouv.fr) pour signaler un contenu illégal. De notre côté, on retire rapidement un contenu illégal qui nous est signalé, et on le transmet aux autorités quand la loi le demande.",
  ],
};
