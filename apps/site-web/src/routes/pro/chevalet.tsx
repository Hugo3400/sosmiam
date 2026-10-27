import type { CSSProperties } from "react";

import type { Route } from "./+types/chevalet";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { LANGUE_PAR_DEFAUT } from "../../../../../packages/commun/src/regles/langues.ts";
import { BoutonImprimer } from "~/composants/pro/BoutonImprimer";
import { FaceChevaletTable } from "~/composants/pro/FaceChevaletTable";
import { TitreLieuPro } from "~/composants/pro/TitreLieuPro";
import { TEXTES_IMPRIMES_PRO_PAR_LANGUE } from "~/contenus/imprimes-pro";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { exigerLieuPro } from "~/services/lieu-pro.server";

/** Deux faces de 420 px (105 mm à 96 points par pouce, à 0,945 près) : le zoom les amène à 2 × 105 mm, un poil en dessous */
const ZOOM_IMPRESSION = 0.9443;

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_IMPRIMES_PRO_PAR_LANGUE, langue).chevalet.meta;
  return [...creerMeta({ titre: loaderData ? T.titre(loaderData.lieu.nom) : T.titreParDefaut, description: T.description, langue }), { name: "robots", content: "noindex" }];
}

/** Le lieu (le QR mène à sa fiche publique sur sosmiam.fr). */
export async function loader({ request, params }: Route.LoaderArgs) {
  const { lieu } = await exigerLieuPro(request, params.id);
  return { lieu };
}

/**
 * Page /lieu/:id/chevalet : le chevalet de table (maquette validée par Hugo), deux faces A6 côte à côte à plier au milieu,
 * à côté de l'affichette A6 simple. À l'impression, il ne reste que le chevalet, sur une feuille de 210 × 148 mm.
 */
export default function PageChevalet({ loaderData }: Route.ComponentProps) {
  const { lieu } = loaderData;
  const lien = `https://sosmiam.fr/lieux/${lieu.id}`;
  const T = utiliserTextes(TEXTES_IMPRIMES_PRO_PAR_LANGUE);
  const langue = utiliserLangue();
  return (
    <section className="bg-creme pt-10 pb-16 md:pt-14 md:pb-24 print:bg-white print:p-0">
      <style>{"@page { size: 210mm 148mm; margin: 0; }"}</style>
      <div className="mx-auto w-[min(1120px,100%-32px)] print:w-auto">
        <div className="print:hidden">
          <TitreLieuPro lieu={lieu} page={T.chevalet.page} chapo={lierPonctuation(T.chevalet.chapo)} />
          <ul className="mb-8 grid list-disc gap-1.5 pl-5 text-gris">
            {T.chevalet.conseils.map((conseil) => <li key={conseil}>{lierPonctuation(conseil)}</li>)}
            <li>{lierPonctuation(T.qr)}</li>
            {T.enFrancais && <li>{T.enFrancais}</li>}
          </ul>
          {lieu.statut !== "publie" && (
            <p role="note" className="mb-6 font-semibold text-rouge-texte">{lierPonctuation(T.nonPubliee)}</p>
          )}
          <div className="mb-10">
            <BoutonImprimer libelle={T.chevalet.imprimer} />
          </div>
        </div>
        <div className="max-w-full overflow-x-auto print:overflow-visible">
          <div
            lang={langue === LANGUE_PAR_DEFAUT ? undefined : LANGUE_PAR_DEFAUT}
            className="mx-auto flex w-max overflow-hidden rounded-carte border-2 border-encre shadow-brut-grand [zoom:0.38] sm:[zoom:0.6] lg:[zoom:0.85] print:rounded-none print:border-0 print:shadow-none print:[zoom:var(--zoom-impression)]"
            style={{ "--zoom-impression": ZOOM_IMPRESSION } as CSSProperties}
          >
            <FaceChevaletTable nom={lieu.nom} lien={lien} />
            <FaceChevaletTable nom={lieu.nom} lien={lien} pli />
          </div>
        </div>
      </div>
    </section>
  );
}
