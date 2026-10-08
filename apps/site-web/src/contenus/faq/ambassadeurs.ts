// FAQ, onglet « Ambassadeurs & créateurs ». Le programme : docs/decisions.md (« Espace ambassadeur ») et la page
// /programme de l'espace ambassadeur ; on n'y promet rien d'autre. La FAQ du bot Discord en reprend une partie.
import { adresseEspaceAmbassadeur } from "~/contenus/ambassadeurs";
import type { QuestionFaq } from "~/contenus/faq/type-faq";

const lienEspace = `[${adresseEspaceAmbassadeur.replace("https://", "")}](${adresseEspaceAmbassadeur})`;

export const questionsAmbassadeurs: QuestionFaq[] = [
  {
    id: "faq-devenir-ambassadeur",
    question: "Comment devenir ambassadeur ?",
    reponse: [
      `Crée ton compte sur ${lienEspace}, dès 18 ans. L'équipe regarde chaque inscription à la main ; une fois la tienne validée, ton espace s'ouvre : kit média, lieux à proposer, missions. C'est gratuit, sans horaires ni objectifs, et tout est expliqué sur [la page du programme](${adresseEspaceAmbassadeur}/programme).`,
    ],
    motsCles: ["inscription", "compte", "espace", "18 ans", "majeur"],
  },
  {
    id: "faq-ambassadeur-paye",
    question: "Les ambassadeurs sont-ils payés ?",
    reponse: [
      "Non : c'est une aventure de passionnés, pas un emploi. Et un ambassadeur n'est jamais payé par un lieu qu'il met en avant. Si un lieu lui offre quelque chose, il l'écrit clairement, avec la mention « Collaboration commerciale ».",
    ],
    motsCles: ["argent", "salaire", "rémunération", "cadeau"],
  },
  {
    id: "faq-fondateurs",
    question: "C'est quoi, un ambassadeur fondateur ?",
    reponse: [
      "L'un des 10 premiers ambassadeurs, qui lancent SOS Miam avec nous. Ils reçoivent une carte numérotée, leur prénom en vitrine sur un autocollant « Déniché par », des badges, et l'app en avant-première, en lien direct avec l'équipe.",
      `Pour candidater, crée d'abord ton compte sur ${lienEspace} : une fois ton compte validé, la candidature se fait depuis ton espace.`,
    ],
    motsCles: ["fondateur", "candidature", "10"],
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
