import type { SectionLegale } from "~/contenus/legal/type-legal";

export const sectionCommunauteCgu: SectionLegale = {
  id: "communaute",
  titre: "Les Miamis et leurs sorties",
  blocs: [
    "Dans l'onglet Communauté de l'app, la partie « Les Miamis » sert à rencontrer d'autres Miamis : des **sorties des Miamis**, ouvertes à des gens que tu ne connais pas encore, et « Qui est là ? ». La boîte à idées (Profil › ⚙️ Paramètres › La vie de SOS Miam) suit les mêmes règles. Comme tout le reste de l'app, c'est **dès 18 ans**, avec un compte et un pseudo, et les [règles de la communauté](#regles-communaute) s'y appliquent.",
    {
      liste: [
        "**Ton genre, honnêtement** : dans « Mon genre » (facultatif), choisis celui qui est le tien : « Femme », « Homme », « Autres » ou « Je préfère ne pas le dire ». Il ouvre les sorties réservées à ce genre, et se change **une fois par mois** (« Je préfère ne pas le dire » et l'effacement, quand tu veux). Te déclarer d'un autre genre pour entrer dans une sortie qui ne t'est pas destinée, c'est tromper les autres : c'est interdit.",
        "**Les publics réservés** : une sortie peut être ouverte à tous, ou réservée entre filles, entre garçons, aux autres genres, à une tranche d'âge (18-25 ans, 25-35 ans, 30 ans et plus, 40 ans et plus), aux nouveaux (un compte de moins de 30 jours) ou aux ambassadeurs validés ; elle est alors invisible pour les autres. Tu ne réserves une sortie qu'à un public dont tu fais partie (sauf « les nouveaux », que tout le monde peut accueillir). Un public réservé sert à **se sentir à l'aise**, jamais à **exclure, viser ou humilier** quelqu'un : pas de titre, de description ou d'étiquette qui rejette une partie des Miamis.",
        "**L'organisateur accepte chaque arrivée** : tu demandes à venir avec « Je viens », et il dit oui ou non. **Un refus est silencieux** : personne n'est prévenu, ta demande reste simplement affichée comme envoyée. L'organisateur peut aussi retirer quelqu'un, sans le prévenir. Ce n'est jamais personnel, et il y aura d'autres sorties.",
        "**6 places au plus**, organisateur compris (2 au moins), dont une que l'organisateur peut garder pour un nouveau. Quand c'est complet, une personne acceptée passe en **liste d'attente**, et entre toute seule dès qu'une place se libère (elle est prévenue).",
        "**Venir, ou se désister à temps** : un rappel part la veille au soir. Tu ne peux plus venir ? « Je ne peux plus venir » libère ta place pour la liste d'attente. Moins de 24 heures avant, ça se voit dans ton bilan « Sorties tenues », que l'organisateur regarde avant d'accepter ; c'est pareil pour un organisateur qui annule moins de 24 heures avant alors que des Miamis ont été acceptés. Un empêchement, ça arrive : prévenir tôt, c'est la base.",
        "**La présence au comptoir** : sur place, le QR du comptoir du lieu valide ta visite, puis « Je suis là » ta présence, d'une heure avant à 4 heures après le début (seulement dans un lieu vérifié ✓, puisque seuls ces lieux valident les visites). Pas de présence à distance, ni pour quelqu'un d'autre.",
        "**Organiser** : un lieu publié sur SOS Miam, une date entre 15 minutes et un an plus tard, un titre (40 caractères), une description (300) et 5 étiquettes au plus ; **5 sorties à venir** au plus par personne. Une sortie ne se modifie pas après sa publication : pour la changer, annule-la et crée-en une autre (les inscrits sont prévenus de l'annulation). Elle peut revenir chaque semaine : les habitués y sont invités en premier, avec leur place gardée 48 heures ; annuler une sortie qui revient arrête aussi les semaines suivantes.",
        "**Jamais de prix ni d'engagement inventé** : une sortie des Miamis ne réserve rien, et **le lieu n'en est pas prévenu**. N'annonce pas un prix, une promo, une table réservée ou un accueil spécial que le lieu n'a pas promis, et ne demande d'argent à personne : chacun règle ce qu'il prend, sur place. Pour être sûr d'avoir une table, le plus simple est de la réserver dans l'app, quand le lieu le propose.",
        "**La discussion de la sortie** s'ouvre à l'organisateur et aux personnes acceptées, avec les règles de la [messagerie](#messagerie). Quand tu quittes la sortie, tu quittes aussi la discussion.",
        "**Des rencontres, en confiance** : tu vas voir des gens que tu ne connais pas encore. Le rendez-vous est toujours dans un lieu publié sur SOS Miam : retrouvez-vous sur place, et garde tes infos perso (adresse, numéro) pour plus tard. Si quelque chose cloche, Miam Safe est là dans l'app, et le **17** ou le **112** en cas de danger.",
        "**Les étiquettes** : celles de la liste officielle (Assiette, Ambiance, Pratique, Public), ou des étiquettes libres (2 à 24 caractères), passées au filtre de mots et refusées si elles parlent d'alcool. Une étiquette libre respecte les règles comme le reste : elle se signale avec la sortie, et l'équipe peut la retirer. « LGBT+ friendly » est une étiquette de sortie, que chacun choisit ou non, pas une case de ton profil.",
        "**Des limites contre les abus** : 10 sorties créées et 30 demandes « Je viens » par 24 heures, 30 coucous par heure, 5 idées par 24 heures et 30 commentaires d'idée par heure.",
        "**Si ton compte est limité** : pas de nouvelle sortie des Miamis ni de demande pour venir, pas de « Qui est là ? » (t'y montrer, faire coucou), pas d'idée ni de commentaire d'idée, et ta sortie qui revient chaque semaine ne revient pas. Tu peux toujours tout lire, voter pour une idée, aimer un commentaire, répondre aux demandes de ta sortie ou l'annuler, et te désister (voir [Signalements et modération](#moderation)).",
      ],
    },
    "Tu peux **signaler** une sortie des Miamis depuis son menu (voir « Signalements et modération »), et **bloquer** quelqu'un : vous ne voyez alors plus les sorties de l'autre, ni celles où il a déjà sa place, et vous ne vous voyez plus dans « Qui est là ? ».",
  ],
};

export const sectionQuiEstLaCgu: SectionLegale = {
  id: "qui-est-la",
  titre: "« Qui est là ? » et les coucous",
  blocs: [
    "« Qui est là ? » montre les Miamis de ta ville qui ont **choisi** d'y apparaître, avec leur @pseudo et leur avatar, jamais leur position. Tu y apparais seulement si tu touches « Me montrer ici », pour **3 heures** (tu peux prolonger), et tu disparais dès que tu te caches.",
    {
      liste: [
        "**Un coucou, c'est donnant-donnant** : pour en faire, montre-toi d'abord. La personne voit que tu lui as fait coucou ; si elle te le rend, c'est réciproque, et vous pouvez vous ajouter à vos bandes (par une demande, qu'elle accepte ou non).",
        "**Sans réponse, on n'insiste pas** : un coucou sans retour ne fait sonner personne (la personne le voit seulement dans « Qui est là ? »), et il disparaît au bout de 24 heures. Faire coucou en boucle, revenir avec un autre compte ou se servir des coucous pour importuner quelqu'un, c'est du harcèlement : c'est interdit.",
        "**Ce n'est pas un outil pour retrouver quelqu'un** : « Qui est là ? » dit seulement qu'un Miami est dans la même ville, sans dire où. N'essaie pas d'en savoir plus, et ne t'en sers jamais pour suivre quelqu'un.",
        "Une personne que tu bloques ne te voit plus dans « Qui est là ? », et tu ne la vois plus.",
      ],
    },
  ],
};

export const sectionBoiteAIdeesCgu: SectionLegale = {
  id: "boite-a-idees",
  titre: "La boîte à idées",
  blocs: [
    "Une envie pour l'app ? Propose-la dans la boîte à idées (Profil › ⚙️ Paramètres › La vie de SOS Miam), vote pour celles des autres (« Miam ! ») et commente-les. Une idée publiée et ses commentaires sont visibles de **tous les Miamis** connectés, avec ton @pseudo.",
    {
      liste: [
        "**La Brigade relit chaque idée** (la Brigade, ici, c'est l'équipe de SOS Miam) avant qu'elle apparaisse aux autres : en attendant, elle est « en relecture », et seuls toi et la Brigade la voyez. Ensuite, la Brigade lui donne une étape (proposée, à l'étude, prévue, « C'est fait ! »), peut y répondre, et choisit chaque mois l'idée du mois.",
        "**Une idée par proposition**, en une phrase (8 à 90 caractères) et un détail facultatif (500 au plus), **sans nom de lieu ni de personne**. Si la même idée existe déjà, l'app te propose de voter pour elle : une voix de plus sur une idée lancée pèse plus qu'un doublon.",
        "**Les commentaires** (500 caractères au plus) suivent les règles de la communauté, et ne font sonner personne. La Brigade peut masquer un commentaire qui ne les respecte pas.",
        "**Aucune promesse** : la Brigade lit tout, mais une idée, même très votée ou choisie comme idée du mois, ne nous engage ni à la construire, ni à une date, et ne donne droit à aucune rémunération. En droit, une idée n'appartient à personne : on peut s'en inspirer librement pour améliorer SOS Miam. Ton texte, lui, reste à toi (voir « Ce que tu publies dans l'app »).",
        "**Tu gardes la main** : tu peux retirer ton idée (ses votes et ses commentaires partent avec) ou supprimer tes commentaires, quand tu veux.",
      ],
    },
    "Une idée ou un commentaire d'idée se **signale** depuis son menu (voir « Signalements et modération »).",
  ],
};
