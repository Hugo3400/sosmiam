// Aucun import « ~/… » ici : les tests (tests/connexion-qr.test.ts) lancent ce fichier directement avec Node.
import type { EspaceConnexion } from "../../types/connexion-externe.ts";

const ORIGINES = { site: "sosmiam.fr", ambassadeur: "ambassadeur.sosmiam.fr", pro: "pro.sosmiam.fr" } as const;

/** L'origine montrée dans l'app (« Tu te connectes sur … ? ») : l'hôte de l'espace, jamais une IP. */
export function choisirOrigineQr(espace: EspaceConnexion): (typeof ORIGINES)[EspaceConnexion] {
  return ORIGINES[espace];
}
