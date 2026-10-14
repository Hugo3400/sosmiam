// Politique de confidentialité, sections Miam Safe (se sentir en sécurité dans un lieu ; docs/decisions.md, « Miam Safe »),
// reprises par confidentialite.ts dans le chapitre « Miam Safe » : « miam-safe » (la charte, l'alerte au comptoir, raconter,
// « Tu t'es senti·e bien ici ? ») et « prevenir-un-pote » (au présent depuis le 15 octobre 2026).
// La charte se signe sur pro.sosmiam.fr (routes/pro/miam-safe.tsx, apps/api/prisma/schema/miam-safe.prisma, CharteMiamSafe).
// « Prévenir un pote », relu contre le code le 14 octobre 2026 (session Site, lecture seule) : apps/api/prisma/schema/
// miam-safe.prisma (PartagePositionMiamSafe : position chiffrée, sous-clé « miam-safe:position »), apps/api/src/services/
// partages-miam-safe*.ts (1 heure ; position effacée à l'arrêt, ou à la première lecture après la fin de l'heure ; bande
// relue à chaque lecture), services/gestion/miam-safe.ts effacerMiamSafeAncien (partages finis effacés la nuit), et l'app
// (apps/app-mobile/src/composants/miam-safe). Texte de la notification : consignes de la session Miam Safe (14 octobre 2026).
// Alertes au comptoir, « Raconter » et « Tu t'es senti·e bien ici ? » : voir le commentaire de sectionMiamSafe.
import type { SectionLegale } from "~/contenus/legal/type-legal";

export const sectionMiamSafe: SectionLegale = {
  id: "miam-safe",
  titre: "Miam Safe, quand tu ne te sens pas en sécurité dans un lieu",
  blocs: [
    "Miam Safe arrive petit à petit. **Aujourd'hui, la charte des lieux** (elle se signe dans l'espace pro) **et « Prévenir un pote »** (voir la section suivante) fonctionnent ; le reste ne fonctionne pas encore, et cette partie sera relue avant son lancement. Les numéros d'urgence (17, 18, 15, 112 et le 114 par SMS) s'appellent directement depuis ton téléphone : on ne voit pas ces appels.",
    {
      liste: [
        "**L'alerte silencieuse au comptoir** (lieux qui ont signé la charte Miam Safe) : l'équipe du lieu recevra, sur ses téléphones, **ton prénom, l'endroit où tu es** (salle, terrasse, toilettes, ailleurs) **et le petit détail que tu choisis d'écrire** (« table 12, pull vert »). Jamais ton nom, ta photo ni ton e-mail. On gardera l'alerte (ces informations, l'heure, et qui a répondu « On arrive ») **30 jours**, pour vérifier qu'une alerte restée sans réponse a bien été suivie, puis elle sera effacée.",
        "**Raconter ce qui s'est passé** : la raison choisie et ton texte seront lus par notre équipe, à la main, **sous 48 heures**. Ils ne seront **jamais affichés sur la fiche du lieu**, et **ton identité ne sera jamais donnée au lieu**. On gardera ton compte avec le signalement pour pouvoir te dire ce qu'on a décidé, puis le tout **1 an** après la décision. N'écris que ce qui est utile : pas besoin de détails sur ta santé, tes origines ou ta vie privée.",
        "**« Tu t'es senti·e bien ici ? »** : ta réponse sera gardée tant que tu as ton compte (la dernière compte). Seul un total s'affichera sur la fiche (« Les Miamis s'y sentent bien », à partir de 90 % de oui sur au moins 20 réponses) ; un « non » ne s'affichera jamais, et personne ne verra qui a répondu quoi.",
        "**La charte d'un lieu**, déjà en place (voir « Ton espace pro ») : on garde qui l'a signée (le gérant) et quand, la date d'un retrait et, si c'est notre équipe qui la retire après un signalement, pourquoi (une note privée). C'est gardé tant que le lieu est sur SOS Miam.",
        "**Base légale** : l'exécution des conditions d'utilisation de l'app (article 6.1.b du RGPD) pour l'alerte et ta réponse, et celles de l'espace pro pour la charte ; notre intérêt légitime (article 6.1.f du RGPD) à traiter les signalements, qui protège tout le monde.",
        "**Supprimer ton compte** effacera tes alertes et tes réponses. Tes signalements resteront, sans lien avec toi, jusqu'à la fin de leur durée de garde.",
      ],
    },
  ],
};

export const sectionPrevenirUnPote: SectionLegale = {
  id: "prevenir-un-pote",
  titre: "« Prévenir un pote »",
  blocs: [
    "Quand tu ne te sens pas en sécurité dans un lieu, Miam Safe te donne un coup de main pour **prévenir un pote** de ta bande. Ce n'est pas un service de secours, et ça ne remplace jamais le **17** ou le **112** : si tu es en danger, appelle-les d'abord.",
    {
      liste: [
        "**C'est toi qui le déclenches, et toi seul** : depuis Miam Safe, sur la fiche d'un lieu ou l'écran d'une visite, tu choisis **un** pote de ta bande. Rien ne part sans ce geste.",
        "**Ce que reçoit ton pote** : une notification urgente sur son téléphone, avec ton prénom et le nom du lieu seulement : « 🛡 Léa a besoin de toi » / « Léa ne se sent pas en sécurité à « [lieu] ». Sa position est partagée avec toi pendant 1 h. » Si ton pote n'a aucun téléphone connecté à son compte, l'app te le dit (il n'a rien reçu) : elle ne te fait jamais croire qu'il est prévenu.",
        "**Ta position, seulement si tu le veux** : elle n'est envoyée que si l'interrupteur « Partager ma position pendant 1 h » est allumé (il l'est au départ, tu peux le couper) et si tu as donné l'accès à ta position « pendant l'utilisation de l'app ». Elle est mise à jour seulement quand l'écran du partage est ouvert, **jamais en arrière-plan**. Tu peux arrêter le partage à tout moment.",
        "**Ce qu'on garde** : qui partage, avec quel pote, depuis quel lieu, l'heure du début, la fin prévue (1 heure après) et l'heure où tu as arrêté, et ta **dernière position** (latitude, longitude, précision et heure), **chiffrée** dans notre base (AES-256-GCM, avec une clé tirée de la clé des données, gardée hors de la base).",
        "**Qui la voit** : seulement le pote que tu as choisi, et tant que vous êtes potes : s'il sort de ta bande ou si l'un de vous bloque l'autre, il ne voit plus rien. **Ni le lieu, ni l'équipe de SOS Miam** ne la voient : elle n'apparaît ni dans notre logiciel de gestion, ni dans nos journaux.",
        "**Combien de temps** : ta position est effacée dès que tu arrêtes le partage ; au bout d'1 heure, elle ne se voit plus, et elle est effacée au plus tard à la lecture suivante. Le reste (qui, avec qui, quel lieu, les heures) est effacé la nuit qui suit la fin du partage.",
        "**Pourquoi et sur quelle base** : t'aider à prévenir quelqu'un de confiance, à ta demande ; c'est l'exécution des [conditions d'utilisation](/cgu) de l'app (article 6.1.b du RGPD). Si tu supprimes ton compte, tes partages sont effacés avec lui.",
      ],
    },
  ],
};
