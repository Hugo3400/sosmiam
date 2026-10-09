// Questions de /faq, reprises de la FAQ du site (apps/site-web/src/contenus/faq/) et adaptées à Discord :
// réponses plus courtes, avec l'e-mail ou un lien direct à la place des pages du site.
// Une réponse change sur le site ? Mettre ce fichier à jour aussi. Décisions et prix : docs/decisions.md.

export const THEMES_FAQ = {
  essentiel: { emoji: "💡", titre: "L'essentiel" },
  bigSos: { emoji: "🆘", titre: "BIG SOS" },
  app: { emoji: "📱", titre: "L'app" },
  pros: { emoji: "🍽️", titre: "Pour les pros" },
  ambassadeurs: { emoji: "🎖️", titre: "Ambassadeurs & créateurs" },
} as const;

export type QuestionFaq = {
  /** Identifiant stable, renvoyé par l'autocomplétion de /faq (100 caractères max). */
  id: string;
  theme: keyof typeof THEMES_FAQ;
  question: string;
  /** Markdown Discord. */
  reponse: string;
  /** Mots en plus pour la recherche, non affichés. */
  motsCles?: string[];
};

export const QUESTIONS_FAQ: QuestionFaq[] = [
  {
    id: "cest-quoi",
    theme: "essentiel",
    question: "C'est quoi, SOS Miam ?",
    reponse:
      "Une app qui te fait découvrir les restos, pâtisseries, bars et sorties indépendants près de chez toi, en priorité ceux qui ont besoin de monde : la pépite qui vient d'ouvrir, la salle calme un mardi soir, ou le lieu qui traverse un coup dur. Tu y vas, tu valides ta visite, tu donnes un coup de pouce : le lieu se fait connaître ou remonte la pente, et toi, tu te régales.",
    motsCles: ["concept", "principe", "presentation"],
  },
  {
    id: "gratuit",
    theme: "essentiel",
    question: "C'est gratuit ?",
    reponse: "Oui, totalement, pour toi comme pour les lieux, et ça le restera. Personne ne paie pour être mieux classé.",
    motsCles: ["prix", "payant", "payer", "cout"],
  },
  {
    id: "financement",
    theme: "essentiel",
    question: "Comment SOS Miam gagne de l'argent ?",
    reponse:
      "Grâce à de la publicité, toujours signalée comme telle. Aucun abonnement pour les lieux, aucune commission sur les réservations, et la pub ne change jamais le classement : un lieu ne peut pas acheter sa place.",
    motsCles: ["argent", "pub", "publicite", "modele"],
  },
  {
    id: "en-sos",
    theme: "essentiel",
    question: "Un lieu « en SOS », ça veut dire quoi ?",
    reponse:
      "Qu'il a besoin de monde. Souvent, c'est léger : il vient d'ouvrir, sa salle est calme ce soir, ou c'est une pépite encore trop peu connue. Parfois, c'est plus sérieux : travaux devant la porte, grosse baisse de clients, coup dur… Là, c'est un **BIG SOS**, et toute la communauté se mobilise.",
  },
  {
    id: "villes",
    theme: "essentiel",
    question: "Dans quelles villes ?",
    reponse:
      "Partout en France ! Les lieux arrivent au fur et à mesure qu'ils s'inscrivent ou que la communauté nous les fait découvrir, des grandes villes aux petits villages. Écris à **bonjour@sosmiam.fr** pour savoir quand SOS Miam arrive près de chez toi.",
    motsCles: ["ville", "montpellier", "herault", "ou"],
  },
  {
    id: "sortie-app",
    theme: "essentiel",
    question: "Quand sort l'app, et sur quels téléphones ?",
    reponse:
      "Elle est encore en développement. Elle arrivera partout en France, sur iPhone et Android. Pour être prévenu dès le lancement, écris à **bonjour@sosmiam.fr** (objet : « Inscription à la newsletter »), et garde un œil sur ce serveur.",
    motsCles: ["lancement", "date", "iphone", "android", "telecharger", "newsletter"],
  },
  {
    id: "pas-que-manger",
    theme: "essentiel",
    question: "SOS Miam, c'est seulement pour manger ?",
    reponse:
      "Non ! Le nom vient de la bouffe, mais tu trouves aussi des bars, des bowlings, des salles d'événements et plein de sorties : escape games, ateliers, kayak, paddle… Tant que c'est indépendant et que ça mérite du monde, ça a sa place.",
    motsCles: ["sortie", "activite", "bar", "bowling"],
  },
  {
    id: "independants",
    theme: "essentiel",
    question: "Pourquoi seulement des lieux indépendants ?",
    reponse:
      "Les grandes chaînes ont déjà de la pub et de la visibilité. SOS Miam met en lumière les autres : la pâtisserie du coin, le petit resto de ton quartier, le bar qui vient d'ouvrir, l'atelier de poterie caché au fond d'une ruelle.",
    motsCles: ["chaine", "franchise"],
  },
  {
    id: "big-sos",
    theme: "bigSos",
    question: "C'est quoi, un BIG SOS ?",
    reponse:
      "L'alerte rouge de SOS Miam. Quand un lieu traverse une vraie galère (travaux devant la porte, grosse baisse de clients, coup dur…), il passe à la une de l'app pendant 7 jours. Le but : que toute la communauté se mobilise pour remplir la salle. Tout le détail avec `/big-sos`.",
    motsCles: ["alerte", "difficulte", "une"],
  },
  {
    id: "big-aider",
    theme: "bigSos",
    question: "Comment aider un lieu en BIG SOS ?",
    reponse:
      "Le plus utile : y aller ! Chaque achat vérifié fait avancer la jauge. Tu peux aussi lui donner une rescousse, partager sa page et ses vidéos autour de toi, ou acheter un bon solidaire.",
    motsCles: ["soutenir", "aide"],
  },
  {
    id: "bons-solidaires",
    theme: "bigSos",
    question: "C'est quoi, un bon solidaire ?",
    reponse:
      "Tu paies maintenant un repas, une boisson ou une partie de bowling, et tu en profites plus tard. Le lieu reçoit l'argent tout de suite, au moment où il en a le plus besoin, et toi, tu as une bonne raison d'y retourner.",
    motsCles: ["bon", "solidaire"],
  },
  {
    id: "big-choix",
    theme: "bigSos",
    question: "Comment un lieu est-il choisi pour un BIG SOS ?",
    reponse:
      "1. **La demande :** le lieu la fait depuis son espace pro, ou un ambassadeur le propose.\n2. **La vérification :** un ambassadeur du quartier passe sur place.\n3. **Le vote :** la communauté soutient les demandes qui la touchent.\n4. **La validation :** l'équipe SOS Miam donne le feu vert, et le lieu passe à la une pour 7 jours.",
    motsCles: ["selection", "vote", "verification"],
  },
  {
    id: "big-demander",
    theme: "bigSos",
    question: "Mon lieu est en difficulté : comment demander un BIG SOS ?",
    reponse:
      "Depuis ton espace pro, en quelques minutes : tu expliques ce qui se passe, et tu ajoutes tes photos et tes liens. Tu peux aussi en parler à un ambassadeur de ton quartier. En attendant le lancement, écris-nous à **bonjour@sosmiam.fr** : on lit tout, avec attention.",
    motsCles: ["demande", "galere"],
  },
  {
    id: "big-gene",
    theme: "bigSos",
    question: "Demander de l'aide, ce n'est pas un peu gênant ?",
    reponse:
      "Pas du tout : plein de gens ont envie de soutenir les lieux qu'ils aiment, encore faut-il qu'ils le sachent. Ton histoire est racontée avec bienveillance, pour donner envie de venir, jamais pour faire pitié. Et c'est toi qui valides ce qui est dit.",
    motsCles: ["honte", "image"],
  },
  {
    id: "rescousse",
    theme: "app",
    question: "C'est quoi, une « rescousse » ?",
    reponse:
      "C'est ton coup de pouce à un lieu. Tu en as 3 par semaine, rechargées chaque lundi, donc chacune compte. Les lieux qui en reçoivent le plus remontent dans le fil et se font connaître.",
    motsCles: ["rescousses", "coup de pouce"],
  },
  {
    id: "valider-passage",
    theme: "app",
    question: "Comment valider mon passage dans un lieu ?",
    reponse:
      "En payant. Au moment de l'addition, demande-la dans l'app : le serveur la marque réglée d'un geste. Si le lieu a une caisse connectée, scanne le QR imprimé sur ton ticket. Une réservation faite dans l'app et honorée compte aussi. C'est ce qui ouvre ton avis et te rapporte des points.",
    motsCles: ["qr", "code", "scanner", "visite", "addition"],
  },
  {
    id: "avis-fiables",
    theme: "app",
    question: "Les avis sont-ils fiables ?",
    reponse:
      "Oui : on ne peut noter qu'après un achat vérifié (addition réglée, ticket scanné ou réservation honorée). Pas de faux avis achetés, pas de concurrents qui notent en douce.",
    motsCles: ["avis", "note", "faux"],
  },
  {
    id: "proposer-pepite",
    theme: "app",
    question: "Je connais une pépite : je peux la proposer ?",
    reponse:
      "Bien sûr ! Ici, tape `/proposer-lieu` : ta pépite arrive dans le salon des propositions et la communauté peut la soutenir. Une fois l'app sortie, tu pourras aussi la proposer directement dedans.",
    motsCles: ["proposer", "lieu", "suggestion", "ajouter"],
  },
  {
    id: "donnees",
    theme: "app",
    question: "Qu'est-ce que vous faites de mes données ?",
    reponse:
      "Le strict nécessaire pour faire marcher l'app. Ta position sert seulement à te montrer les lieux autour de toi, et uniquement si tu l'autorises. On ne vend jamais tes données, et tu peux supprimer ton compte quand tu veux.",
    motsCles: ["rgpd", "vie privee", "position"],
  },
  {
    id: "prix-pros",
    theme: "pros",
    question: "J'ai un lieu : combien ça coûte ?",
    reponse:
      "Rien, pour toujours. Ta fiche et tous les outils sont gratuits : photos, horaires, avis vérifiés, SOS « place ce soir », statistiques et événements. Pas d'abonnement, pas d'engagement, et aucune commission sur tes réservations.",
    motsCles: ["prix", "tarif", "abonnement", "commission", "restaurateur"],
  },
  {
    id: "inscrire-lieu",
    theme: "pros",
    question: "Comment inscrire mon lieu ?",
    reponse:
      "Écris à **bonjour@sosmiam.fr** avec le nom du lieu, la ville et son type (resto, pâtisserie, bar, sortie…). Restos, cafés, bars, caves, bowlings, salles d'événements, ateliers : tant que tu n'es ni une chaîne ni une franchise, tu as ta place.",
    motsCles: ["inscription", "fiche", "restaurant", "pro"],
  },
  {
    id: "payer-classement",
    theme: "pros",
    question: "Un lieu peut-il payer pour être mieux classé ?",
    reponse:
      "Non, jamais. Le classement dépend des rescousses et des visites validées. Les publicités sont toujours signalées comme telles et ne changent rien au classement.",
    motsCles: ["classement", "pub"],
  },
  {
    id: "devenir-ambassadeur",
    theme: "ambassadeurs",
    question: "Comment devenir ambassadeur ?",
    reponse:
      "Crée ton compte sur [ambassadeur.sosmiam.fr](https://ambassadeur.sosmiam.fr), dès 18 ans. L'équipe regarde chaque inscription à la main ; une fois la tienne validée, ton espace s'ouvre : kit média, lieux à proposer, missions. C'est gratuit, sans horaires ni objectifs, et tout est expliqué sur [la page du programme](https://ambassadeur.sosmiam.fr/programme).",
    motsCles: ["inscription", "compte", "espace", "18 ans", "palier", "points"],
  },
  {
    id: "ambassadeur-paye",
    theme: "ambassadeurs",
    question: "Les ambassadeurs sont-ils payés ?",
    reponse:
      "Non : c'est une aventure de passionnés, pas un emploi. Et un ambassadeur n'est jamais payé par un lieu qu'il met en avant. Si un lieu lui offre quelque chose, il l'écrit clairement, avec la mention « Collaboration commerciale ».",
    motsCles: ["argent", "salaire", "remuneration", "cadeau"],
  },
  {
    id: "fondateurs",
    theme: "ambassadeurs",
    question: "C'est quoi, un ambassadeur fondateur ?",
    reponse:
      "L'un des premiers ambassadeurs de sa ville, qui lancent SOS Miam avec nous près de chez eux. Chaque ville a ses places selon sa taille (10 à Paris, Marseille, Lyon et Toulouse, puis 5, 3 ou 1), et les communes de moins de 50 000 habitants partagent 1 place par département. Les fondateurs reçoivent une carte numérotée (« Fondateur n° 3 de Lyon · n° 147 en France »), leur prénom en vitrine sur un autocollant « Déniché par », des badges, l'app en avant-première en lien direct avec l'équipe, et une visio avec les autres fondateurs de leur coin.\nPour candidater, crée d'abord ton compte sur [ambassadeur.sosmiam.fr](https://ambassadeur.sosmiam.fr) : une fois ton compte validé, la candidature se fait depuis ton espace, pour ta ville (ou ton département), tant qu'il y reste des places.",
    motsCles: ["candidature", "fondateur", "ville", "places", "departement"],
  },
  {
    id: "createurs",
    theme: "ambassadeurs",
    question: "Je suis créateur de contenu : comment ça marche ?",
    reponse:
      "Plus tard, les lieux pourront demander une vidéo à des créateurs (« Viens filmer mon resto »), avec leurs conditions affichées à l'avance : repas offert ou rémunération. Et dès qu'un lieu offre un repas ou paie une vidéo, elle porte la mention « Collaboration commerciale », comme la loi l'exige. Ce n'est pas encore ouvert.",
    motsCles: ["tiktok", "instagram", "video", "influenceur"],
  },
];
