import type { SectionLegale } from "~/contenus/legal/type-legal";

export const sectionCommunaute: SectionLegale = {
  id: "communaute",
  titre: "Les Miamis : ton genre, « Qui est là ? » et le fil",
  blocs: [
    "Dans l'onglet Communauté de l'app, la partie « Les Miamis » te fait croiser d'autres Miamis : des sorties ouvertes à des gens que tu ne connais pas encore (voir [Les sorties des Miamis](#sorties-miamis)), « Qui est là ? » et le fil « Ça bouge chez les Miamis ». La [boîte à idées](#boite-a-idees) (Profil › ⚙️ Paramètres › La vie de SOS Miam) suit les mêmes règles. Comme toute la partie sociale, il faut un compte (dès 18 ans) et, pour participer, un pseudo. Rien de tout ça ne se voit sans compte, ni sur le site. Ici, « la Brigade », c'est l'équipe de SOS Miam.",
    "**Ton genre**, si tu choisis de le donner :",
    {
      liste: [
        "**Ce qu'on garde** : ton choix dans « Mon genre » (Profil › Modifier mon profil) : « Femme », « Homme », « Autres » ou « Je préfère ne pas le dire ». Il est **chiffré** (AES-256-GCM, avec une clé réservée au genre, tirée de la clé des données gardée hors de la base). On garde aussi, en clair, la date de ton dernier choix « Femme », « Homme » ou « Autres », pour la règle d'un seul changement par mois (« Je préfère ne pas le dire » et l'effacement restent possibles à tout moment). On ne te demande **jamais ton orientation** : « LGBT+ friendly » est une étiquette de sortie, pas une case de ton profil.",
        "**Pourquoi** : une seule raison : te montrer les sorties réservées à ton genre (« Entre filles », « Entre garçons », « Autres genres ») et te laisser en organiser. Il ne sert ni à trier ton fil, ni à des statistiques, ni à de la pub.",
        "**Sur quelle base** : ton **consentement** (article 6.1.a du RGPD). Tu le donnes en choisissant ton genre, rien ne t'y oblige (sans lui, tu vois toutes les sorties ouvertes à tous), et tu le retires quand tu veux en l'effaçant ; ce qui a été fait avant reste valable. Le genre ne fait pas partie des données « sensibles » de l'article 9 du RGPD (comme la santé, la religion ou l'orientation sexuelle), mais il touche à ton identité : c'est pour ça qu'on le chiffre et qu'on ne le montre à personne.",
        "**Qui le voit** : **personne**. Ni les autres Miamis, ni les lieux, et aucun écran de notre logiciel de gestion ne l'affiche : notre serveur le déchiffre seulement pour savoir quelles sorties te montrer. Une limite, pour être honnête : les Miamis qui voient la même sortie réservée que toi, ou qui y vont avec toi, savent que vous faites partie de son public.",
        "**Combien de temps** : jusqu'à ce que tu l'effaces (« Effacer mon genre ») ou que tu supprimes ton compte. La date de ton dernier choix, elle, reste après l'effacement, pour que la règle d'un changement par mois ne se contourne pas ; elle part avec ton compte.",
        "**Ton âge**, pour les sorties réservées à une tranche d'âge (18-25 ans, 25-35 ans, 30 ans et plus, 40 ans et plus) : notre serveur le calcule au moment où il en a besoin, à partir de ta date de naissance, gardée chiffrée (voir [L'app SOS Miam : ton compte](#app-comptes)). Ton âge n'est **jamais enregistré, ni montré** à personne, avec la même limite que pour le genre. Pour les sorties réservées aux nouveaux, c'est la date de création de ton compte qui compte (moins de 30 jours) ; pour celles des ambassadeurs, ton rôle d'ambassadeur validé.",
      ],
    },
    "**« Qui est là ? »** montre les Miamis de ta ville qui ont choisi d'y apparaître :",
    {
      liste: [
        "**Seulement si tu le choisis** : tant que tu ne touches pas « Me montrer ici », tu n'y es pas. Quand tu le fais, notre serveur garde ce choix, la **ville de ton profil** (son nom, **jamais une position**) et l'heure où ta présence s'arrête, **3 heures** plus tard (tu peux la prolonger de 3 heures).",
        "**Ce que les autres voient** : les Miamis de ta ville qui ouvrent « Qui est là ? » voient ton **@pseudo et ton avatar**, et c'est tout ce que l'écran affiche de toi, avec selon le cas « Dans ta bande » ou le titre d'une sortie des Miamis que tu organises et qu'ils peuvent voir. Une personne que tu as bloquée, ou qui t'a bloqué, ne te voit pas, et tu ne la vois pas.",
        "**Les coucous** : pour faire coucou, il faut te montrer toi aussi. On garde qui a fait coucou à qui, et quand ; la personne voit « T'a fait coucou » à côté de ton pseudo. Si c'est réciproque, vous le voyez tous les deux, et l'app vous propose de vous ajouter à vos bandes (par une demande, comme d'habitude).",
        "**Pourquoi et sur quelle base** : te laisser croiser d'autres Miamis de ta ville quand tu en as envie, c'est-à-dire l'exécution des [conditions d'utilisation](/cgu#qui-est-la) (article 6.1.b du RGPD).",
        "**Combien de temps** : tu disparais dès que tu te caches (ta présence et tes coucous, envoyés et reçus, sont alors effacés tout de suite) ou au bout des 3 heures (la ligne est alors effacée par le ménage de la nuit suivante). Un coucou compte **24 heures**, puis il est effacé par le ménage de la nuit ; il disparaît aussi dès que l'un de vous deux se cache.",
      ],
    },
    "**Et autour** :",
    {
      liste: [
        "**« Mes envies »** (Profil › Modifier mon profil › « Mes envies » : les étiquettes qui te font envie, pour mettre en avant les sorties qui te ressemblent) : elles restent **sur ton téléphone** et ne sont **jamais envoyées** à notre serveur. « Me déconnecter » et « Effacer mes données et recommencer » les effacent.",
        "**Le fil « Ça bouge chez les Miamis »** montre aux Miamis connectés ce qui s'est passé ces **7 derniers jours** (30 nouvelles au plus) : une idée publiée, avec son auteur, une réponse de la Brigade, qui a voté pour des idées et pour combien, et, dans leur ville, qui organise ou rejoint une sortie des Miamis, seulement pour ceux qui peuvent voir cette sortie. Il n'est pas gardé à part : notre serveur le refait à chaque fois à partir des sorties et des idées. Les personnes bloquées n'y apparaissent pas.",
        "**La cloche et les notifications** : une demande pour ta sortie, une arrivée acceptée, la liste d'attente, une place libérée, le rappel de la veille, une sortie annulée, l'invitation des habitués, un coucou réciproque, ton idée publiée, la réponse de la Brigade et l'idée du mois arrivent dans la cloche de l'app, avec ses règles (voir [Ta bande, tes abonnés et ton profil](#potes)). Certaines sonnent aussi sur ton téléphone : **Apple** ou **Google** reçoivent alors leur titre et leur texte, c'est-à-dire le prénom de la personne, le titre de la sortie et, pour le rappel, le nom du lieu. « Notifications de ma bande » (Profil › ⚙️ Paramètres › Confidentialité et sécurité › « Confidentialité ») les coupe. Les commentaires d'une idée ne font jamais sonner personne.",
      ],
    },
  ],
};

export const sectionSortiesMiamis: SectionLegale = {
  id: "sorties-miamis",
  titre: "Les sorties des Miamis",
  blocs: [
    "Une sortie des Miamis est ouverte à des Miamis que tu ne connais pas encore, toujours dans un lieu publié sur SOS Miam, avec **6 personnes au plus**, organisateur compris, et l'organisateur accepte chaque arrivée. Les sorties entre potes, elles, sont décrites dans [Ta messagerie](#messagerie).",
    {
      liste: [
        "**Ce qu'on garde de la sortie** (en clair, puisqu'elle est faite pour être vue de son public) : son titre, sa description, le lieu et sa ville, la date et l'heure, son public (ouverte à tous, ou réservée), ses étiquettes (5 au plus, de la liste officielle ou libres), le nombre de places, la place gardée pour un nouveau, si elle revient chaque semaine, et ce qui lui arrive (rappel envoyé, annulation, retrait par la modération).",
        "**Ce qu'on garde de ta place** : où tu en es (tu organises, tu as demandé à venir, tu es accepté, en liste d'attente, invité comme habitué, ta demande n'a pas été retenue, ou tu t'es désisté au dernier moment), la date de ta demande et celle de la réponse, et l'heure où ta présence a été validée.",
        "**Qui voit la sortie** : seulement les Miamis de **son public**. Ouverte à tous, tous les Miamis peuvent la voir (la liste « Sorties des Miamis » montre celles de ta ville) ; réservée (entre filles, entre garçons, autres genres, une tranche d'âge, les nouveaux ou les ambassadeurs), elle est **invisible pour tous les autres**. Si l'organisateur, ou une personne acceptée ou en liste d'attente, et toi vous êtes bloqués, elle n'existe pas pour toi.",
        "**Ce qu'on voit avec elle** : l'organisateur (son @pseudo et son avatar), son bilan « Sorties tenues » et, s'il a laissé « Montrer mon activité à ma bande » allumé, son nombre de rescousses ; les personnes acceptées (@pseudo, avatar et, selon le cas, « nouveau » pour un compte de moins de 30 jours, « habitué », « dans ta bande » et « présent ») ; le nombre de personnes en liste d'attente. L'organisateur voit en plus les demandes (@pseudo, avatar, date, « nouveau » et le bilan « Sorties tenues » de chacun) et sa liste d'attente.",
        "**Un refus ne prévient personne** : la personne voit toujours sa demande comme envoyée. L'organisateur peut aussi retirer quelqu'un, sans le prévenir.",
        "**« Sorties tenues »** : un bilan calculé par notre serveur à partir de tes sorties des Miamis passées (elles sont gardées 1 an). Une sortie compte comme **tenue** si tu y étais accepté, ou si tu l'organisais avec au moins une personne acceptée ; comme **non tenue** si tu t'es désisté moins de 24 heures avant, ou si tu l'as annulée moins de 24 heures avant alors que des Miamis étaient acceptés. Il ne dépend pas de la présence au comptoir. Il aide l'organisateur à choisir, et chacun à savoir avec qui il sort ; c'est l'organisateur qui décide, jamais le bilan tout seul.",
        "**Ta présence** : sur place, le QR du comptoir valide ta visite (voir [L'app SOS Miam : ton compte](#app-comptes)), puis « Je suis là » valide ta présence à la sortie, d'une heure avant à 4 heures après le début. On garde seulement l'heure, et les autres participants voient « présent ». Comme seuls les lieux vérifiés ✓ valident les visites, la présence ne se valide que chez eux.",
        "**La discussion de la sortie** : l'organisateur et les personnes acceptées s'écrivent dans une discussion de la messagerie, avec ses règles (texte chiffré, photos et notes vocales 90 jours, effacée après 1 an sans message : voir [Ta messagerie](#messagerie)). Quand tu quittes la sortie, tu quittes la discussion ; si la sortie est annulée ou retirée par la modération, la discussion est effacée tout de suite.",
        "**Les sorties qui reviennent chaque semaine** : 4 heures après le début, notre serveur crée la sortie de la semaine suivante et y invite les personnes acceptées comme **habitués** : leur place est gardée **48 heures**. Il ne le fait pas si la sortie a été annulée, si le lieu n'est plus publié ou si le compte de l'organisateur est limité.",
        "**Le lieu n'en sait rien** : une sortie des Miamis ne réserve rien, et le lieu ne la voit pas.",
        "**Pourquoi et sur quelle base** : organiser des sorties entre Miamis, gérer les places, les demandes et la liste d'attente, rappeler le rendez-vous la veille et aider chacun à se faire confiance, c'est-à-dire l'exécution des [conditions d'utilisation](/cgu#communaute) (article 6.1.b du RGPD).",
        "**Combien de temps** : chaque nuit, un ménage automatique passe. La sortie, avec les places acceptées, les désistements de dernière minute et ses étiquettes, est effacée **1 an après sa date** ; une sortie annulée ou retirée par la modération aussi (sa discussion, elle, est effacée tout de suite), ce qui garde juste le bilan « Sorties tenues ». Les demandes restées sans réponse ou non retenues, la liste d'attente et les invitations d'habitués sont effacées **la nuit qui suit la date** de la sortie, et une invitation d'habitué ne compte plus au bout de **48 heures**. Une demande que tu annules, la liste d'attente que tu quittes ou une place que tu libères plus de 24 heures avant sont effacées tout de suite.",
        "**Si tu supprimes ton compte** : les sorties des Miamis que tu organises et ta place dans celles des autres sont effacées avec lui ; tes messages dans leur discussion suivent la règle de la messagerie (« Compte supprimé »).",
      ],
    },
  ],
};

export const sectionBoiteAIdees: SectionLegale = {
  id: "boite-a-idees",
  titre: "La boîte à idées",
  blocs: [
    "Dans la boîte à idées (Profil › ⚙️ Paramètres › La vie de SOS Miam), tu proposes des idées pour l'app, tu votes pour celles des autres et tu les commentes. La Brigade les relit, leur donne une étape et y répond, depuis notre logiciel de gestion.",
    {
      liste: [
        "**Ce qu'on garde** (en clair, puisque c'est fait pour être lu) : le titre de ton idée et son détail, une version simplifiée du titre (pour repérer les doublons), sa date, son étape (en relecture, proposée, à l'étude, prévue, faite), la réponse de la Brigade et, le cas échéant, le mois où elle a été l'idée du mois ; qui a voté pour quelle idée, et quand ; les commentaires (texte, commentaire auquel ils répondent, date) et qui les a aimés.",
        "**Qui voit quoi** : tant qu'elle est **en relecture**, ton idée ne se voit que de toi et de la Brigade. Une fois publiée, **tous les Miamis connectés**, où qu'ils habitent, voient son titre, son détail, ton @pseudo et ton avatar, son étape, la réponse de la Brigade, le nombre de votes et le prénom (avec l'avatar) de **3 votants au plus**, leurs potes d'abord ; ils voient aussi les commentaires, avec le @pseudo et l'avatar de leur auteur et le nombre de J'aime (jamais qui a aimé). Un commentaire masqué par la Brigade ne se voit plus que de son auteur. Le fil « Ça bouge chez les Miamis » montre en plus, pendant 7 jours, qui a voté et pour combien d'idées.",
        "**Pourquoi et sur quelle base** : recueillir les idées des Miamis, les faire voter, y répondre et éviter les doublons, c'est-à-dire l'exécution des [conditions d'utilisation](/cgu#boite-a-idees) (article 6.1.b du RGPD).",
        "**Combien de temps** : ton idée reste tant que tu ne la retires pas (elle part alors avec ses votes et ses commentaires) et que la Brigade ne la supprime pas. Un commentaire que tu supprimes est effacé tout de suite (les réponses des autres restent). Une idée ou un commentaire retiré ou masqué par la modération est effacé **1 an** après la décision, par le ménage de nuit (plus tard seulement si ta contestation attend encore son réexamen).",
        "**Si tu supprimes ton compte** : tes idées restent, mais **sans auteur** (« un Miami discret »). Tes votes, tes commentaires et tes J'aime partent avec ton compte ; les réponses des autres à tes commentaires restent.",
      ],
    },
  ],
};
