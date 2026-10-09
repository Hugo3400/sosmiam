// Quel espace sert les pages du compte (/connexion, /inscription…) : pro.sosmiam.fr ou ambassadeur.sosmiam.fr.
import { HOTE_PRO } from "~/fonctions/hotes/choisir-redirection-hote";

export type EspaceCompte = "pro" | "ambassadeur";

/**
 * L'espace d'un hôte : « pro » sur pro.sosmiam.fr (et sur pro.localhost, pour essayer l'espace pro en développement),
 * « ambassadeur » partout ailleurs (ambassadeur.sosmiam.fr, l'aperçu, 127.0.0.1).
 */
export function lireEspaceHote(hote: string): EspaceCompte {
  const nomHote = hote.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  return nomHote === HOTE_PRO || nomHote === "pro.localhost" ? "pro" : "ambassadeur";
}
