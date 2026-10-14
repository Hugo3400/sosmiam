import type { CategorieConsentement } from "~/contenus/cookies-consentement";

/**
 * Retrait du consentement : les cookies connus des catégories retirées, à effacer « si possible ». Renvoie des cookies
 * périmés (Max-Age=0), pour Set-Cookie (serveur) ou document.cookie (navigateur), sur l'hôte de la page et sur
 * sosmiam.fr. Un nom finissant par « * » vise les cookies présents qui commencent ainsi. Les cookies posés sur le domaine
 * d'un partenaire (youtube.com…) ne peuvent pas être effacés d'ici : le navigateur ne nous les montre pas.
 */
export function creerEffacementsTraceurs(categories: CategorieConsentement[], enTeteCookie: string | null | undefined, hote: string): string[] {
  const nomHote = hote.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  const chezNous = nomHote === "sosmiam.fr" || nomHote.endsWith(".sosmiam.fr");
  const domaines = chezNous ? [undefined, "sosmiam.fr", ...(nomHote === "sosmiam.fr" ? [] : [nomHote])] : [undefined];
  const presents = (enTeteCookie ?? "").split(";").map((morceau) => morceau.split("=")[0].trim()).filter(Boolean);
  const noms = new Set<string>();
  for (const categorie of categories) {
    for (const traceur of categorie.partenaires.flatMap((partenaire) => partenaire.traceurs)) {
      if (!traceur.nom.endsWith("*")) noms.add(traceur.nom);
      else for (const present of presents) if (present.startsWith(traceur.nom.slice(0, -1))) noms.add(present);
    }
  }
  return [...noms].flatMap((nom) =>
    domaines.map((domaine) => `${nom}=; Max-Age=0; Path=/${domaine ? `; Domain=${domaine}` : ""}${chezNous ? "; Secure" : ""}`),
  );
}
