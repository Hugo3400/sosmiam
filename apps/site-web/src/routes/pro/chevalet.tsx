import type { CSSProperties } from "react";

import type { Route } from "./+types/chevalet";
import { BoutonImprimer } from "~/composants/pro/BoutonImprimer";
import { FaceChevaletTable } from "~/composants/pro/FaceChevaletTable";
import { TitreLieuPro } from "~/composants/pro/TitreLieuPro";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { exigerLieuPro } from "~/services/lieu-pro.server";

/** Deux faces de 420 px (105 mm à 96 points par pouce, à 0,945 près) : le zoom les amène à 2 × 105 mm, un poil en dessous */
const ZOOM_IMPRESSION = 0.9443;

export function meta({ loaderData }: Route.MetaArgs) {
  return [...creerMeta({ titre: loaderData ? `Chevalet de table · ${loaderData.lieu.nom}` : "Chevalet de table", description: "Le chevalet de table de ton lieu." }), { name: "robots", content: "noindex" }];
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
  return (
    <section className="bg-creme pt-10 pb-16 md:pt-14 md:pb-24 print:bg-white print:p-0">
      <style>{"@page { size: 210mm 148mm; margin: 0; }"}</style>
      <div className="mx-auto w-[min(1120px,100%-32px)] print:w-auto">
        <div className="print:hidden">
          <TitreLieuPro lieu={lieu} page="Mon chevalet de table" chapo={lierPonctuation("Deux faces à plier, qui tiennent debout sur la table : un scan, et tes clients retrouvent ta fiche.")} />
          <ul className="mb-8 grid list-disc gap-1.5 pl-5 text-gris">
            <li>{lierPonctuation("Sur une feuille A4, en « Taille réelle » (ou 100 %) : découpe le rectangle de 210 × 148 mm.")}</li>
            <li>{lierPonctuation("Plie sur les pointillés, faces vers l'extérieur : un papier épais (250 g) tient mieux debout.")}</li>
            <li>{lierPonctuation("Le QR mène à ta fiche publique : rien à mettre à jour, même si tes horaires changent.")}</li>
          </ul>
          {lieu.statut !== "publie" && (
            <p role="note" className="mb-6 font-semibold text-rouge-texte">{lierPonctuation("Ta fiche n'est pas encore publiée : le QR marchera dès qu'elle le sera.")}</p>
          )}
          <div className="mb-10">
            <BoutonImprimer libelle="Imprimer le chevalet" />
          </div>
        </div>
        <div className="max-w-full overflow-x-auto print:overflow-visible">
          <div
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
