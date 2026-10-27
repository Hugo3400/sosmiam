const PAGES_DOUBLEES = [
  "/",
  "/faq",
  "/inscrire-mon-lieu",
  "/carriere",
  "/securite",
  "/lieux",
  "/actus",
  "/mentions-legales",
  "/confidentialite",
  "/cookies",
  "/cgu",
  "/age",
  "/accessibilite",
  "/prevention",
  "/statistiques",
  "/programme",
  "/bienvenue",
];

const DEBUTS_DOUBLES = [/^\/carriere\/[^/]+$/];

export function estPageDoublee(chemin: string): boolean {
  const page = chemin.split(/[?#]/)[0].replace(/\.data$/, "").replace(/(.)\/+$/, "$1");
  return PAGES_DOUBLEES.includes(page) || DEBUTS_DOUBLES.some((debut) => debut.test(page));
}
