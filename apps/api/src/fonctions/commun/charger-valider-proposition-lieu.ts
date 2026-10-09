// Charge validerPropositionLieu de packages/commun telle quelle (jamais recopiée). Le filtre des gros mots qu'elle utilise
// (packages/commun/src/validation/contient-mot-interdit.ts et ses voisins) s'importe encore sans extension
// (« ../regles/mots-interdits »), ce que Node refuse pour des .ts lancés tels quels : un petit crochet de résolution
// ajoute « .ts » à ces imports-là, seulement pour les fichiers de packages/commun/src. Le jour où packages/commun écrit
// ses imports avec « .ts » partout, le crochet ne sert plus à rien et cette fonction peut devenir un simple import.
// Import dynamique par une adresse calculée : tsc (moduleResolution NodeNext) ne suit pas ces fichiers, qu'il refuserait.
import { registerHooks } from "node:module";

import type { NouvelleSuggestionLieu } from "../../../../../packages/commun/src/types/proposition-lieu.ts";

/** Même forme que ResultatPropositionLieu de packages/commun (validation/valider-proposition-lieu.ts) */
export type ResultatPropositionLieu =
  | { ok: true; suggestion: NouvelleSuggestionLieu }
  | { ok: false; erreur: "proposition-invalide"; champ: string };
export type ValiderPropositionLieu = (brut: unknown) => ResultatPropositionLieu;

const DOSSIER_COMMUN = new URL("../../../../../packages/commun/src/", import.meta.url).href;
const MODULE = new URL("validation/valider-proposition-lieu.ts", DOSSIER_COMMUN).href;
let chargement: Promise<ValiderPropositionLieu> | null = null;

/** La fonction de packages/commun, chargée une seule fois (le crochet n'est posé qu'au premier appel). */
export function chargerValiderPropositionLieu(): Promise<ValiderPropositionLieu> {
  chargement ??= (async () => {
    registerHooks({
      resolve(specifier, context, nextResolve) {
        const sansExtension = specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier);
        if (sansExtension && context.parentURL?.startsWith(DOSSIER_COMMUN)) {
          try {
            return nextResolve(`${specifier}.ts`, context);
          } catch {
            // Pas de .ts à côté : résolution normale (et son erreur, s'il y en a une)
          }
        }
        return nextResolve(specifier, context);
      },
    });
    const module = (await import(MODULE)) as { validerPropositionLieu: ValiderPropositionLieu };
    return module.validerPropositionLieu;
  })();
  return chargement;
}
