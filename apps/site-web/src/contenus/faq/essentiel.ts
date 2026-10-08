// FAQ, onglet « L'essentiel » (repris du prototype).
import type { QuestionFaq } from "~/contenus/faq/type-faq";

export const questionsEssentiel: QuestionFaq[] = [
  {
    id: "faq-cest-quoi",
    question: "C'est quoi, SOS Miam ?",
    reponse: [
      "Une app qui te fait découvrir les restos, pâtisseries, bars et sorties indépendants près de chez toi, en priorité ceux qui ont besoin de monde : la pépite qui vient d'ouvrir, la salle calme un mardi soir, ou le lieu qui traverse un coup dur. Tu y vas, tu valides ta visite, tu donnes un coup de pouce : le lieu se fait connaître ou remonte la pente, et toi, tu te régales.",
    ],
  },
  {
    id: "faq-gratuit",
    question: "C'est gratuit ?",
    reponse: [
      "Oui, totalement, pour toi comme pour les lieux, et ça le restera. Personne ne paie pour être mieux classé.",
    ],
  },
  {
    id: "faq-financement",
    question: "Comment SOS Miam gagne de l'argent ?",
    reponse: [
      "Grâce à de la publicité, toujours signalée comme telle. Aucun abonnement pour les lieux, aucune commission sur les réservations, et la pub ne change jamais le classement : un lieu ne peut pas acheter sa place.",
    ],
  },
  {
    id: "faq-en-sos",
    question: "Un lieu « en SOS », ça veut dire quoi ?",
    reponse: [
      "Qu'il a besoin de monde. Souvent, c'est léger : il vient d'ouvrir, sa salle est calme ce soir, ou c'est une pépite encore trop peu connue. Parfois, c'est plus sérieux : travaux devant la porte, grosse baisse de clients, coup dur… Là, c'est un [BIG SOS](/faq#faq-big-sos), et toute la communauté se mobilise.",
    ],
  },
  {
    id: "faq-villes",
    question: "Dans quelles villes ?",
    reponse: [
      "Partout en France ! Les lieux arrivent au fur et à mesure qu'ils s'inscrivent ou que la communauté nous les fait découvrir, des grandes villes aux petits villages. [Laisse ton e-mail](/#inscription) pour savoir quand SOS Miam arrive près de chez toi.",
    ],
  },
  {
    id: "faq-sortie-app",
    question: "Quand sort l'app, et sur quels téléphones ?",
    reponse: [
      "Elle est encore en développement. Elle arrivera partout en France, sur iPhone et Android. [Laisse ton e-mail](/#inscription) pour être prévenu dès le lancement.",
    ],
  },
  {
    id: "faq-pas-que-manger",
    question: "SOS Miam, c'est seulement pour manger ?",
    reponse: [
      "Non ! Le nom vient de la bouffe, mais tu trouves aussi des bars, des bowlings, des salles d'événements et plein de sorties : escape games, ateliers, kayak, paddle… Tant que c'est indépendant et que ça mérite du monde, ça a sa place.",
    ],
  },
  {
    id: "faq-independants",
    question: "Pourquoi seulement des lieux indépendants ?",
    reponse: [
      "Les grandes chaînes ont déjà de la pub et de la visibilité. SOS Miam met en lumière les autres : la pâtisserie du coin, le petit resto de ton quartier, le bar qui vient d'ouvrir, l'atelier de poterie caché au fond d'une ruelle.",
    ],
  },
];
