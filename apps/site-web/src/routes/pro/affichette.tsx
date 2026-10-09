import type { Route } from "./+types/affichette";
import { AffichetteTable } from "~/composants/pro/AffichetteTable";
import { BoutonImprimer } from "~/composants/pro/BoutonImprimer";
import { TitreLieuPro } from "~/composants/pro/TitreLieuPro";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { exigerLieuPro } from "~/services/lieu-pro.server";

export function meta({ loaderData }: Route.MetaArgs) {
  return [...creerMeta({ titre: loaderData ? `Affichette · ${loaderData.lieu.nom}` : "Affichette", description: "L'affichette de table de ton lieu." }), { name: "robots", content: "noindex" }];
}

/** Le lieu (le QR mène à sa fiche publique sur sosmiam.fr). */
export async function loader({ request, params }: Route.LoaderArgs) {
  const { lieu } = await exigerLieuPro(request, params.id);
  return { lieu };
}

/**
 * Page /lieu/:id/affichette : l'aperçu de l'affichette A6 et « Imprimer ». À l'impression (règle @page de cette page
 * seulement), il ne reste que l'affichette, sur une feuille A6 sans marge ; sur une feuille A4, le navigateur la place en
 * haut à gauche (à découper).
 */
export default function PageAffichette({ loaderData }: Route.ComponentProps) {
  const { lieu } = loaderData;
  return (
    // Pas de <Section> : à l'impression, ni marge ni largeur de page, l'affichette prend toute la feuille
    <section className="bg-creme pt-10 pb-16 md:pt-14 md:pb-24 print:bg-white print:p-0">
      <style>{"@page { size: 105mm 148mm; margin: 0; }"}</style>
      <div className="mx-auto grid w-[min(1120px,100%-32px)] items-start gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] print:block print:w-auto">
        <div className="print:hidden">
          <TitreLieuPro lieu={lieu} page="Mon affichette" chapo={lierPonctuation("À poser sur les tables ou le comptoir : un scan, et tes clients retrouvent ta fiche.")} />
          <ul className="mb-8 grid list-disc gap-1.5 pl-5 text-gris">
            <li>{lierPonctuation("Format A6 (105 × 148 mm) : une carte postale.")}</li>
            <li>{lierPonctuation("Sur une feuille A4, coche « Taille réelle » (ou 100 %) et découpe.")}</li>
            <li>{lierPonctuation("Le QR mène à ta fiche publique : rien à mettre à jour, même si tes horaires changent.")}</li>
          </ul>
          {lieu.statut !== "publie" && (
            <p role="note" className="mb-6 font-semibold text-rouge-texte">{lierPonctuation("Ta fiche n'est pas encore publiée : le QR marchera dès qu'elle le sera.")}</p>
          )}
          <BoutonImprimer />
        </div>
        <AffichetteTable nom={lieu.nom} lien={`https://sosmiam.fr/lieux/${lieu.id}`} />
      </div>
    </section>
  );
}
