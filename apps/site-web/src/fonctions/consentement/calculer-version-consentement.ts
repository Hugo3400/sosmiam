import type { CategorieConsentement } from "~/contenus/cookies-consentement";
import { listerCategoriesAChoisir } from "~/fonctions/consentement/lister-categories-a-choisir";

/**
 * Version de la liste des partenaires, gardée avec le choix : une empreinte des catégories actives et du nom de leurs
 * partenaires. Une catégorie qui s'active, ou un partenaire de plus, la change : le bandeau revient. Une explication ou
 * une durée corrigée ne la change pas. Même calcul sur le serveur et dans le navigateur (FNV-1a, 32 bits, en base 36).
 */
export function calculerVersionConsentement(categories: CategorieConsentement[]): string {
  const signature = listerCategoriesAChoisir(categories)
    .map((categorie) => `${categorie.id}:${categorie.partenaires.map((partenaire) => partenaire.nom).sort().join(",")}`)
    .sort()
    .join("|");
  let empreinte = 0x811c9dc5;
  for (const caractere of signature) {
    empreinte ^= caractere.codePointAt(0) ?? 0;
    empreinte = Math.imul(empreinte, 0x01000193);
  }
  return (empreinte >>> 0).toString(36);
}
