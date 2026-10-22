const numeros = new Map<string, number>();
const ecouteurs = new Set<() => void>();

export function lireNumeroPhotoGroupe(conversationId: string): number {
  return numeros.get(conversationId) ?? 0;
}

export function renouvelerPhotoGroupe(conversationId: string): void {
  numeros.set(conversationId, lireNumeroPhotoGroupe(conversationId) + 1);
  ecouteurs.forEach((ecouteur) => ecouteur());
}

export function ecouterPhotosGroupes(ecouteur: () => void): () => void {
  ecouteurs.add(ecouteur);
  return () => {
    ecouteurs.delete(ecouteur);
  };
}
