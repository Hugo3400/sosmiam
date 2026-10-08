// FAQ, onglet « L'app » (repris du prototype).
import type { QuestionFaq } from "~/contenus/faq/type-faq";

export const questionsApp: QuestionFaq[] = [
  {
    id: "faq-rescousse",
    question: "C'est quoi, une « rescousse » ?",
    reponse: [
      "C'est ton coup de pouce à un lieu. Tu en as 3 par semaine, rechargées chaque lundi, donc chacune compte. Les lieux qui en reçoivent le plus remontent dans le fil et se font connaître.",
    ],
  },
  {
    id: "faq-qr-code",
    question: "Comment valider mon passage ?",
    reponse: [
      "En payant. Au moment de l'addition, demande-la dans l'app (« Demander l'addition SOS Miam ») : le serveur la marque réglée d'un geste. Si le lieu a une caisse connectée, scanne le QR imprimé sur ton ticket. Une réservation faite dans l'app et honorée compte aussi. C'est ce qui ouvre ton avis, te rapporte des points et remplit ta carte de fidélité.",
    ],
  },
  {
    id: "faq-avis-fiables",
    question: "Les avis sont-ils fiables ?",
    reponse: [
      "Oui : on ne peut noter qu'après un achat vérifié (addition réglée, ticket scanné ou réservation honorée), et l'invitation arrive une heure après, pas devant le patron. Un avis louche est relu par un ambassadeur, la moyenne est prudente, et on montre aussi la part de clients qui reviennent. Pas de faux avis achetés, pas de concurrents qui notent en douce.",
    ],
  },
  {
    id: "faq-recompenses",
    question: "Qu'est-ce que j'y gagne ?",
    reponse: [
      "Chaque visite validée et chaque rescousse te rapportent des points : tu passes les paliers (Curieux, Dénicheur, Ambassadeur…) et tu débloques des badges. Ta carte de fidélité te fait gagner un café ou un dessert offert dans tes lieux préférés, et il y a des défis chaque mois et un classement de ton quartier.",
    ],
  },
  {
    id: "faq-proposer",
    question: "Je connais une pépite : je peux la proposer ?",
    reponse: [
      "Bien sûr ! Propose-la depuis l'app. Si elle rejoint SOS Miam, tu gagnes le badge « Premier sauveteur » et sa fiche affiche « Déniché par » avec ton prénom.",
    ],
  },
  {
    id: "faq-entre-potes",
    question: "Je peux organiser une sortie entre potes ?",
    reponse: [
      "Oui : crée une sortie, propose jusqu'à 3 lieux, et tes potes votent. Le lieu gagnant reçoit une rescousse de chaque participant. Tu peux aussi suivre tes amis et partager des listes, du genre « Brunchs du dimanche ».",
    ],
  },
  {
    id: "faq-reserver",
    question: "Je peux réserver une table ?",
    reponse: [
      "Dans les lieux qui proposent la réservation, oui : tu envoies une demande (nombre de personnes, créneau) et le lieu te répond par notification. Et quand un lieu lance un SOS, le bouton « J'y vais » te garde une place pendant 20 minutes.",
    ],
  },
  {
    id: "faq-notifications",
    question: "Je vais recevoir plein de notifications ?",
    reponse: [
      "Non, c'est toi qui règles tout : les quartiers qui t'intéressent, les horaires où tu veux être prévenu, ou rien du tout. Une alerte, ça ressemble à « La pâtisserie à 200 m est calme ce soir, un chou offert ».",
    ],
  },
  {
    id: "faq-donnees",
    question: "Qu'est-ce que vous faites de mes données ?",
    reponse: [
      "Le strict nécessaire pour faire marcher l'app. Ta position sert seulement à te montrer les lieux autour de toi, et uniquement si tu l'autorises. On ne vend jamais tes données, et tu peux supprimer ton compte quand tu veux.",
    ],
  },
];
