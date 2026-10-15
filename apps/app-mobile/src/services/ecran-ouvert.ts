// L'écran ouvert en ce moment (son chemin, par exemple « /potes/discussion/12 »), gardé en mémoire seulement, jamais sur le
// disque. Noté par SuiviEcranOuvert (monté avec la pile d'écrans) et lu par les notifications : pas de bannière pour un
// message de la discussion que tu as déjà sous les yeux, et pas de deuxième discussion empilée sur la même. null : aucun
// écran n'est affiché (écran de démarrage).
let chemin: string | null = null;

export function noterEcranOuvert(nouveau: string | null): void {
  chemin = nouveau;
}

export function lireEcranOuvert(): string | null {
  return chemin;
}
