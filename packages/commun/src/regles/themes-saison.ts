import type { TypeLieu } from "../types/lieu.ts";

export const IDS_THEMES_SAISON = [
  "octobre-rose",
  "halloween",
  "movember",
  "tests-novembre",
  "soir-de-match",
  "noel",
  "nouvel-an",
  "galette",
  "janvier-tout-doux",
  "chandeleur",
  "six-nations",
  "saint-valentin",
  "paques",
  "poisson-d-avril",
  "pasta-party",
  "eurovision",
  "roland-garros",
  "finale-top-14",
  "fete-de-la-musique",
  "ete-des-bleues",
  "quatorze-juillet",
  "plein-ete",
  "jour-du-pirate",
  "jours-feries",
  "brunchs-d-ovalie",
] as const;
export type IdThemeSaison = (typeof IDS_THEMES_SAISON)[number];

export const FAMILLES_THEME_SAISON = ["fete", "cause", "sport", "gourmand", "clin-d-oeil"] as const;
export type FamilleThemeSaison = (typeof FAMILLES_THEME_SAISON)[number];

export const TENUES_CAPITAINE = [
  "noel",
  "nouvel-an",
  "galette",
  "janvier",
  "chandeleur",
  "saint-valentin",
  "paques",
  "poisson-d-avril",
  "musique",
  "quatorze-juillet",
  "ete",
  "halloween",
  "movember",
  "octobre-rose",
  "supporter",
  "rugby",
  "miam",
  "clin-d-oeil",
  "fete",
] as const;
export type TenueCapitaine = (typeof TENUES_CAPITAINE)[number];

export type CouleursThemeSaison = {
  readonly fond: string;
  readonly texte: string;
  readonly accent: string;
  readonly surAccent: string;
};

export type PeriodeThemeSaison = { readonly debut: string; readonly fin: string };

export type SelectionThemeSaison = { readonly types: readonly TypeLieu[]; readonly mots: readonly string[] };

export type ThemeSaison = {
  readonly id: IdThemeSaison;
  readonly famille: FamilleThemeSaison;
  readonly tenue: TenueCapitaine;
  readonly priorite: 1 | 2 | 3;
  readonly couleurs: CouleursThemeSaison;
  readonly couleursSombres?: CouleursThemeSaison;
  readonly sobre?: true;
  readonly villes?: readonly string[];
  readonly selection: SelectionThemeSaison;
  readonly periodes: readonly PeriodeThemeSaison[];
};

export type ThemeDuJour = { readonly theme: ThemeSaison; readonly periode: PeriodeThemeSaison };
