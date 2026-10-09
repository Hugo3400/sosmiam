import { validerCarteDuLieu } from "../../../../../packages/commun/src/validation/valider-carte-du-lieu.ts";
import { validerElementCarte } from "../../../../../packages/commun/src/validation/valider-element-carte.ts";
import { ERREURS_CARTE } from "../../contenus/carte-du-lieu.ts";
import type { BrouillonCarte, CarteLieu } from "../../types/carte.ts";
import { lirePrixSaisi } from "./lire-prix-saisi.ts";
import { nommerChampCarte } from "./nommer-champ-carte.ts";

export type CarteConvertie =
  | { ok: true; carte: CarteLieu | null }
  | {
      ok: false;
      /** Le message de chaque champ à corriger, par nom de champ, dans l'ordre du formulaire (le premier prend le focus) */
      erreurs: Record<string, string>;
      /** Ce qui touche toute la carte (trop de sections, trop de plats), ou null */
      message: string | null;
    };

/**
 * Le brouillon de l'éditeur changé en carte à envoyer (prix « 12,50 » → 12.5), vérifié par la fonction commune
 * (validerElementCarte et validerCarteDuLieu de packages/commun, les mêmes que l'API et l'app) : TOUS les champs en faute
 * d'un coup, pas seulement le premier. Une carte sans section devient null (la carte est effacée).
 */
export function convertirBrouillonEnCarte(brouillon: BrouillonCarte): CarteConvertie {
  const erreurs: Record<string, string> = {};
  const sections = brouillon.sections.map((section, i) => {
    const titre = section.titre.trim();
    // Le titre seul : validerCarteDuLieu le vérifie avec une section sans plat
    const seul = validerCarteDuLieu({ sections: [{ titre, elements: [] }] });
    if (!seul.ok && seul.champ === "titre") erreurs[nommerChampCarte(i, "titre")] = ERREURS_CARTE.titre;
    const elements = section.elements.map((element, j) => {
      const prix = lirePrixSaisi(element.prix);
      const brut = {
        nom: element.nom, description: element.description, prix: prix ?? Number.NaN, unite: element.unite,
        ...(element.signature ? { signature: true } : {}), ...(element.alcool ? { alcool: true } : {}),
        ...(element.etiquettes.length > 0 ? { etiquettes: element.etiquettes } : {}),
      };
      // Chaque champ à son tour, pour les signaler tous : on remplace ceux déjà vus par une valeur sûre
      const sur = { nom: "Plat", prix: 0 };
      for (const champ of ["nom", "prix", "unite", "description", "etiquettes"] as const) {
        const essai = validerElementCarte({ ...sur, [champ]: brut[champ as keyof typeof brut] });
        if (!essai.ok) {
          const message = champ === "prix" && element.prix.trim() === "" ? ERREURS_CARTE.prixVide : ERREURS_CARTE[essai.champ];
          erreurs[nommerChampCarte(i, essai.champ === "autre" ? "nom" : champ, j)] = message;
        }
      }
      return brut;
    });
    return { titre, elements };
  });
  if (Object.keys(erreurs).length > 0) return { ok: false, erreurs, message: null };
  if (sections.length === 0) return { ok: true, carte: null };

  // Tout le reste (nombre de sections et de plats, forme) : la vérification complète, celle de l'API
  const verifiee = validerCarteDuLieu({ sections });
  if (verifiee.ok) return { ok: true, carte: verifiee.carte };
  const { champ, section, element } = verifiee;
  if (champ === "trop-de-sections" || champ === "trop-d-elements") return { ok: false, erreurs: {}, message: ERREURS_CARTE[champ] };
  const nom = section === null ? null : element === null ? nommerChampCarte(section, "titre") : nommerChampCarte(section, champ === "autre" ? "nom" : champ, element);
  return nom ? { ok: false, erreurs: { [nom]: ERREURS_CARTE[champ] }, message: null } : { ok: false, erreurs: {}, message: ERREURS_CARTE.autre };
}
