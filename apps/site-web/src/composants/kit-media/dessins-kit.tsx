import type { ReactNode } from "react";

import { Logo } from "~/composants/interface/Logo";
import { VisuelJeSuisAmbassadeur } from "~/composants/kit-media/VisuelJeSuisAmbassadeur";
import { VisuelSauveUneTable } from "~/composants/kit-media/VisuelSauveUneTable";
import { VisuelTuAsUnLieu } from "~/composants/kit-media/VisuelTuAsUnLieu";
import { BadgePalier } from "~/composants/marque/BadgePalier";
import { Ecusson } from "~/composants/marque/Ecusson";
import { Mascotte } from "~/composants/marque/Mascotte";
import type { IdVisuelKit } from "~/contenus/kit-media";

type DessinKit = {
  dessin: ReactNode;
  /** Marge transparente autour du dessin dans le PNG, en pixels (pour que rien ne touche le bord) */
  marge?: number;
};

/**
 * Ce que la route de rendu (/rendu-kit/<id>) dessine pour chaque visuel du kit média (liste : contenus/kit-media.ts).
 * Les dessins à fond transparent remplissent leur cadre (size-full) ; les visuels à poster ont déjà leur taille exacte.
 */
export const dessinsKit: Record<IdVisuelKit, DessinKit> = {
  "story-je-suis-ambassadeur": { dessin: <VisuelJeSuisAmbassadeur format="story" /> },
  "post-je-suis-ambassadeur": { dessin: <VisuelJeSuisAmbassadeur format="post" /> },
  "story-sauve-une-table": { dessin: <VisuelSauveUneTable format="story" /> },
  "post-sauve-une-table": { dessin: <VisuelSauveUneTable format="post" /> },
  "story-tu-as-un-lieu": { dessin: <VisuelTuAsUnLieu format="story" /> },
  "post-tu-as-un-lieu": { dessin: <VisuelTuAsUnLieu format="post" /> },
  "logo-fond-clair": { dessin: <Logo className="size-full" />, marge: 40 },
  "logo-fond-sombre": { dessin: <Logo clair className="size-full" />, marge: 40 },
  "bouee-seule": { dessin: <Logo avecTexte={false} className="size-full" />, marge: 32 },
  "mascotte-miam": { dessin: <Mascotte expression="miam" className="size-full" /> },
  "mascotte-clin": { dessin: <Mascotte expression="clin" className="size-full" /> },
  "mascotte-surprise": { dessin: <Mascotte expression="surprise" className="size-full" /> },
  "badge-curieux": { dessin: <BadgePalier niveau={1} className="size-full" />, marge: 24 },
  "badge-denicheur": { dessin: <BadgePalier niveau={2} className="size-full" />, marge: 24 },
  "badge-ambassadeur-de-quartier": { dessin: <BadgePalier niveau={3} className="size-full" />, marge: 24 },
  "badge-ambassadeur-de-ville": { dessin: <BadgePalier niveau={4} className="size-full" />, marge: 24 },
  "ecusson-ambassadeur": { dessin: <Ecusson ruban="AMBASSADEUR" className="size-full" />, marge: 16 },
};
