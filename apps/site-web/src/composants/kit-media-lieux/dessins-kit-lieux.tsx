import type { ReactNode } from "react";

import { Logo } from "~/composants/interface/Logo";
import { AutocollantMiamSafe } from "~/composants/kit-media-lieux/AutocollantMiamSafe";
import { AutocollantSosMiam } from "~/composants/kit-media-lieux/AutocollantSosMiam";
import { MemoEquipeMiamSafe } from "~/composants/kit-media-lieux/MemoEquipeMiamSafe";
import { VisuelLieuMiamSafe } from "~/composants/kit-media-lieux/VisuelLieuMiamSafe";
import { VisuelOnEstSurSosMiam } from "~/composants/kit-media-lieux/VisuelOnEstSurSosMiam";
import { formatsKitLieux, type IdVisuelKitLieux } from "~/contenus/kit-media-lieux";

const { logo } = formatsKitLieux;
const dessinLogo = (clair: boolean) => (
  <div className="grid place-items-center p-[40px]" style={{ width: logo.largeur, height: logo.hauteur }}>
    <Logo clair={clair} className="size-full" />
  </div>
);

/**
 * Ce que la route de rendu (/rendu-kit-lieux/<id>) dessine pour chaque visuel du kit des lieux (liste :
 * contenus/kit-media-lieux.ts), à sa taille exacte en pixels. Le PNG est cette page ; le PDF la ramène à la taille du papier.
 */
export const pagesKitLieux: Record<IdVisuelKitLieux, ReactNode> = {
  "story-on-est-sur-sos-miam": <VisuelOnEstSurSosMiam format="story" />,
  "post-on-est-sur-sos-miam": <VisuelOnEstSurSosMiam format="post" />,
  "story-lieu-miam-safe": <VisuelLieuMiamSafe format="story" />,
  "post-lieu-miam-safe": <VisuelLieuMiamSafe format="post" />,
  "autocollant-sos-miam": <AutocollantSosMiam />,
  "autocollant-miam-safe": <AutocollantMiamSafe />,
  "memo-equipe-miam-safe": <MemoEquipeMiamSafe />,
  "logo-fond-clair": dessinLogo(false),
  "logo-fond-sombre": dessinLogo(true),
};
