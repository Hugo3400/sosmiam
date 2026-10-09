// Page /prevention : l'alcool, la route et l'équilibre alimentaire (décidé par Hugo le 9 octobre 2026, docs/decisions.md,
// « Santé et prévention »). Le message sanitaire de la loi Évin (« L'abus d'alcool est dangereux pour la santé, à consommer
// avec modération ») est écrit tel quel : c'est une formule imposée, on ne la met pas au tutoiement. Les numéros et les
// sites sont ceux des services publics d'aide (Santé publique France) ; ne pas en ajouter sans vérifier qu'ils existent.
import { site } from "~/contenus/legal/informations-legales";
import type { DocumentLegal } from "~/contenus/legal/type-legal";

/** Formule imposée par la loi Évin, reprise telle quelle partout où l'alcool est évoqué */
export const MESSAGE_SANITAIRE_ALCOOL = "L'abus d'alcool est dangereux pour la santé, à consommer avec modération.";

/** Le service d'aide sur l'alcool : appel anonyme et non surtaxé, 7 jours sur 7 */
export const ALCOOL_INFO_SERVICE = {
  nom: "Alcool Info Service",
  telephone: "0 980 980 930",
  lienTelephone: "tel:+33980980930",
  site: "https://www.alcool-info-service.fr",
};

const lienContact = `[${site.emailContact}](mailto:${site.emailContact})`;

export const documentPrevention: DocumentLegal = {
  titre: "Santé et prévention",
  description:
    "SOS Miam te fait découvrir des restos, des bars et des sorties : voici nos messages sur l'alcool, la route et l'équilibre alimentaire, et où trouver de l'aide.",
  miseAJour: "9 octobre 2026",
  introduction: [
    "SOS Miam te fait découvrir des restos, des pâtisseries, des bars et des sorties. Se régaler, oui ; se mettre en danger, non. Voici l'essentiel, et où trouver de l'aide si tu en as besoin.",
    `**${MESSAGE_SANITAIRE_ALCOOL}**`,
  ],
  sections: [
    {
      id: "alcool",
      titre: "L'alcool",
      blocs: [
        `**${MESSAGE_SANITAIRE_ALCOOL}**`,
        "Certains lieux de SOS Miam servent de l'alcool, et certains annoncent un happy hour. Ce n'est jamais une invitation à boire plus : profite du moment, à ton rythme, et sache dire stop.",
        `**Besoin d'en parler, pour toi ou pour un proche ?** ${ALCOOL_INFO_SERVICE.nom} répond au [${ALCOOL_INFO_SERVICE.telephone}](${ALCOOL_INFO_SERVICE.lienTelephone}) (appel anonyme et non surtaxé), et sur [alcool-info-service.fr](${ALCOOL_INFO_SERVICE.site}).`,
      ],
    },
    {
      id: "route",
      titre: "Quand on boit, on ne conduit pas",
      blocs: [
        "Avant de partir, décidez qui ramène tout le monde : la personne qui conduit ne boit pas d'alcool de la soirée. Sinon, il y a les transports, le taxi, le VTC, ou dormir sur place chez un pote.",
        "Un doute sur ton état ? Ne prends pas le volant.",
      ],
    },
    {
      id: "manger-bouger",
      titre: "Manger et bouger",
      blocs: [
        "SOS Miam aime les bonnes tables, et la meilleure table est celle qu'on apprécie sans excès. Pour ta santé : mange au moins cinq fruits et légumes par jour, évite de manger trop gras, trop sucré, trop salé, et bouge au moins 30 minutes par jour.",
        "Des idées simples et des conseils sur [mangerbouger.fr](https://www.mangerbouger.fr).",
      ],
    },
    {
      id: "contact",
      titre: "Un souci avec un lieu ?",
      blocs: [
        `Un lieu ou une publication pousse à boire, ou vise des mineurs ? Signale-le dans l'app, ou écris-nous à ${lienContact}. On vérifie et on agit.`,
      ],
    },
  ],
};
