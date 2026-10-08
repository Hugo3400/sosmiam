// FAQ, onglet « BIG SOS » (repris du prototype). Le BIG SOS est gratuit mais limité ; les limites ne sont pas encore définies : n'en annoncer aucune.
import type { QuestionFaq } from "~/contenus/faq/type-faq";

export const questionsBigSos: QuestionFaq[] = [
  {
    id: "faq-big-sos",
    question: "C'est quoi, un BIG SOS ?",
    reponse: [
      "L'alerte rouge de SOS Miam. Quand un lieu traverse une vraie galère (travaux devant la porte, grosse baisse de clients, coup dur…), il passe à la une de l'app pendant 7 jours. Restos, bars, bowlings, salles d'événements : tous les lieux indépendants peuvent en profiter. Le but : que toute la communauté se mobilise pour remplir la salle.",
    ],
  },
  {
    id: "faq-big-page",
    question: "Qu'est-ce qu'on trouve sur une page BIG SOS ?",
    reponse: [
      "L'histoire du lieu, racontée par son équipe ; les vidéos des créateurs venus le filmer, avec les liens utiles (TikTok, Instagram, site, réservation) ; un objectif de mobilisation, par exemple « 300 visites en 7 jours », avec une jauge qui avance en direct ; et des bons solidaires à acheter.",
    ],
  },
  {
    id: "faq-big-aider",
    question: "Comment aider un lieu en BIG SOS ?",
    reponse: [
      "Le plus utile : y aller ! Chaque achat vérifié fait avancer la jauge. Tu peux aussi lui donner une rescousse, partager sa page et ses vidéos autour de toi, ou acheter un bon solidaire.",
    ],
  },
  {
    id: "faq-bons-solidaires",
    question: "C'est quoi, un bon solidaire ?",
    reponse: [
      "Tu paies maintenant un repas, une boisson ou une partie de bowling, et tu en profites plus tard. Le lieu reçoit l'argent tout de suite, au moment où il en a le plus besoin, et toi, tu as une bonne raison d'y retourner.",
    ],
  },
  {
    id: "faq-big-choix",
    question: "Comment un lieu est-il choisi ?",
    reponse: [
      {
        numerotee: true,
        liste: [
          "**La demande :** le lieu la fait depuis son espace pro, ou un ambassadeur le propose.",
          "**La vérification :** un ambassadeur du quartier passe sur place.",
          "**Le vote :** la communauté soutient les demandes qui la touchent.",
          "**La validation :** l'équipe SOS Miam donne le feu vert, et le lieu passe à la une pour 7 jours.",
        ],
      },
    ],
  },
  {
    id: "faq-big-voter",
    question: "Je peux voter pour un BIG SOS ?",
    reponse: [
      "Oui ! Dans l'app, tu vois les demandes vérifiées par les ambassadeurs et tu votes pour celles qui te touchent. Les lieux les plus soutenus passent à la une en priorité.",
    ],
  },
  {
    id: "faq-big-demander",
    question: "Mon lieu est en difficulté : comment demander un BIG SOS ?",
    reponse: [
      "Depuis ton espace pro, en quelques minutes : tu expliques ce qui se passe, et tu ajoutes tes photos et tes liens. Tu peux aussi en parler à un ambassadeur de ton quartier. Si ta demande est retenue, on t'aide à raconter ton histoire et on te met en relation avec des créateurs pour les vidéos.",
    ],
  },
  {
    id: "faq-big-gene",
    question: "Demander de l'aide, ce n'est pas un peu gênant ?",
    reponse: [
      "Pas du tout : plein de gens ont envie de soutenir les lieux qu'ils aiment, encore faut-il qu'ils le sachent. Ton histoire est racontée avec bienveillance, pour donner envie de venir, jamais pour faire pitié. Et c'est toi qui valides ce qui est dit.",
    ],
  },
  {
    id: "faq-big-apres",
    question: "Et après les 7 jours ?",
    reponse: [
      "Le lieu quitte la une, mais garde sa page, ses vidéos et tous les sauveteurs qui l'ont découvert. On fait le bilan ensemble : visites, rescousses, bons solidaires. Et les nouveaux habitués, eux, restent.",
    ],
  },
  {
    id: "faq-big-role",
    question: "Quel rôle pour les ambassadeurs et les créateurs ?",
    reponse: [
      "Les ambassadeurs repèrent les lieux du quartier qui ont besoin d'aide, proposent des BIG SOS, passent vérifier sur place et mobilisent le quartier pendant les 7 jours. Les créateurs viennent filmer le lieu et racontent son histoire : leurs vidéos sont réunies sur la page BIG SOS.",
    ],
  },
];
