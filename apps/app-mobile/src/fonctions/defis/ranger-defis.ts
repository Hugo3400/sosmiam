import type { DefiAffiche } from "~/contenus/type-defi-affiche";

/** 0 : ceux qui avancent ; 1 : ceux qui attendent (pas commencés, ou pas comptés) ; 2 : les réussis */
const lireRang = (defi: DefiAffiche) => (defi.etat === "reussi" ? 2 : defi.etat === "a-venir" || defi.attente !== null ? 1 : 0);

/**
 * Les défis dans l'ordre du profil : ceux qui avancent d'abord, puis ceux qui attendent, puis les réussis ; dans chaque
 * groupe, l'ordre reçu (celui choisi dans le logiciel de gestion). Un défi fini sans être réussi n'est jamais montré.
 */
export function rangerDefis(defis: DefiAffiche[]): DefiAffiche[] {
  return defis
    .filter((d) => d.etat !== "termine")
    .map((defi, i) => ({ defi, i }))
    .sort((a, b) => lireRang(a.defi) - lireRang(b.defi) || a.i - b.i)
    .map(({ defi }) => defi);
}
