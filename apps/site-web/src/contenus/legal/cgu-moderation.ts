// Conditions d'utilisation, section « Signalements et modération » (id « moderation », publié : ne jamais le renommer),
// reprise par cgu.ts. Règlement européen sur les services numériques (DSA, art. 16, 17 et 20) : signalement ouvert à tous,
// décision motivée, contestation. Apple (règle 1.2) : signaler, bloquer, et des règles claires.
// Relu contre le code le 14 octobre 2026 : packages/commun/src/regles/signalement.ts (raisons, masquage immédiat sous
// conditions, 6 mois pour contester), apps/api/src/services/signalements-sociaux*.ts, decisions-moderation-app.ts,
// commentaires.ts (masquage par le gérant) ; décisions : docs/decisions.md, « Signalements et modération » et « Potes,
// messagerie et profils sur le serveur ».
import { site } from "~/contenus/legal/informations-legales";
import type { SectionLegale } from "~/contenus/legal/type-legal";

const lienContact = `[${site.emailContact}](mailto:${site.emailContact})`;

export const sectionModerationCgu: SectionLegale = {
  id: "moderation",
  titre: "Signalements et modération",
  blocs: [
    `**Tout le monde peut signaler un contenu** : dans l'app, avec le menu « ⋯ » d'une publication, d'un commentaire, d'un message, d'une liste, d'un profil, d'un groupe ou d'une sortie, puis « Signaler » ; sans l'app, en nous écrivant à ${lienContact}, avec le lien ou la description du contenu et ce qui ne va pas.`,
    "Ce qui se passe ensuite :",
    {
      liste: [
        "une **publication** signalée pour **violence ou contenu sexuel** est **masquée pour tout le monde dès le premier signalement** ;",
        "un **commentaire**, un **message** ou une **liste** signalés pour violence ou contenu sexuel sont aussi masqués pour tout le monde dès le premier signalement, si la personne qui signale a confirmé son e-mail, a un compte depuis au moins 7 jours, et si ce contenu n'a jamais eu de signalement rejeté ; sinon, ils restent visibles jusqu'à la décision. Un profil, un groupe ou une sortie ne sont jamais masqués avant la décision ;",
        "pour les autres raisons, le contenu est masqué **pour la personne qui signale**, en attendant qu'on le regarde ;",
        "un membre de l'équipe examine chaque signalement **à la main**, dans notre logiciel de gestion : aucun algorithme ne décide à notre place. Pour un message, il ne lit que la copie du message signalé, jamais le reste de la conversation ;",
        "si le signalement est retenu, le contenu est retiré pour de bon ; sinon, il est remis en ligne, et un nouveau signalement ne peut plus le masquer d'office.",
      ],
    },
    "**Le gérant d'un lieu** peut aussi masquer un commentaire sous sa propre publication : le commentaire part alors en modération, comme s'il était signalé, et son auteur est prévenu (voir « Les commentaires et les listes »).",
    "**On te tient au courant** : si c'est ton contenu qui est masqué ou retiré, on te prévient et on te dit pourquoi (la règle en cause, expliquée simplement) ; si tu as signalé un contenu, on te dit ce qu'on a décidé. Tu retrouves ces décisions dans l'app.",
    `**Pas d'accord ? Conteste.** Que tu sois l'auteur du contenu ou la personne qui l'a signalé, tu peux contester une décision **une fois, pendant 6 mois**, directement dans l'app : une autre lecture est faite, à la main. Tu peux aussi nous écrire à ${lienContact}, et tu gardes toujours la possibilité de saisir la justice.`,
    "**Selon la gravité** et si les règles ne sont pas respectées à plusieurs reprises, on peut aussi limiter ce que tu peux faire dans l'app, suspendre ton compte ou le supprimer ; on te dit toujours pourquoi. **Signaler exprès** des contenus qui respectent les règles (pour nuire à quelqu'un, ou à un concurrent) est aussi un manquement.",
    "Pour un contenu grave, préviens aussi les autorités : le **17** ou le **112** en cas d'urgence, et [Pharos](https://www.internet-signalement.gouv.fr) pour signaler un contenu illégal. De notre côté, on retire rapidement un contenu illégal qui nous est signalé, et on le transmet aux autorités quand la loi le demande.",
  ],
};
