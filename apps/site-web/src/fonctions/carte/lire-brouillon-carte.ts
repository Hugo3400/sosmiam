import { LIMITES_CARTE } from "../../../../../packages/commun/src/regles/carte-du-lieu.ts";
import type { BrouillonCarte, BrouillonElement, BrouillonSection } from "../../types/carte.ts";
import { PLAT_VIDE } from "./creer-brouillon-carte.ts";

const SECTION = /^sections\[(\d{1,3})\]\[titre\]$/;
const ELEMENT = /^sections\[(\d{1,3})\]\[elements\]\[(\d{1,3})\]\[(nom|description|prix|unite|signature|alcool|etiquettes)\]$/;
/** Longueur gardée d'un texte tapé : un peu plus que la limite, pour que l'erreur s'affiche au lieu d'un texte coupé */
const LONGUEUR_GARDEE = 400;

/**
 * Le brouillon de carte envoyé par l'éditeur (champs indexés « sections[0][elements][1][nom] ») : sections et plats dans
 * l'ordre de leurs numéros, textes tels quels (bornés), cases cochées à vrai. Jamais plus que LIMITES_CARTE (sections,
 * plats par section, plats en tout) : le surplus est ignoré. Rien n'est vérifié ici (convertirBrouillonEnCarte le fait).
 */
export function lireBrouillonCarte(formulaire: FormData): BrouillonCarte {
  const sections = new Map<number, { titre: string; elements: Map<number, BrouillonElement> }>();
  const section = (i: number) => {
    let trouvee = sections.get(i);
    if (!trouvee) sections.set(i, (trouvee = { titre: "", elements: new Map() }));
    return trouvee;
  };
  for (const [nom, brut] of formulaire.entries()) {
    if (typeof brut !== "string") continue;
    const valeur = brut.slice(0, LONGUEUR_GARDEE);
    const titre = SECTION.exec(nom);
    if (titre) {
      section(Number(titre[1])).titre = valeur;
      continue;
    }
    const morceaux = ELEMENT.exec(nom);
    if (!morceaux) continue;
    const elements = section(Number(morceaux[1])).elements;
    const j = Number(morceaux[2]);
    const element = elements.get(j) ?? { ...PLAT_VIDE, etiquettes: [] };
    elements.set(j, element);
    const champ = morceaux[3] as keyof BrouillonElement;
    if (champ === "signature" || champ === "alcool") element[champ] = true;
    else if (champ === "etiquettes") element.etiquettes.push(valeur);
    else element[champ] = valeur;
  }

  const rangees: BrouillonSection[] = [];
  let total = 0;
  for (const [, { titre, elements }] of [...sections.entries()].sort(([a], [b]) => a - b).slice(0, LIMITES_CARTE.sections)) {
    const gardes = [...elements.entries()].sort(([a], [b]) => a - b).map(([, element]) => element)
      .slice(0, Math.min(LIMITES_CARTE.elementsParSection, LIMITES_CARTE.elements - total));
    total += gardes.length;
    rangees.push({ titre, elements: gardes });
  }
  return { sections: rangees };
}
