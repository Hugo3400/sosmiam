import type { CleClientDemo, ClientDemo, MagasinDemo } from "./types-demo";

/** « moi » quand le profil n'est pas connu (effacé entre-temps) : un client sans nom */
const MOI_INCONNU: ClientDemo = { cle: "moi", prenom: "Toi", initialeNom: null, avatar: "🙂" };

/**
 * Le client d'une visite, d'une carte ou d'une réservation de démo : un figurant du magasin, ou « moi » (fourni par
 * lireClient). Un client introuvable devient « Quelqu'un », sans initiale.
 */
export function trouverClientDemo(m: Readonly<MagasinDemo>, cle: CleClientDemo, moi: ClientDemo | null): ClientDemo {
  if (cle === "moi") return moi ?? MOI_INCONNU;
  return m.figurants.find((f) => f.cle === cle) ?? { ...MOI_INCONNU, cle, prenom: "Quelqu'un" };
}
