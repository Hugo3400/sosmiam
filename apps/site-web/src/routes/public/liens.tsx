import type { Route } from "./+types/liens";

import { Logo } from "~/composants/interface/Logo";
import { CarteLien } from "~/composants/liens/CarteLien";
import { Mascotte } from "~/composants/marque/Mascotte";
import { LienEvitement } from "~/composants/mise-en-page/LienEvitement";
import { PiedDePageLegal } from "~/composants/mise-en-page/PiedDePageLegal";
import { liensPublics } from "~/contenus/liens-publics";
import { creerMeta } from "~/fonctions/seo/creer-meta";

export function meta(_: Route.MetaArgs) {
  return creerMeta({
    titre: "Nos liens",
    description: "Le site, le Discord, le TikTok et l'Instagram de SOS Miam, au même endroit. Choisis ta porte d'entrée !",
  });
}

/**
 * Page /liens : le mini-site à mettre en bio TikTok et Instagram (liens dans src/contenus/liens-publics.ts).
 * Cadre à elle, sans le menu du site : on y arrive depuis une bio, elle va droit aux liens.
 */
export default function PageLiens() {
  return (
    <div className="flex min-h-screen flex-col bg-creme">
      <LienEvitement />
      <main id="contenu" tabIndex={-1} className="mx-auto w-[min(520px,100%-32px)] flex-1 py-10">
        <header className="flex flex-col items-center text-center">
          <Mascotte expression="clin" className="size-24 animate-flotte" />
          <h1 className="mt-4"><Logo className="h-12 w-auto" /></h1>
          <p className="mt-4 font-titre text-2xl font-extrabold">Sauve une table, régale-toi.</p>
          <p className="mt-2 text-gris">
            Les restos, pâtisseries, bars et sorties indépendants qui ont besoin de monde, partout en France.
            Choisis ta porte d'entrée : on te garde une place.
          </p>
        </header>
        <ul aria-label="Où nous retrouver" className="mt-8 grid gap-4">
          {liensPublics.map((lien) => <li key={lien.reseau}><CarteLien lien={lien} /></li>)}
        </ul>
      </main>
      <PiedDePageLegal />
    </div>
  );
}
