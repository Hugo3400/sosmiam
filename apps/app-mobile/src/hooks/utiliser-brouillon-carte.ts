import { useCallback, useMemo, useRef, useState } from "react";

import type { CarteLieu, ElementCarte, SectionCarte } from "@sos-miam/commun/types/carte";

/** Déplace l'élément d'indice `de` d'un cran (−1 vers le haut, +1 vers le bas), sans sortir de la liste */
function deplacer<T>(liste: readonly T[], de: number, sens: -1 | 1): T[] {
  const vers = de + sens;
  if (de < 0 || de >= liste.length || vers < 0 || vers >= liste.length) return [...liste];
  const copie = [...liste];
  [copie[de], copie[vers]] = [copie[vers], copie[de]];
  return copie;
}

/** Remplace la section d'indice `index` par ce que renvoie `changer` */
function changerSection(sections: readonly SectionCarte[], index: number, changer: (s: SectionCarte) => SectionCarte): SectionCarte[] {
  return sections.map((s, i) => (i === index ? changer(s) : s));
}

export type BrouillonCarte = {
  carte: CarteLieu;
  /**
   * Clé React stable d'une section ou d'un élément : un déplacement garde la même (les lignes sont déplacées, pas recréées,
   * et VoiceOver garde sa place) ; une modification en donne une nouvelle.
   */
  cle: (objet: object) => string;
  /** Vrai dès qu'un changement n'est pas encore enregistré */
  modifiee: boolean;
  /** Repart d'une carte (relue ou tout juste enregistrée) : plus rien à enregistrer */
  repartirDe: (carte: CarteLieu) => void;
  ajouterSection: (titre: string) => void;
  renommerSection: (index: number, titre: string) => void;
  supprimerSection: (index: number) => void;
  deplacerSection: (index: number, sens: -1 | 1) => void;
  /** Ajoute l'élément à la fin de la section */
  ajouterElement: (section: number, element: ElementCarte) => void;
  /** Remplace l'élément ; s'il change de section, il passe à la fin de la nouvelle */
  modifierElement: (section: number, index: number, element: ElementCarte, nouvelleSection: number) => void;
  supprimerElement: (section: number, index: number) => void;
  deplacerElement: (section: number, index: number, sens: -1 | 1) => void;
};

/**
 * La carte telle que le gérant la modifie, avant de l'enregistrer : sections et éléments à ajouter, modifier, retirer
 * ou ranger. Rien ne part tant qu'il n'a pas touché « Enregistrer » ; `modifiee` dit s'il reste quelque chose à enregistrer.
 */
export function utiliserBrouillonCarte(initiale: CarteLieu): BrouillonCarte {
  const [carte, setCarte] = useState<CarteLieu>(initiale);
  const [modifiee, setModifiee] = useState(false);
  // Les objets ne changent pas quand on les déplace : on les numérote une fois, sans rien ajouter à la carte envoyée
  const numeros = useRef(new WeakMap<object, number>());
  const suivant = useRef(0);
  const cle = useCallback((objet: object) => {
    let n = numeros.current.get(objet);
    if (n === undefined) {
      n = ++suivant.current;
      numeros.current.set(objet, n);
    }
    return String(n);
  }, []);

  const changer = useCallback((fn: (sections: SectionCarte[]) => SectionCarte[]) => {
    setCarte((c) => ({ ...c, sections: fn(c.sections) }));
    setModifiee(true);
  }, []);

  const repartirDe = useCallback((c: CarteLieu) => {
    setCarte(c);
    setModifiee(false);
  }, []);

  const actions = useMemo(
    () => ({
      ajouterSection: (titre: string) => changer((s) => [...s, { titre, elements: [] }]),
      renommerSection: (index: number, titre: string) => changer((s) => changerSection(s, index, (x) => ({ ...x, titre }))),
      supprimerSection: (index: number) => changer((s) => s.filter((_, i) => i !== index)),
      deplacerSection: (index: number, sens: -1 | 1) => changer((s) => deplacer(s, index, sens)),
      ajouterElement: (section: number, element: ElementCarte) => changer((s) => changerSection(s, section, (x) => ({ ...x, elements: [...x.elements, element] }))),
      modifierElement: (section: number, index: number, element: ElementCarte, nouvelleSection: number) =>
        changer((s) => {
          if (nouvelleSection === section) return changerSection(s, section, (x) => ({ ...x, elements: x.elements.map((e, i) => (i === index ? element : e)) }));
          const sans = changerSection(s, section, (x) => ({ ...x, elements: x.elements.filter((_, i) => i !== index) }));
          return changerSection(sans, nouvelleSection, (x) => ({ ...x, elements: [...x.elements, element] }));
        }),
      supprimerElement: (section: number, index: number) => changer((s) => changerSection(s, section, (x) => ({ ...x, elements: x.elements.filter((_, i) => i !== index) }))),
      deplacerElement: (section: number, index: number, sens: -1 | 1) => changer((s) => changerSection(s, section, (x) => ({ ...x, elements: deplacer(x.elements, index, sens) }))),
    }),
    [changer],
  );

  return { carte, modifiee, cle, repartirDe, ...actions };
}
