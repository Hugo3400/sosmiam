// Quel « Mon compte » sert une adresse : la même page (routes/compte/mon-compte.tsx) vit à trois endroits.
// Aucun import « ~/… » ici : le test (tests/mon-compte.test.ts) lance ce fichier directement avec Node.

/** « ambassadeur » : /espace/mon-compte ; « pro » : /mon-compte sur pro.sosmiam.fr ; « site » : /mon-compte ailleurs (sosmiam.fr). */
export type EspaceMonCompte = "ambassadeur" | "pro" | "site";

/**
 * L'espace d'une page « Mon compte », d'après l'espace de l'hôte (lireEspaceHote : « pro » sur pro.sosmiam.fr et
 * pro.localhost) et le chemin demandé (« .data » et « / » final compris). /mon-compte est la page de l'espace pro sur son
 * hôte, et celle du site principal partout ailleurs (sosmiam.fr, l'aperçu, 127.0.0.1) ; tout autre chemin est
 * /espace/mon-compte, la page de l'espace ambassadeur.
 */
export function lireEspaceMonCompte(espaceHote: "pro" | "ambassadeur", chemin: string): EspaceMonCompte {
  const page = chemin.replace(/\.data$/, "").replace(/\/+$/, "").toLowerCase();
  if (page !== "/mon-compte") return "ambassadeur";
  return espaceHote === "pro" ? "pro" : "site";
}
