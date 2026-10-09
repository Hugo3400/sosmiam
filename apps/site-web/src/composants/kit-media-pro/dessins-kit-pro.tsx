import type { ReactNode } from "react";

import { AfficheA4 } from "~/composants/kit-media-pro/AfficheA4";
import { FlyerRecto } from "~/composants/kit-media-pro/FlyerRecto";
import { FlyerVerso } from "~/composants/kit-media-pro/FlyerVerso";
import { PlancheFlyersA4 } from "~/composants/kit-media-pro/PlancheFlyersA4";
import type { IdVisuelKitPro } from "~/contenus/kit-media-pro";

/**
 * Ce que la route de rendu (/rendu-kit-pro/<id>) dessine pour chaque visuel du kit média pro (liste :
 * contenus/kit-media-pro.ts) : ses pages, dans l'ordre, chacune à sa taille exacte en pixels (300 dpi).
 * Le PNG est la première page ; le PDF les reprend toutes, à la taille du papier.
 */
export const pagesKitPro: Record<IdVisuelKitPro, ReactNode[]> = {
  "affiche-a4": [<AfficheA4 key="affiche" />],
  "flyer-a6-recto": [<FlyerRecto key="recto" />],
  "flyer-a6-verso": [<FlyerVerso key="verso" />],
  "flyer-a6": [<FlyerRecto key="recto" />, <FlyerVerso key="verso" />],
  "flyer-a6-planche-a4": [
    <PlancheFlyersA4 key="rectos"><FlyerRecto /></PlancheFlyersA4>,
    <PlancheFlyersA4 key="versos"><FlyerVerso /></PlancheFlyersA4>,
  ],
};
