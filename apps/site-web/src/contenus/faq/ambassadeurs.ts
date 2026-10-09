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
      "L'un des premiers ambassadeurs de sa ville, qui lancent SOS Miam avec nous. Le nombre de places dépend de la taille de la ville : 10 au-delà de 500\u00a0000 habitants, 5 de 200\u00a0000 à 500\u00a0000, 3 de 100\u00a0000 à 200\u00a0000 et 1 de 50\u00a0000 à 100\u00a0000. Les communes plus petites partagent 1 place par département, et chaque collectivité d'outre-mer a la sienne : 367 places en tout, ouvertes en même temps partout en France.",
      "Les fondateurs reçoivent une carte numérotée « Fondateur n°\u00a03 de Lyon · n°\u00a0147 en France » (à télécharger et à partager tout de suite, et une vraie carte envoyée plus tard), leur prénom en vitrine sur un autocollant « Déniché par », des badges, et l'app en avant-première, en lien direct avec l'équipe. Pour faire connaissance : une visio d'environ 30 minutes avec les fondateurs de sa ville (de sa région pour un fondateur de département), et un tête-à-tête si besoin.",
      `Pour candidater, crée d'abord ton compte sur ${lienEspace}. Une fois ton compte validé, tu candidates depuis ton espace pour la ville où tu vis, ou pour ton département si ta commune a moins de 50\u00a0000 habitants, tant qu'il y reste des places. Ensuite, c'est l'équipe qui choisit.`,
    ],
    motsCles: ["fondateur", "candidature", "ville", "département", "places", "carte", "visio"],
  },
  {
    id: "faq-fondateurs-complet",
    question: "Ma ville est au complet : je fais comment ?",
    reponse: [
      "Quand toutes les places d'une ville (ou d'un département) sont prises, la candidature s'y ferme toute seule, et rouvre dès qu'une place se libère. Il n'y a pas de liste d'attente. Et si un fondateur déménage, il garde son titre en souvenir, mais sa place se libère. Un numéro de fondateur n'est jamais redonné : le suivant à Lyon après le n°\u00a010 sera le n°\u00a011.",
    ],
    motsCles: ["fondateur", "complet", "plus de place", "déménagement", "déménager", "numéro"],
  },
  {
    id: "faq-createurs",
    question: "Je suis créateur de contenu : comment ça marche ?",
    reponse: [
      "Plus tard, les lieux pourront demander une vidéo à des créateurs (« Viens filmer mon resto »), avec leurs conditions affichées à l'avance : repas offert ou rémunération, et toujours la mention « Collaboration commerciale ». Ce n'est pas encore ouvert : [laisse ton e-mail](/#inscription) pour avoir des nouvelles.",
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
