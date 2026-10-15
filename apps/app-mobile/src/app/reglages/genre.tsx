import { ReglageGenre } from "~/composants/genre/ReglageGenre";
import { EcranMiamisFerme } from "~/composants/miamis/EcranMiamisFerme";
import { TEXTES_GENRE } from "~/contenus/textes-genre";
import { utiliserAccesMiamis } from "~/hooks/utiliser-acces-miamis";

export default function Genre() {
  const acces = utiliserAccesMiamis();
  if (!acces.ouvert) return <EcranMiamisFerme raison={acces.raison} titre={TEXTES_GENRE.titre} />;
  return <ReglageGenre />;
}
