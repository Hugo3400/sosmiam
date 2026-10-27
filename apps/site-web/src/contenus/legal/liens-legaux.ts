import type { ParLangue, Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_PAGES_LEGALES_ANGLAIS } from "~/contenus/anglais/legal/liens-legaux";

export type PageLegale = { href: string; texte: string; resume: string };

export const ADRESSE_GERER_COOKIES = "/cookies#mes-choix";

export const TEXTES_PAGES_LEGALES = {
  pages: {
    mentionsLegales: { texte: "Mentions légales", resume: "Qui édite SOS Miam, qui l'héberge, et comment signaler un contenu." },
    confidentialite: { texte: "Confidentialité", resume: "Ce qu'on fait de tes données, combien de temps, et tes droits." },
    cookies: { texte: "Cookies", resume: "Chaque cookie posé, à quoi il sert, combien de temps, et ton choix." },
    cgu: { texte: "Conditions d'utilisation", resume: "Les règles du jeu du site et de l'app." },
    accessibilite: { texte: "Accessibilité", resume: "Ce qui marche déjà, ce qui est en cours, et comment nous alerter." },
    age: { texte: "SOS Miam et l'âge", resume: "Un compte dès 18 ans, et les repères pour les parents." },
    prevention: { texte: "Santé et prévention", resume: "L'alcool, la route, manger et bouger, et où trouver de l'aide." },
    statistiques: { texte: "Statistiques de visite", resume: "Comment on compte les visites sans cookie, et comment ne plus être compté." },
  },
  gererCookies: "Gérer mes cookies",
  aLireAussi: "À lire aussi",
};

export const TEXTES_PAGES_LEGALES_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_PAGES_LEGALES>> = {
  fr: TEXTES_PAGES_LEGALES,
  en: TEXTES_PAGES_LEGALES_ANGLAIS,
};
