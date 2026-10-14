import { resumerErreur } from "../comptes/resumer-erreur.ts";

type AjouterPoints<R extends string, T> = (compteId: number, points: number, raison: R, detail?: string) => Promise<T>;

/**
 * Emballe ajouterPoints (services/comptes.ts) pour les autres domaines (rescousses, visites, avis, logiciel de gestion) :
 * après chaque ajout d'une autre raison que « defi », l'avancée des défis et des badges du compte est recomptée, SANS
 * l'attendre (la réponse part tout de suite) et sans jamais faire échouer l'ajout : une erreur est seulement journalisée,
 * résumée, sans donnée personnelle ni numéro de compte. Les points des défis eux-mêmes passent par ajouterPointsDans,
 * dans la transaction de la réévaluation (jamais par celui-ci) : une réévaluation n'en relance pas une autre.
 */
export function brancherReevaluationDefis<R extends string, T>(
  ajouterPoints: AjouterPoints<R, T>,
  reevaluer: (compteId: number, maintenant: Date) => Promise<unknown>,
  horloge: () => number = Date.now,
): AjouterPoints<R, T> {
  return async (compteId, points, raison, detail) => {
    const resultat = await ajouterPoints(compteId, points, raison, detail);
    if (raison !== "defi") {
      try {
        reevaluer(compteId, new Date(horloge())).catch((erreur: unknown) => console.error("Défis : réévaluation impossible :", resumerErreur(erreur)));
      } catch (erreur) {
        console.error("Défis : réévaluation impossible :", resumerErreur(erreur));
      }
    }
    return resultat;
  };
}
