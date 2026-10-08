import type { NouvelAvis } from "../types/avis.ts";
import type { ErreurService } from "../types/erreurs-service.ts";
import { TEXTE_AVIS_MAX, TEXTE_AVIS_MIN } from "../regles/avis.ts";
import { contientMotInterdit } from "./contient-mot-interdit.ts";

/**
 * Vérifie un avis avant l'envoi (téléphone, puis API) : note entière de 1 à 5, texte de 10 à 1000 caractères (espaces
 * autour retirés) et sans insulte. Un avis critique passe : on filtre les insultes, pas les opinions. Rend
 * « avis-invalide » ou null. Le droit de donner son avis (visite validée, fenêtre ouverte, un seul) est vérifié par le service.
 */
export function validerAvis(a: NouvelAvis): ErreurService | null {
  const { visiteId, note, texte, photo } = a as Partial<Record<keyof NouvelAvis, unknown>>;
  if (typeof visiteId !== "number" || !Number.isInteger(visiteId)) return "avis-invalide";
  if (typeof note !== "number" || !Number.isInteger(note) || note < 1 || note > 5) return "avis-invalide";
  if (photo !== null && typeof photo !== "string") return "avis-invalide";
  if (typeof texte !== "string") return "avis-invalide";
  const propre = texte.trim();
  if (propre.length < TEXTE_AVIS_MIN || propre.length > TEXTE_AVIS_MAX || contientMotInterdit(propre)) return "avis-invalide";
  return null;
}
