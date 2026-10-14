import type { VisibiliteListe } from "../../types/listes.ts";
import type { NiveauProfil } from "../../types/social.ts";

/**
 * Vrai si tu peux voir une liste, d'après ton niveau sur son auteur (calculerNiveauProfil, « bande » pour toi-même) :
 * co-auteur accepté, toujours ; liste « bande » : seulement sa bande (et lui) ; liste « tous » : à partir du niveau
 * « public » (tout le monde pour un compte public, abonnés et bande pour un compte privé). Les blocages, la modération et
 * ce que tu as signalé se vérifient à part.
 */
export function peutVoirListe(liste: { visibilite: VisibiliteListe }, niveau: NiveauProfil, coAuteur: boolean): boolean {
  if (coAuteur) return true;
  if (liste.visibilite === "bande") return niveau === "bande";
  return niveau !== "prive";
}
