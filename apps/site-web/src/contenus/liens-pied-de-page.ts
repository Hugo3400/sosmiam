import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_PIED_DE_PAGE_ANGLAIS } from "~/contenus/anglais/liens-pied-de-page";

export type SiteDuLien = "principal" | "ambassadeur" | "pro" | "externe";

export type LienPiedDePage = {
  texte: string;
  adresse: string;
  site: SiteDuLien;
  reglagesCookies?: boolean;
};

export type GroupePiedDePage = { titre: string; liens: LienPiedDePage[] };

export const TEXTES_PIED_DE_PAGE = {
  groupes: { site: "SOS Miam", ambassadeurs: "Ambassadeurs", suivre: "Nous suivre", legal: "Infos légales" },
  liens: {
    accueil: "Accueil",
    faq: "Questions fréquentes",
    actus: "Actus des Miamis",
    inscrireLieu: "J'inscris mon lieu",
    carriere: "On recrute",
    securite: "Chasse aux bugs",
    apercus: "Ce qu'on prépare",
    espacePro: "Espace pro",
    monCompte: "Mon compte",
    contact: "Contact",
    programme: "Le programme",
    devenirAmbassadeur: "Devenir ambassadeur",
    seConnecter: "Se connecter",
    tousNosLiens: "Tous nos liens",
  },
  reseaux: { discord: "Le Discord", tiktok: "TikTok", instagram: "Instagram" },
  accroche: "Fait avec 🧡 pour les adresses de ton quartier.",
  tousLesLiens: "Tous les liens",
  besoinDAide: "Besoin d'aide ?",
};

export const TEXTES_PIED_DE_PAGE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_PIED_DE_PAGE>> = {
  fr: TEXTES_PIED_DE_PAGE,
  en: TEXTES_PIED_DE_PAGE_ANGLAIS,
};
