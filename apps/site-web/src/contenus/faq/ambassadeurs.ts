// FAQ, onglet « Ambassadeurs & créateurs » (repris du prototype).
import type { QuestionFaq } from "~/contenus/faq/type-faq";

export const questionsAmbassadeurs: QuestionFaq[] = [
  {
    id: "faq-devenir-ambassadeur",
    question: "Comment devenir ambassadeur ?",
    reponse: [
      "Utilise l'app : chaque lieu proposé, avis ou mise à jour te fait gagner des points et monter de palier. Le titre d'Ambassadeur de ville se fait sur candidature ou invitation. Un ambassadeur ne doit jamais être payé par un lieu qu'il met en avant.",
    ],
  },
  {
    id: "faq-fondateurs",
    question: "C'est quoi, un ambassadeur fondateur ?",
    reponse: [
      "L'un des 10 premiers ambassadeurs de SOS Miam. Ils lancent SOS Miam avec nous, aident à choisir les premiers lieux et gardent un badge de fondateur. Pour candidater, [laisse ton e-mail](/#inscription) et coche « ambassadeur fondateur ».",
    ],
  },
  {
    id: "faq-createurs",
    question: "Je suis créateur de contenu : comment ça marche ?",
    reponse: [
      "Crée ton profil créateur. Les lieux publient des missions (« Viens filmer mon resto ») avec leurs conditions affichées à l'avance : repas offert ou rémunération. Tu choisis celles qui te plaisent, et ta vidéo est publiée sur SOS Miam et sur tes réseaux.",
    ],
  },
  {
    id: "faq-sponsorise",
    question: "Les vidéos payées par un lieu sont-elles signalées ?",
    reponse: [
      "Oui, toujours. Dès qu'un lieu offre un repas ou paie une vidéo, elle porte la mention « Collaboration commerciale », comme la loi l'exige. Tu sais toujours ce qui est spontané et ce qui ne l'est pas.",
    ],
  },
];
