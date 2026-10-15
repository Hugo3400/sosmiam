// Conditions d'utilisation, partie sociale de l'app, reprise par cgu.ts : ta bande et tes abonnés, la messagerie (groupes et
// sorties compris), les commentaires et les listes, ton pseudo, bloquer. Ouverte avec les comptes de l'app (v1).
// Les ancres (« potes », « messagerie », « commentaires », « pseudos », « bloquer ») sont publiques : ne jamais les renommer.
// Relu contre le code le 14 octobre 2026 (session Site) : packages/commun/src/regles (chat.ts, potes.ts, listes.ts,
// suivis.ts, signalement.ts, mots-interdits.ts), apps/api/prisma/schema (social, messagerie, sorties, listes, commentaires,
// pseudos-reserves) ; décisions : docs/decisions.md, « Potes, messagerie et profils sur le serveur » et « Partie sociale :
// réponses de Hugo après l'assemblage » (14 octobre 2026).
// Le 15 octobre 2026 : interrupteurs des réglages sociaux dans l'app (Réglages › Confidentialité, bloc « Ta bande »,
// apps/app-mobile/src/composants/reglages/BlocTaBande.tsx) et ménage de nuit en ligne (médias effacés après 90 jours,
// conversations après 1 an sans message : apps/api/src/services/menage-social*.ts), passés au présent.
import type { SectionLegale } from "~/contenus/legal/type-legal";

export const sectionPotesCgu: SectionLegale = {
  id: "potes",
  titre: "Ta bande, tes abonnés et ton profil",
  blocs: [
    "Dans l'app, l'onglet Potes te sert à sortir avec tes vrais potes : ta **bande**, la messagerie, les sorties et les listes. Il te faut pour ça un **pseudo** (voir « Ton pseudo », plus bas).",
    {
      liste: [
        "**Ta bande** (200 potes au plus) : tes potes y entrent par ton **lien ou ton QR code d'invitation** (vous êtes alors ajoutés tout de suite, chacun dans la bande de l'autre), ou par une **demande** envoyée depuis ton pseudo, que tu acceptes ou non. Refuser une demande ne prévient personne, et retirer quelqu'un de ta bande vaut des deux côtés, sans le prévenir.",
        "**Ton lien d'invitation** fait entrer dans ta bande toute personne qui l'a : donne-le seulement aux gens que tu connais. S'il a circulé plus loin que prévu, « Changer mon lien » le remplace ; il change aussi tout seul après 10 arrivées qui se suivent de près (moins de 24 heures entre deux).",
        "**« Qu'on me trouve par mon pseudo »** (dans l'app, Réglages › Confidentialité) : si tu le coupes, personne ne te trouve dans la recherche, et une demande vers toi est refusée avec ce message : « Cette personne ne reçoit pas de demandes ». Ton lien d'invitation, lui, marche toujours.",
        "**Suivre quelqu'un** est à sens unique : tu vois passer ses listes et ses lieux. Ton compte est **public** par défaut ; en **privé**, chaque abonnement est une demande que tu acceptes ou non. Suivre quelqu'un n'ouvre **jamais** la messagerie : on ne s'écrit qu'entre potes de la même bande.",
        "**Ce que les autres voient de ton profil** dépend de ce lien (inconnu, abonné ou pote de ta bande) et de tes réglages : tout est détaillé dans la [politique de confidentialité](/confidentialite#potes).",
      ],
    },
  ],
};

export const sectionMessagerieCgu: SectionLegale = {
  id: "messagerie",
  titre: "La messagerie, les groupes et les sorties",
  blocs: [
    "La messagerie de l'app sert à s'organiser entre potes. On peut s'y écrire **à deux**, entre potes de la même bande, **en groupe** (20 personnes au plus) ou dans la discussion d'une **sortie**. On y envoie du texte (500 caractères par message), des réactions, des lieux, des photos et des notes vocales (1 minute au plus).",
    {
      liste: [
        "**Les groupes** : seul un pote de ta bande peut t'inviter dans un groupe, et tu n'y entres qu'en **acceptant** l'invitation (refuser ne prévient personne). En arrivant, tu ne vois pas les messages écrits avant toi. Tu peux le quitter quand tu veux ; tu ne peux alors pas y être réinvité pendant 30 jours.",
        "**Les sorties** : l'organisateur invite des potes de sa bande (15 personnes au plus). Chacun répond à « Tu viens ? » avant d'entrer dans le vote et la discussion, qu'il lit alors depuis le début ; on vote pour un ou plusieurs lieux proposés (8 au plus), et à la fin du vote, le lieu qui a le plus de voix est retenu (à égalité, le premier proposé). Une sortie ne réserve rien dans le lieu : c'est une proposition entre potes.",
        "**Tes messages** : tu peux supprimer un de tes messages pour tout le monde (« Message supprimé » s'affiche), effacer une discussion pour toi seul, ou couper ses notifications. Il n'y a pas d'accusé de lecture : personne ne sait quand tu as lu.",
        "**Les photos et les notes vocales** ne s'ouvrent que pendant **90 jours** : ensuite, « Ce média a expiré », et elles sont effacées de notre serveur (sauf celles d'un message signalé, gardées un temps pour la modération). Une conversation sans message depuis **1 an** est effacée, elle aussi. Garde de ton côté ce que tu tiens à garder.",
      ],
    },
    "Les [règles de la communauté](#regles-communaute) valent aussi dans les messages privés et les groupes. En particulier, il est interdit :",
    {
      liste: [
        "de **harceler** quelqu'un : insister après un refus, un départ d'un groupe ou un blocage, revenir par un autre groupe ou un autre compte ;",
        "d'envoyer des photos, des notes vocales ou des liens **sexuels ou violents**, même entre adultes, même pour rire ;",
        "de faire circuler ce qu'un pote t'a confié (messages, photos, notes vocales, captures d'écran) **pour lui nuire**, ou sans son accord quand c'est privé ;",
        "de publier les **infos personnelles** de quelqu'un (adresse, numéro, position) sans son accord ;",
        "d'envoyer du **spam**, des chaînes, de la **pub**, des **arnaques** ou des liens douteux, ou de te servir de la messagerie pour vendre quelque chose.",
      ],
    },
    "Si quelque chose ne va pas, tu peux **signaler** un message, un groupe ou une sortie, **quitter** la discussion ou **bloquer** la personne (voir « Bloquer quelqu'un » et « Signalements et modération »).",
  ],
};

export const sectionCommentairesCgu: SectionLegale = {
  id: "commentaires",
  titre: "Les commentaires et les listes",
  blocs: [
    {
      liste: [
        "**Les commentaires** sous les publications du fil sont **publics** : tout le monde peut les lire, même sans compte. Pour en écrire, il faut un pseudo ; ils font 500 caractères au plus (20 par heure). Tu peux répondre à un commentaire, l'aimer, citer quelqu'un avec « @ » (10 personnes au plus), modifier les tiens (« modifié » s'affiche) ou les supprimer (s'ils ont déjà des réponses, « Commentaire supprimé » reste à leur place).",
        "**Le filtre de mots** refuse les insultes et la haine les plus courantes dans les commentaires, les messages, les titres des groupes, des sorties et des listes, les pseudos et les prénoms. C'est une première barrière, pas un juge : ce qui passe le filtre doit quand même respecter les règles.",
        "**La réponse du lieu** est mise en avant sous sa publication : elle est écrite au nom du lieu, sans montrer qui, dans son équipe, l'a écrite.",
        "**Le gérant d'un lieu peut masquer un commentaire sous sa propre publication** (sauf la réponse du lieu) : le commentaire ne se voit plus que de son auteur, qui est prévenu dans l'app, et il part en modération. Si notre équipe ne trouve rien à redire, le lieu ne peut plus jamais le masquer, et le commentaire revient en ligne. Masquer une critique honnête n'est pas le but : c'est fait pour les commentaires qui ne respectent pas les règles.",
        "**Les listes de lieux** : tu en crées 50 au plus (100 lieux chacune), tu choisis qui les voit (tout le monde, ou ta bande) et tu peux inviter jusqu'à 10 potes de ta bande à les remplir avec toi. Un co-auteur ne retire que les lieux qu'il a ajoutés.",
      ],
    },
  ],
};

export const sectionPseudosCgu: SectionLegale = {
  id: "pseudos",
  titre: "Ton pseudo",
  blocs: [
    "Ton pseudo (« @lea.mange ») fait de 3 à 20 caractères : des lettres minuscules sans accents, des chiffres, des points et des tirets bas, sans commencer ni finir par un point ou un tiret bas, ni en mettre deux d'affilée. Il est unique et se voit partout où tu participes.",
    {
      liste: [
        "**Pas de pseudo trompeur ou blessant** : ne te fais pas passer pour quelqu'un d'autre, pour un lieu que tu ne représentes pas, pour une marque ou pour l'équipe SOS Miam, et pas d'insulte (le filtre de mots veille aussi).",
        "**Changer de pseudo** : ton ancien pseudo est **réservé pendant 30 jours**. Personne d'autre ne peut le prendre (pour que personne ne se fasse passer pour toi), mais toi, tu peux le reprendre. Pendant ces 30 jours, ton ancien lien d'invitation, qui portait ton ancien pseudo, affiche « **Ce lien a changé** » à qui l'ouvre, pour qu'il te demande ton nouveau lien ; ensuite, c'est le message d'un lien qui n'est pas valable.",
        "**Supprimer ton compte** : ton pseudo est réservé 30 jours, et personne ne peut le prendre pendant ce temps.",
        "**Les mentions suivent la personne, pas le pseudo** : quelqu'un qui reprend plus tard un pseudo libéré n'hérite jamais des anciennes mentions « @ ».",
      ],
    },
  ],
};

export const sectionBloquerCgu: SectionLegale = {
  id: "bloquer",
  titre: "Bloquer quelqu'un",
  blocs: [
    "Bloquer quelqu'un coupe le lien **dans les deux sens** : vous sortez de vos bandes, et vos demandes, vos abonnements, vos invitations en attente, vos co-écritures de listes et vos notifications entre vous sont effacés. Il quitte les sorties que tu organises. Vous ne vous trouvez plus par vos pseudos, l'app ne vous propose plus l'un à l'autre, et ses messages, ses listes et son activité te sont cachés, comme les tiens à lui. Il n'en est pas prévenu.",
    "Deux limites, pour être clair : tes commentaires sont publics, donc lisibles par tout le monde, lui compris (l'app te cache les siens, et vous ne pouvez plus vous répondre, vous aimer ni vous citer) ; et dans une sortie organisée par quelqu'un d'autre, vous restez tous les deux participants. Si quelqu'un t'importune, tu peux aussi le signaler.",
    "Tu retrouves les personnes bloquées dans les réglages de l'app (« Personnes bloquées »), 1 000 au plus. Débloquer ne rétablit rien : il faudra vous ajouter à nouveau.",
  ],
};
