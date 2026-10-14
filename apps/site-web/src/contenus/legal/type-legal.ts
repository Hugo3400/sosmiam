// Forme des pages légales (mentions légales, confidentialité, cookies, CGU, âge, accessibilité, prévention, statistiques).
// Une page = un « En bref », une introduction, des sections (le texte), regroupées en chapitres numérotés pour le sommaire.
// Les `id` des sections sont des ancres publiques (liens du site, de l'app, des mails) : ne jamais les renommer.
import type { BlocTexte } from "~/contenus/type-bloc-texte";

export type SectionLegale = {
  /** Ancre de la section (« /confidentialite#statistiques ») : stable, ne jamais la renommer */
  id: string;
  titre: string;
  blocs: BlocTexte[];
};

/** Un chapitre du sommaire : il regroupe des sections, dans l'ordre où il les cite. */
export type ChapitreLegal = {
  /** Ancre du chapitre, différente de celles des sections */
  id: string;
  titre: string;
  /** `id` des sections du chapitre ; chaque section de la page est dans un seul chapitre, dans l'ordre de la page */
  sections: string[];
};

export type DocumentLegal = {
  titre: string;
  /** Description pour les moteurs de recherche */
  description: string;
  /** Date de dernière mise à jour, en toutes lettres : « 8 octobre 2026 » */
  miseAJour: string;
  introduction: BlocTexte[];
  /** L'essentiel en quelques lignes, affiché dans un encadré avant le sommaire (ancre « en-bref ») */
  enBref: BlocTexte[];
  sections: SectionLegale[];
  chapitres: ChapitreLegal[];
};
