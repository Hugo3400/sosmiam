// Forme des pages légales (mentions légales, confidentialité, cookies, CGU).
import type { BlocTexte } from "~/contenus/type-bloc-texte";

export type SectionLegale = {
  /** Sert au sommaire : lien vers la section */
  id: string;
  titre: string;
  blocs: BlocTexte[];
};

export type DocumentLegal = {
  titre: string;
  /** Description pour les moteurs de recherche */
  description: string;
  /** Date de dernière mise à jour, en toutes lettres : « 8 octobre 2026 » */
  miseAJour: string;
  introduction: BlocTexte[];
  sections: SectionLegale[];
};
