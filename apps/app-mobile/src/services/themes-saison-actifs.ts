import { enregistrerThemesSaisonActifs, lireThemesSaisonActifs } from "~/stockage/themes-saison";

let actifs = true;
let chargement: Promise<void> | null = null;
const ecouteurs = new Set<() => void>();

const prevenir = () => {
  for (const ecouter of ecouteurs) ecouter();
};

export const lireThemesSaisonActifsEnMemoire = (): boolean => actifs;

export function ecouterThemesSaisonActifs(ecouter: () => void): () => void {
  ecouteurs.add(ecouter);
  return () => void ecouteurs.delete(ecouter);
}

export function chargerThemesSaisonActifs(): Promise<void> {
  chargement ??= lireThemesSaisonActifs().then((lu) => {
    actifs = lu;
    prevenir();
  });
  return chargement;
}

export function changerThemesSaisonActifs(valeur: boolean): void {
  actifs = valeur;
  prevenir();
  void enregistrerThemesSaisonActifs(valeur);
}
