// Les écritures refusées par l'API parce que le compte est limité (403 « compte-limite », details.jusqua) : le client HTTP de
// la session les voit passer (observerCompteLimite, branché dans FournisseurSession) et les transmet ici, à l'annonce de toute
// l'app (AnnonceCompteLimite). En mémoire seulement, rien sur le disque ; les écrans gardent leur réponse telle quelle.

/** `jusqua` : la fin en ISO, ou null (jusqu'à nouvel ordre, ou date absente) */
type Ecouteur = (jusqua: string | null) => void;

const ecouteurs = new Set<Ecouteur>();

/** Une écriture vient d'être refusée : prévient ceux qui écoutent (une erreur chez l'un ne gêne ni les autres ni l'écran) */
export function signalerCompteLimite(jusqua: string | null): void {
  for (const ecouteur of [...ecouteurs]) {
    try {
      ecouteur(jusqua);
    } catch {
      // L'écran qui a écrit attend sa réponse : rien ne doit remonter jusqu'à lui
    }
  }
}

/** Écoute les refus « compte-limite » ; rend de quoi ne plus écouter */
export function ecouterCompteLimite(ecouteur: Ecouteur): () => void {
  ecouteurs.add(ecouteur);
  return () => {
    ecouteurs.delete(ecouteur);
  };
}
