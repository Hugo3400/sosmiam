import { ReglageGenre } from "~/composants/genre/ReglageGenre";
import { EcranMiamisFerme } from "~/composants/miamis/EcranMiamisFerme";
import { TEXTES_GENRE_PAR_LANGUE } from "~/contenus/textes-genre";
import { utiliserAccesMiamis } from "~/hooks/utiliser-acces-miamis";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export default function Genre() {
  const acces = utiliserAccesMiamis();
  const T = utiliserTextes(TEXTES_GENRE_PAR_LANGUE);
  if (!acces.ouvert) return <EcranMiamisFerme raison={acces.raison} titre={T.titre} retourSansHistorique="/reglages/profil" />;
  return <ReglageGenre />;
}
