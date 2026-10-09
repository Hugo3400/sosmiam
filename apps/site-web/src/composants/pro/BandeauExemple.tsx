/**
 * Bandeau des données d'exemple : affiché seulement par le serveur de développement, quand l'API n'a pas encore les
 * routes de l'espace pro (services/pro.server.ts). En ligne, il n'y a jamais de données d'exemple.
 */
export function BandeauExemple() {
  return (
    <p role="note" className="border-y-2 border-dashed border-encre bg-jaune-clair px-4 py-2 text-center text-sm font-semibold print:hidden">
      <span aria-hidden="true">🧪 </span>Données d'exemple (serveur de développement) : l'API de l'espace pro n'est pas encore branchée.
    </p>
  );
}
