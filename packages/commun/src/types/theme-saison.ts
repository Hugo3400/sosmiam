import type { TextesThemeSaison } from "../contenus/themes-saison.ts";
import type { CouleursThemeSaison, FamilleThemeSaison, IdThemeSaison, LienInfoThemeSaison, TenueCapitaine } from "../regles/themes-saison.ts";

export type ThemeSaisonApi = {
  readonly id: IdThemeSaison;
  readonly famille: FamilleThemeSaison;
  readonly tenue: TenueCapitaine;
  readonly couleurs: CouleursThemeSaison;
  readonly couleursSombres: CouleursThemeSaison;
  readonly sobre: boolean;
  readonly lienInfo: LienInfoThemeSaison | null;
  readonly debut: string;
  readonly fin: string;
  readonly textes: TextesThemeSaison;
};
