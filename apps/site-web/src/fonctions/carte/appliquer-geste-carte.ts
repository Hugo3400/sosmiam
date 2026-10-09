import { LIMITES_CARTE } from "../../../../../packages/commun/src/regles/carte-du-lieu.ts";
import type { BrouillonCarte, BrouillonSection, FocusCarte } from "../../types/carte.ts";
import { PLAT_VIDE } from "./creer-brouillon-carte.ts";
import { nommerBoutonCarte } from "./nommer-bouton-carte.ts";
import { nommerChampCarte } from "./nommer-champ-carte.ts";

export type ResultatGesteCarte = {
  brouillon: BrouillonCarte;
  /** Où mettre le focus ensuite (le nouveau champ, ou le même bouton à sa nouvelle place) */
  focus: FocusCarte;
  /** Ce qui vient de se passer, lu par les lecteurs d'écran (rien n'est encore enregistré) */
  message: string;
  /** Faux si le geste n'a rien fait (inconnu, hors limites) */
  fait: boolean;
};

const GESTE = /^(ajouter-section|ajouter-plat|supprimer-section|supprimer-plat|monter-section|descendre-section|monter-plat|descendre-plat)(?::(\d{1,3}))?(?::(\d{1,3}))?$/;

/** Échange deux cases d'une liste (copie) */
function echanger<T>(liste: T[], a: number, b: number): T[] {
  const copie = [...liste];
  [copie[a], copie[b]] = [copie[b] as T, copie[a] as T];
  return copie;
}

/**
 * Un bouton de l'éditeur de carte (« Ajouter une section », « Ajouter un plat », « Supprimer », « Monter »,
 * « Descendre ») appliqué au brouillon : la même logique avec et sans JavaScript, côté serveur (action de la page).
 * Rien n'est enregistré. Geste : « ajouter-plat:1 », « monter-plat:1:3 »… (numéros à partir de 0).
 */
export function appliquerGesteCarte(depart: BrouillonCarte, geste: string): ResultatGesteCarte {
  const sections: BrouillonSection[] = depart.sections.map((s) => ({ ...s, elements: [...s.elements] }));
  const rien: ResultatGesteCarte = { brouillon: { sections }, focus: null, message: "", fait: false };
  const morceaux = GESTE.exec(geste);
  if (!morceaux) return rien;
  const [, action, texteI, texteJ] = morceaux;
  const i = texteI === undefined ? -1 : Number(texteI);
  const j = texteJ === undefined ? -1 : Number(texteJ);
  const total = sections.reduce((somme, s) => somme + s.elements.length, 0);
  const fait = (focus: FocusCarte, message: string): ResultatGesteCarte => ({ brouillon: { sections }, focus, message, fait: true });
  const focusBouton = (unGeste: string): FocusCarte => ({ bouton: nommerBoutonCarte(unGeste) });

  if (action === "ajouter-section") {
    if (sections.length >= LIMITES_CARTE.sections) return { ...rien, message: `Une carte a ${LIMITES_CARTE.sections} sections au plus.` };
    sections.push({ titre: "", elements: [{ ...PLAT_VIDE, etiquettes: [] }] });
    return fait({ champ: nommerChampCarte(sections.length - 1, "titre") }, "Nouvelle section ajoutée, avec un premier plat à remplir.");
  }
  const section = sections[i];
  if (!section) return rien;

  if (action === "ajouter-plat") {
    if (section.elements.length >= LIMITES_CARTE.elementsParSection) return { ...rien, message: `Une section a ${LIMITES_CARTE.elementsParSection} plats au plus.` };
    if (total >= LIMITES_CARTE.elements) return { ...rien, message: `Une carte a ${LIMITES_CARTE.elements} plats au plus.` };
    section.elements.push({ ...PLAT_VIDE, etiquettes: [] });
    return fait({ champ: nommerChampCarte(i, "nom", section.elements.length - 1) }, "Nouveau plat ajouté.");
  }
  if (action === "supprimer-section") {
    sections.splice(i, 1);
    const voisine = Math.min(i, sections.length - 1);
    return fait(voisine >= 0 ? { champ: nommerChampCarte(voisine, "titre") } : focusBouton("ajouter-section"), "Section retirée.");
  }
  if (action === "monter-section" || action === "descendre-section") {
    const cible = action === "monter-section" ? i - 1 : i + 1;
    if (cible < 0 || cible >= sections.length) return rien;
    sections.splice(0, sections.length, ...echanger(sections, i, cible));
    // Le même bouton à la nouvelle place, sinon l'autre (tout en haut, plus de « Monter »)
    const bout = cible === 0 ? "descendre-section" : cible === sections.length - 1 ? "monter-section" : action;
    return fait(sections.length > 1 ? focusBouton(`${bout}:${cible}`) : { champ: nommerChampCarte(cible, "titre") }, action === "monter-section" ? "Section montée." : "Section descendue.");
  }

  if (!section.elements[j]) return rien;
  if (action === "supprimer-plat") {
    section.elements.splice(j, 1);
    const voisin = Math.min(j, section.elements.length - 1);
    return fait(voisin >= 0 ? { champ: nommerChampCarte(i, "nom", voisin) } : focusBouton(`ajouter-plat:${i}`), "Plat retiré.");
  }
  const cible = action === "monter-plat" ? j - 1 : j + 1;
  if (cible < 0 || cible >= section.elements.length) return rien;
  section.elements = echanger(section.elements, j, cible);
  const bout = cible === 0 ? "descendre-plat" : cible === section.elements.length - 1 ? "monter-plat" : action;
  return fait(focusBouton(`${bout}:${i}:${cible}`), action === "monter-plat" ? "Plat monté." : "Plat descendu.");
}
