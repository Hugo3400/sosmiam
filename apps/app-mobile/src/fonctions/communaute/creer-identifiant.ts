/** Un identifiant unique sur ce téléphone, lisible (« sortie-lz3k9-4f2a ») ; l'API donnera les siens plus tard. */
export function creerIdentifiant(prefixe: string): string {
  return `${prefixe}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
