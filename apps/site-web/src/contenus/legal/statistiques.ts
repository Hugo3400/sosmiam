// Page /statistiques : comment on compte les visites (sans cookie), et le bouton pour ne plus être compté (droit
// d'opposition). Le détail du traitement est dans la politique de confidentialité, section « statistiques » ; les deux
// textes doivent rester d'accord (services/mesure.server.ts). Le bouton s'ajoute à la section « ton-choix »
// (routes/public/statistiques.tsx, composants/legal/ChoixStatistiques.tsx).
import type { DocumentLegal } from "~/contenus/legal/type-legal";

export const documentStatistiques: DocumentLegal = {
  titre: "Tes visites et nos statistiques",
  description: "Comment SOS Miam compte ses visites sans cookie ni pistage, et comment ne plus être compté en un clic.",
  miseAJour: "14 octobre 2026",
  introduction: [
    "Pour savoir si SOS Miam plaît (combien de visites, quelles pages, d'où l'on vient), notre serveur compte les pages vues lui-même. **Pas de cookie de mesure, pas de script espion, pas de Google Analytics** : on ne garde que des totaux, jamais ton adresse IP ni rien qui permette de te reconnaître.",
  ],
  enBref: [
    {
      liste: [
        "**Comptées sans cookie**, par notre serveur, en totaux anonymes.",
        "**Pas comptées du tout** si ton navigateur envoie le signal « Global Privacy Control » ou « Do Not Track ».",
        "**Tu préfères ne pas être compté ?** [Un clic suffit](#ton-choix).",
      ],
    },
  ],
  sections: [
    {
      id: "comment",
      titre: "Comment on compte",
      blocs: [
        "Quand tu ouvres une page, notre serveur regarde la page demandée (sans ce qui suit le « ? », sauf le nom d'une campagne : « ?utm_… » ou « ?ref= »), le site d'où tu arrives, la grande famille de ton appareil et de ton navigateur, ta langue et ton pays, puis ajoute une unité à des **totaux** : pages vues, visites, visiteurs. Rien n'est gardé qui permette de te reconnaître.",
        "Pour compter les visiteurs sans les reconnaître, ton adresse IP et ton navigateur sont brouillés avec un code secret qui change à chaque période (jour, semaine, mois, année) et qui est effacé à la fin de celle-ci. Une copie de ce code peut encore dormir **30 jours au plus** dans nos sauvegardes chiffrées, puis elle disparaît aussi.",
        "Les robots sont comptés à part, par leur nom seulement ; les pages préchargées par ton navigateur et la version du site en préparation ne sont pas comptées.",
        "Tous les détails (ce qui est regardé, ce qui est gardé, combien de temps, la base légale) sont dans la [politique de confidentialité](/confidentialite#statistiques).",
      ],
    },
    {
      id: "ton-choix",
      titre: "Ton choix",
      blocs: ["Être compté, même anonymement, n'est pas une obligation : tu peux dire non à tout moment, et revenir sur ta décision."],
    },
    {
      id: "cookie-de-refus",
      titre: "Le cookie qui retient ton refus",
      blocs: [
        "Si tu refuses, un petit cookie, **sosmiam-sans-statistiques**, retient ton choix pendant **13 mois** dans ce navigateur. Il ne sert qu'à ça, et la loi le dispense d'accord. Si tu effaces tes cookies, il faudra refaire ton choix.",
        "Il figure, avec les autres, dans la [liste des cookies](/cookies#liste-des-cookies).",
      ],
    },
  ],
  chapitres: [
    { id: "on-compte", titre: "Comment on compte", sections: ["comment"] },
    { id: "choisir", titre: "Ton choix", sections: ["ton-choix", "cookie-de-refus"] },
  ],
};
