import type { TextesThemeSaison } from "../../../../../packages/commun/src/contenus/themes-saison.ts";
import {
  FAMILLES_THEME_SAISON,
  IDS_THEMES_SAISON,
  TENUES_CAPITAINE,
  type CouleursThemeSaison,
} from "../../../../../packages/commun/src/regles/themes-saison.ts";
import type { ThemeSaisonApi } from "../../../../../packages/commun/src/types/theme-saison.ts";

const COULEUR = /^#[0-9A-Fa-f]{6}$/;
const JOUR = /^\d{4}-\d{2}-\d{2}$/;
const CHAMPS_TEXTES = ["nom", "etiquette", "titre", "texte", "bouton", "selection", "notification", "tenue"] as const satisfies readonly (keyof TextesThemeSaison)[];

const estObjet = (valeur: unknown): valeur is Record<string, unknown> => typeof valeur === "object" && valeur !== null && !Array.isArray(valeur);

const estParmi = <T extends string>(liste: readonly T[], valeur: unknown): valeur is T => typeof valeur === "string" && (liste as readonly string[]).includes(valeur);

const lireCouleur = (valeur: unknown) => (typeof valeur === "string" && COULEUR.test(valeur) ? valeur : null);

const lireJour = (valeur: unknown) => (typeof valeur === "string" && JOUR.test(valeur) ? valeur : null);

function lireCouleurs(brut: unknown): CouleursThemeSaison | null {
  if (!estObjet(brut)) return null;
  const fond = lireCouleur(brut.fond);
  const texte = lireCouleur(brut.texte);
  const accent = lireCouleur(brut.accent);
  const surAccent = lireCouleur(brut.surAccent);
  return fond && texte && accent && surAccent ? { fond, texte, accent, surAccent } : null;
}

function lireTextes(brut: unknown): TextesThemeSaison | null {
  if (!estObjet(brut)) return null;
  const textes: Record<string, string> = {};
  for (const champ of CHAMPS_TEXTES) {
    const valeur = brut[champ];
    if (typeof valeur !== "string" || valeur.trim() === "") return null;
    textes[champ] = valeur;
  }
  return textes as TextesThemeSaison;
}

export function lireThemeSaisonApi(brut: unknown): ThemeSaisonApi | null {
  if (!estObjet(brut)) return null;
  const { id, famille, tenue } = brut;
  const couleurs = lireCouleurs(brut.couleurs);
  const textes = lireTextes(brut.textes);
  const debut = lireJour(brut.debut);
  const fin = lireJour(brut.fin);
  if (!estParmi(IDS_THEMES_SAISON, id) || !estParmi(FAMILLES_THEME_SAISON, famille) || !estParmi(TENUES_CAPITAINE, tenue)) return null;
  if (!couleurs || !textes || !debut || !fin) return null;
  return { id, famille, tenue, couleurs, couleursSombres: lireCouleurs(brut.couleursSombres) ?? couleurs, sobre: brut.sobre === true, debut, fin, textes };
}
