// Les pages légales : le pied de page (groupe « Infos légales »), le pied de page simple de /liens et le bloc « À lire
// aussi » en bas de chaque page légale (PagesLegalesLiees).

export type PageLegale = { href: string; texte: string; /** Une phrase pour « À lire aussi » */ resume: string };

/** Toutes les pages légales, dans l'ordre du pied de page */
export const pagesLegales: PageLegale[] = [
  { href: "/mentions-legales", texte: "Mentions légales", resume: "Qui édite SOS Miam, qui l'héberge, et comment signaler un contenu." },
  { href: "/confidentialite", texte: "Confidentialité", resume: "Ce qu'on fait de tes données, combien de temps, et tes droits." },
  { href: "/cookies", texte: "Cookies", resume: "Chaque cookie posé, à quoi il sert, combien de temps, et ton choix." },
  { href: "/cgu", texte: "Conditions d'utilisation", resume: "Les règles du jeu du site et de l'app." },
  { href: "/accessibilite", texte: "Accessibilité", resume: "Ce qui marche déjà, ce qui est en cours, et comment nous alerter." },
  { href: "/age", texte: "SOS Miam et l'âge", resume: "Un compte dès 18 ans, et les repères pour les parents." },
  { href: "/prevention", texte: "Santé et prévention", resume: "L'alcool, la route, manger et bouger, et où trouver de l'aide." },
  { href: "/statistiques", texte: "Statistiques de visite", resume: "Comment on compte les visites sans cookie, et comment ne plus être compté." },
];

/** Les cinq pages légales « classiques », reprises dans le pied de page simple de /liens */
export const liensLegaux = pagesLegales.slice(0, 5);

/** Le lien « Gérer mes cookies » du pied de page : la partie « Tes choix » de la page Cookies */
export const lienGererCookies = { href: "/cookies#mes-choix", texte: "Gérer mes cookies" };
