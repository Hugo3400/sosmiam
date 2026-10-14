import type { CategorieFacultative } from "~/contenus/cookies-consentement";
import type { ChoixConsentement, ReponsesConsentement } from "~/types/consentement";

/**
 * Les réponses envoyées par le bandeau, le panneau « Choisir », le formulaire de /cookies#mes-choix ou une vignette de
 * ContenuExterne (avec ou sans JavaScript). Le bouton envoie « geste » :
 * - « tout-accepter » / « tout-refuser » : toutes les catégories à choisir ;
 * - « fermer » (la croix) : vaut refus pour ce qui n'a pas encore de réponse, garde le reste ;
 * - « accepter-categorie » (« Toujours afficher les vidéos ») : accepte la catégorie envoyée, garde le reste ;
 * - « enregistrer » (ou rien) : les interrupteurs cochés (« accepter ») sont acceptés, les autres refusés.
 * Seules les catégories à choisir comptent : le reste est ignoré.
 */
export function lireFormulaireConsentement(
  formulaire: FormData,
  aChoisir: CategorieFacultative[],
  actuel: ChoixConsentement | null,
): ReponsesConsentement {
  const geste = formulaire.get("geste");
  const coches = formulaire.getAll("accepter");
  const reponses: ReponsesConsentement = {};
  for (const { id } of aChoisir) {
    const avant = actuel?.reponses[id];
    if (geste === "tout-accepter") reponses[id] = true;
    else if (geste === "tout-refuser") reponses[id] = false;
    else if (geste === "fermer") reponses[id] = avant ?? false;
    else if (geste === "accepter-categorie") {
      if (formulaire.get("categorie") === id) reponses[id] = true;
      else if (avant !== undefined) reponses[id] = avant;
    } else reponses[id] = coches.includes(id);
  }
  return reponses;
}
