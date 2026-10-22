// Tous les liens du pied de page, rangés par groupe : le site, l'espace ambassadeur, les réseaux et les pages légales.
// « site » dit où vit la page : le pied de page en fait une adresse complète quand il est affiché sur un autre site
// (sosmiam.fr, ambassadeur.sosmiam.fr, pro.sosmiam.fr). Les réseaux viennent de liens-publics.ts, les pages légales (et « Gérer mes cookies ») de liens-legaux.ts.
import { site } from "~/contenus/legal/informations-legales";
import { lienGererCookies, pagesLegales } from "~/contenus/legal/liens-legaux";
import { liensPublics, RESEAUX_SOCIAUX } from "~/contenus/liens-publics";

export type SiteDuLien = "principal" | "ambassadeur" | "pro" | "externe";

export type LienPiedDePage = {
  texte: string;
  adresse: string;
  site: SiteDuLien;
  /** « Gérer mes cookies » : rouvre le panneau des cookies (composants/cookies/LienGererCookies), sinon suit l'adresse */
  reglagesCookies?: boolean;
};

export type GroupePiedDePage = { titre: string; liens: LienPiedDePage[] };

export const groupesPiedDePage: GroupePiedDePage[] = [
  {
    titre: "SOS Miam",
    liens: [
      { texte: "Accueil", adresse: "/", site: "principal" },
      { texte: "Questions fréquentes", adresse: "/faq", site: "principal" },
      { texte: "J'inscris mon lieu", adresse: "/inscrire-mon-lieu", site: "principal" },
      { texte: "On recrute", adresse: "/carriere", site: "principal" },
      { texte: "Chasse aux bugs", adresse: "/securite", site: "principal" },
      // Aperçus de ce qu'on prépare pour l'app (noindex, « ça peut encore changer »), ajouté à la demande de Hugo le 15/10
      { texte: "Ce qu'on prépare", adresse: "/preview", site: "principal" },
      { texte: "Espace pro", adresse: "/bienvenue", site: "pro" },
      // Un seul compte pour l'app et les espaces : infos, données, suppression (même sans se connecter)
      { texte: "Mon compte", adresse: "/mon-compte", site: "principal" },
      { texte: "Contact", adresse: `mailto:${site.emailContact}`, site: "externe" },
    ],
  },
  {
    titre: "Ambassadeurs",
    liens: [
      { texte: "Le programme", adresse: "/programme", site: "ambassadeur" },
      { texte: "Devenir ambassadeur", adresse: "/inscription", site: "ambassadeur" },
      { texte: "Se connecter", adresse: "/connexion", site: "ambassadeur" },
    ],
  },
  {
    titre: "Nous suivre",
    liens: [
      ...liensPublics
        .filter((lien) => RESEAUX_SOCIAUX.includes(lien.reseau))
        .map((lien) => ({ texte: lien.nom, adresse: lien.adresse, site: "externe" as const })),
      { texte: "Tous nos liens", adresse: "/liens", site: "principal" },
    ],
  },
  {
    titre: "Infos légales",
    liens: [
      ...pagesLegales.map((lien) => ({ texte: lien.texte, adresse: lien.href, site: "principal" as const })),
      { texte: lienGererCookies.texte, adresse: lienGererCookies.href, site: "principal", reglagesCookies: true },
    ],
  },
];
