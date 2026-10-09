import type { NouvelAvisNonVerifie } from "../types/avis.ts";
import type { ErreurService } from "../types/erreurs-service.ts";
import { validerAvis } from "./valider-avis.ts";

/**
 * Vérifie un avis « non vérifié » avant l'envoi (téléphone, puis API) : un identifiant de lieu entier et positif, puis le
 * même contenu qu'un avis vérifié (note de 1 à 5, texte de 10 à 1000 caractères sans insulte, photo facultative). Rend
 * « avis-invalide » ou null. Le droit de le donner (lieu non vérifié, un tous les 30 jours) est vérifié par le service.
 */
export function validerAvisNonVerifie(a: NouvelAvisNonVerifie): ErreurService | null {
  const { lieuId, note, texte, photo } = a as Partial<Record<keyof NouvelAvisNonVerifie, unknown>>;
  if (typeof lieuId !== "number" || !Number.isInteger(lieuId) || lieuId < 1) return "avis-invalide";
  // Pas de visite derrière : l'identifiant ne sert qu'à réutiliser la vérification du contenu
  return validerAvis({ visiteId: lieuId, note, texte, photo } as NouvelAvisNonVerifie & { visiteId: number });
}
