import type { ResultatEffacementCloche } from "~/hooks/utiliser-notifications";

export function decrireEffacementCloche(resultat: ResultatEffacementCloche, portee: "une" | "lues"): string {
  if (resultat.ok) {
    if (portee === "une") return "🍃 Envolée ! Ta cloche respire.";
    const n = resultat.effacees;
    if (n === 0) return "✨ Rien à balayer : c'était déjà tout propre.";
    return n === 1 ? "🧹 Coup de balai ! 1 notification envolée." : `🧹 Coup de balai ! ${n} notifications envolées.`;
  }
  if (resultat.erreur === "hors-ligne") {
    return portee === "une" ? "📶 Pas de réseau : ta notification reste là. Réessaie tout à l'heure." : "📶 Pas de réseau : le balai attendra, rien n'a bougé.";
  }
  if (resultat.erreur === "trop-de-demandes") return "🐢 Doucement ! Réessaie dans quelques minutes.";
  return portee === "une"
    ? "😬 La cloche a fait de la résistance : ta notification est revenue. Réessaie dans un instant."
    : "😬 Le balai s'est coincé : rien n'a bougé. Réessaie dans un instant.";
}
