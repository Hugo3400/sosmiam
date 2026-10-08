import type { CleClientDemo, ClientDemo, MagasinDemo } from "./types-demo";

/** « moi » quand le profil n'est pas connu : par prudence, traité comme un 15-17 ans (jamais d'alcool) */
const MOI_INCONNU: ClientDemo = { cle: "moi", prenom: "Toi", initialeNom: null, avatar: "🙂", majeur: false };

/**
 * Le client d'une visite, d'une carte ou d'une réservation de démo : un figurant du magasin, ou « moi » (fourni par
 * lireClient). Un client introuvable est traité avec prudence, comme un 15-17 ans.
 */
export function trouverClientDemo(m: Readonly<MagasinDemo>, cle: CleClientDemo, moi: ClientDemo | null): ClientDemo {
  if (cle === "moi") return moi ?? MOI_INCONNU;
  return m.figurants.find((f) => f.cle === cle) ?? { ...MOI_INCONNU, cle, prenom: "Quelqu'un" };
}
