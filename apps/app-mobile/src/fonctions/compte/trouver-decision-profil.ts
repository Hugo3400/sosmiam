import type { DecisionModerationApi } from "@sos-miam/commun/types/signalement";

/** Les horloges du téléphone et du serveur ne sont jamais tout à fait d'accord */
const MARGE_HORLOGE_MS = 10 * 60_000;

/**
 * La décision de la modération qui a retenu TON profil (cible « profil », toi en auteur, « retenu ») prise depuis `depuis`
 * (millisecondes du téléphone, à 10 minutes près), la plus récente ; null s'il n'y en a pas. C'est elle qui remplace le
 * pseudo par un pseudo neutre.
 */
export function trouverDecisionProfil(decisions: readonly DecisionModerationApi[], depuis: number): DecisionModerationApi | null {
  let trouvee: DecisionModerationApi | null = null;
  for (const d of decisions) {
    if (d.cible !== "profil" || d.role !== "auteur" || d.statut !== "retenu" || !d.decideLe) continue;
    const le = Date.parse(d.decideLe);
    if (!(le >= depuis - MARGE_HORLOGE_MS)) continue;
    if (!trouvee || le > Date.parse(trouvee.decideLe ?? "")) trouvee = d;
  }
  return trouvee;
}
