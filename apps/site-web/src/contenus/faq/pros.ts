// FAQ, onglet « Pour les pros » (repris du prototype). Prix : voir docs/decisions.md.
import type { QuestionFaq } from "~/contenus/faq/type-faq";

export const questionsPros: QuestionFaq[] = [
  {
    id: "faq-prix",
    question: "Combien ça coûte ?",
    motsCles: ["prix", "tarif", "tarifs", "abonnement", "payant", "payer"],
    reponse: [
      "Rien, pour toujours. Ta fiche et tous les outils sont gratuits : photos, horaires, avis vérifiés, affichette de table, SOS « place ce soir », statistiques détaillées et événements. Pas d'abonnement, pas d'engagement, et aucune commission sur tes réservations.",
      "SOS Miam vit de la publicité, toujours signalée comme telle et sans effet sur le classement.",
    ],
  },
  {
    id: "faq-qui-peut",
    question: "Qui peut s'inscrire ?",
    reponse: [
      "Tous les lieux indépendants : restos, pâtisseries, boulangeries, cafés, bars, caves, bowlings, salles d'événements et lieux de sortie (escape games, ateliers, activités nautiques…). Tu as deux ou trois adresses ? Pas de souci, tant que tu n'es ni une chaîne ni une franchise.",
    ],
  },
  {
    id: "faq-image",
    question: "« SOS », ça ne va pas donner une mauvaise image de mon lieu ?",
    reponse: [
      "Non. La plupart du temps, un SOS veut juste dire « on a de la place ce soir, venez ». Et si un jour tu traverses une vraie galère, le [BIG SOS](/faq#faq-big-sos) est là pour ça, raconté avec bienveillance, sans misérabilisme. Dans tous les cas, c'est toi qui décides si et quand tu lances un SOS : ta fiche vit très bien sans.",
    ],
  },
  {
    id: "faq-lancer-sos",
    question: "Comment je lance un SOS pour ce soir ?",
    reponse: [
      "Depuis ton espace pro, en un geste : tu indiques le nombre de places et jusqu'à quelle heure, avec une petite offre si tu veux (un dessert, un café…). Les clients du coin qui ont activé les alertes sont prévenus, et tu vois en direct qui arrive.",
    ],
  },
  {
    id: "faq-payer-classement",
    question: "Je peux payer pour être mieux classé ?",
    reponse: [
      "Non, jamais. Le classement dépend des rescousses et des visites validées. Les publicités sont toujours signalées comme telles et ne changent rien au classement.",
    ],
  },
  {
    id: "faq-kit-qr",
    question: "Comment marche le QR code ?",
    reponse: [
      "À l'inscription, tu reçois ton kit : un autocollant de vitrine et des chevalets de table avec ton QR code, qui ouvre ta fiche dans l'app. Pour noter, un client doit avoir payé : il demande l'addition dans l'app et tu la marques réglée d'un geste, ou ta caisse connectée imprime un QR sur son ticket. C'est ce qui rend les avis vérifiés et fait tourner ta carte de fidélité.",
    ],
  },
  {
    id: "faq-avis-negatif",
    question: "Et si je reçois un avis négatif ?",
    reponse: [
      "Seuls les clients qui ont vraiment payé chez toi peuvent laisser un avis : pas de faux avis, pas de règlement de comptes anonyme. Tu peux répondre publiquement à chaque avis et signaler ceux qui ne respectent pas les règles. Par contre, on ne supprime pas un avis simplement parce qu'il est critique.",
    ],
  },
  {
    id: "faq-fidelite",
    question: "Qui paie la récompense de la carte de fidélité ?",
    reponse: [
      "Toi, et c'est toi qui la choisis : un café, un dessert, une boisson… Tu fixes aussi le nombre de visites nécessaires (5 par défaut). Pour toi, c'est un client qui revient ; pour lui, une bonne raison de revenir.",
    ],
  },
  {
    id: "faq-reservations-pro",
    question: "Comment marchent les réservations ?",
    reponse: [
      "Si tu les actives, les clients t'envoient une demande (nombre de personnes, créneau) : tu acceptes ou tu refuses d'un geste, et ils sont prévenus. Pas de logiciel à installer, et aucune commission sur les réservations.",
    ],
  },
  {
    id: "faq-technique",
    question: "Je n'y connais rien en technique : c'est compliqué ?",
    reponse: [
      "Pas du tout. Tu crées ta fiche en 5 minutes depuis ton téléphone : photos, horaires, ton plat signature.",
    ],
  },
  {
    id: "faq-arreter",
    question: "Je peux arrêter quand je veux ?",
    reponse: [
      "Oui. Il n'y a ni abonnement ni engagement : tu peux supprimer ta fiche à tout moment depuis ton espace pro.",
    ],
  },
];
