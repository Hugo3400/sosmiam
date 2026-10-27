import { MESSAGE_SANITAIRE_ALCOOL_TRADUIT } from "~/contenus/anglais/liens-pied-de-page";
import { site } from "~/contenus/anglais/legal/informations-legales";
import { ALCOOL_INFO_SERVICE, MESSAGE_SANITAIRE_ALCOOL } from "~/contenus/legal/prevention";
import type { DocumentLegal } from "~/contenus/legal/type-legal";

const lienContact = `[${site.emailContact}](mailto:${site.emailContact})`;
const messageSanitaire = `{fr:${MESSAGE_SANITAIRE_ALCOOL}} (${MESSAGE_SANITAIRE_ALCOOL_TRADUIT})`;
const numeroInternational = "+33 9 80 98 09 30";
const serviceAlcool = `${ALCOOL_INFO_SERVICE.nom} (French-language helpline)`;
const lienTelephone = `[${ALCOOL_INFO_SERVICE.telephone}](${ALCOOL_INFO_SERVICE.lienTelephone})`;

export const documentPreventionAnglais: DocumentLegal = {
  titre: "Health and wellbeing",
  description:
    "SOS Miam helps you discover restaurants, bars and things to do. Here are our messages about alcohol, the road and a balanced diet, and where to find help.",
  miseAJour: "9 October 2026",
  introduction: [
    "SOS Miam helps you discover restaurants, patisseries, bars and things to do. Treating yourself, yes; putting yourself in danger, no. Here are the essentials, and where to find help if you need it.",
    messageSanitaire,
  ],
  enBref: [
    {
      liste: [
        `**Alcohol**: enjoy the moment, at your own pace. Need to talk about it? ${serviceAlcool} takes calls on ${lienTelephone} (${numeroInternational}), anonymously.`,
        "**The road**: don't drink and drive.",
        "**Eating well and keeping active**: treat yourself without overdoing it, and move a little every day.",
        "**Is a venue pushing people to drink?** Report it. We'll check and take action.",
      ],
    },
  ],
  sections: [
    {
      id: "alcool",
      titre: "Alcohol",
      blocs: [
        messageSanitaire,
        "Some venues on SOS Miam serve alcohol, and some advertise a happy hour. It's never an invitation to drink more: enjoy the moment, at your own pace, and know when to stop.",
        `**Need to talk about it, for yourself or for someone close to you?** ${serviceAlcool} takes calls on ${lienTelephone} (${numeroInternational} · anonymous, no premium charge) and is online at [alcool-info-service.fr](${ALCOOL_INFO_SERVICE.site}).`,
      ],
    },
    {
      id: "route",
      titre: "Don't drink and drive",
      blocs: [
        "Before you head out, decide who's driving everyone home: the person driving doesn't drink any alcohol all evening. Otherwise, there's public transport, a taxi, a private hire car or staying over at a friend's.",
        "Not sure you're fit to drive? Don't get behind the wheel.",
      ],
    },
    {
      id: "manger-bouger",
      titre: "Eating well and keeping active",
      blocs: [
        "SOS Miam loves a good table, and the best table is one you enjoy without overdoing it. For your health: eat at least five portions of fruit and vegetables a day, avoid food that's too fatty, too sweet or too salty, and be active for at least 30 minutes a day.",
        "Simple ideas and tips (in French) on [mangerbouger.fr](https://www.mangerbouger.fr).",
      ],
    },
    {
      id: "contact",
      titre: "A problem with a venue?",
      blocs: [
        `Is a venue or a post pushing people to drink, or targeting under-18s? Report it in the app, or contact us at ${lienContact}. We'll check and take action.`,
      ],
    },
  ],
  chapitres: [
    { id: "boire", titre: "Alcohol", sections: ["alcool"] },
    { id: "conduire", titre: "Don't drink and drive", sections: ["route"] },
    { id: "equilibre", titre: "Eating well and keeping active", sections: ["manger-bouger"] },
    { id: "signaler-un-lieu", titre: "A problem with a venue?", sections: ["contact"] },
  ],
};
