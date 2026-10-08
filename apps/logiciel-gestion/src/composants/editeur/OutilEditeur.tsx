import type { LucideIcon } from "lucide-react";

/** Un bouton de la barre d'outils de l'éditeur : icône, nom au survol, enfoncé quand la mise en forme est active. */
export function OutilEditeur({ icone: Icone, titre, actif = false, desactive = false, onClick }: { icone: LucideIcon; titre: string; actif?: boolean; desactive?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      title={titre}
      aria-label={titre}
      aria-pressed={actif}
      disabled={desactive}
      // Garder la sélection du texte : le bouton ne prend pas le focus au clic
      onMouseDown={(evenement) => evenement.preventDefault()}
      onClick={onClick}
      className={`grid size-8 place-items-center rounded-lg transition-colors disabled:opacity-35 ${actif ? "bg-nuit text-jaune" : "text-encre hover:bg-jaune-clair"}`}
    >
      <Icone className="size-4" aria-hidden />
    </button>
  );
}
