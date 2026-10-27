import type { Route } from "./+types/liens";

import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { Logo } from "~/composants/interface/Logo";
import { CarteLien } from "~/composants/liens/CarteLien";
import { Mascotte } from "~/composants/marque/Mascotte";
import { LienCanonique } from "~/composants/mise-en-page/LienCanonique";
import { LienEvitement } from "~/composants/mise-en-page/LienEvitement";
import { PiedDePageLegal } from "~/composants/mise-en-page/PiedDePageLegal";
import { STRUCTURE_LIENS_PUBLICS, TEXTES_LIENS_PUBLICS_PAR_LANGUE } from "~/contenus/liens-publics";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { assemblerLiensPublics } from "~/fonctions/navigation/assembler-liens-publics";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function meta({ matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_LIENS_PUBLICS_PAR_LANGUE, langue);
  return creerMeta({ ...T.meta, langue });
}

/**
 * Page /liens : le mini-site à mettre en bio TikTok et Instagram (liens dans src/contenus/liens-publics.ts).
 * Cadre à elle, sans le menu du site : on y arrive depuis une bio, elle va droit aux liens.
 */
export default function PageLiens() {
  const T = utiliserTextes(TEXTES_LIENS_PUBLICS_PAR_LANGUE);
  return (
    <div className="flex min-h-screen flex-col bg-creme">
      <LienCanonique />
      <LienEvitement />
      <main id="contenu" tabIndex={-1} className="mx-auto w-[min(520px,100%-32px)] flex-1 py-10">
        <header className="flex flex-col items-center text-center">
          <Mascotte expression="clin" className="size-24 animate-flotte" />
          {/* Le nom en texte (lu par les moteurs et les lecteurs d'écran), le logo pour les yeux */}
          <h1 className="mt-4"><span className="sr-only">SOS Miam</span><span aria-hidden="true"><Logo className="h-12 w-auto" /></span></h1>
          <p className="mt-4 font-titre text-2xl font-extrabold">{T.slogan}</p>
          <p className="mt-2 text-gris">{T.presentation}</p>
        </header>
        <ul aria-label={T.ouNousRetrouver} className="mt-8 grid gap-4">
          {assemblerLiensPublics(STRUCTURE_LIENS_PUBLICS, T).map((lien) => <li key={lien.reseau}><CarteLien lien={lien} /></li>)}
        </ul>
      </main>
      <PiedDePageLegal />
    </div>
  );
}
