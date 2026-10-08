import type { PublicationSaisie } from "../../services/gestion/publications.ts";
import { ChampInvalide, lireChoix, lireNombre, lireTexte } from "./lire-champs.ts";

/** Lit et vérifie une publication envoyée par le logiciel. Lève ChampInvalide sur le premier champ qui ne va pas. */
export function lirePublicationSaisie(corps: Record<string, unknown>, maintenant = new Date()): PublicationSaisie {
  const lieuId = lireNombre(corps, "lieuId", 1, 1e9);
  if (lieuId === null) throw new ChampInvalide("lieuId");
  const auteurType = lireChoix(corps, "auteurType", ["lieu", "createur"] as const);
  const statut = lireChoix(corps, "statut", ["brouillon", "publiee", "masquee"] as const);
  let publieeLe: Date | null = null;
  if (typeof corps.publieeLe === "string" && corps.publieeLe) {
    publieeLe = new Date(corps.publieeLe);
    if (Number.isNaN(publieeLe.getTime())) throw new ChampInvalide("publieeLe");
  }
  // Publiée sans date : maintenant. Une date à venir la programme.
  if (statut === "publiee" && !publieeLe) publieeLe = maintenant;
  return {
    lieuId,
    auteurType,
    // Le pseudo du créateur est obligatoire ; un lieu qui publie lui-même n'a ni pseudo ni partenariat
    auteurPseudo: auteurType === "createur" ? lireTexte(corps, "auteurPseudo", 40, true).replace(/^@/, "") : null,
    partenariat: auteurType === "createur" ? lireTexte(corps, "partenariat", 120) : null,
    legende: lireTexte(corps, "legende", 500, true),
    illustration: corps.illustration === true,
    statut,
    publieeLe,
  };
}
