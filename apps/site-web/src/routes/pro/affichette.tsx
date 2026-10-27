import type { Route } from "./+types/affichette";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { LANGUE_PAR_DEFAUT } from "../../../../../packages/commun/src/regles/langues.ts";
import { AffichetteTable } from "~/composants/pro/AffichetteTable";
import { BoutonImprimer } from "~/composants/pro/BoutonImprimer";
import { TitreLieuPro } from "~/composants/pro/TitreLieuPro";
import { TEXTES_IMPRIMES_PRO_PAR_LANGUE } from "~/contenus/imprimes-pro";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { exigerLieuPro } from "~/services/lieu-pro.server";

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_IMPRIMES_PRO_PAR_LANGUE, langue).affichette.meta;
  return [...creerMeta({ titre: loaderData ? T.titre(loaderData.lieu.nom) : T.titreParDefaut, description: T.description, langue }), { name: "robots", content: "noindex" }];
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
  const T = utiliserTextes(TEXTES_IMPRIMES_PRO_PAR_LANGUE);
  const langue = utiliserLangue();
  return (
    // Pas de <Section> : à l'impression, ni marge ni largeur de page, l'affichette prend toute la feuille
    <section className="bg-creme pt-10 pb-16 md:pt-14 md:pb-24 print:bg-white print:p-0">
      <style>{"@page { size: 105mm 148mm; margin: 0; }"}</style>
      <div className="mx-auto grid w-[min(1120px,100%-32px)] items-start gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] print:block print:w-auto">
        <div className="print:hidden">
          <TitreLieuPro lieu={lieu} page={T.affichette.page} chapo={lierPonctuation(T.affichette.chapo)} />
          <ul className="mb-8 grid list-disc gap-1.5 pl-5 text-gris">
            {T.affichette.conseils.map((conseil) => <li key={conseil}>{lierPonctuation(conseil)}</li>)}
            <li>{lierPonctuation(T.qr)}</li>
            {T.enFrancais && <li>{T.enFrancais}</li>}
          </ul>
          {lieu.statut !== "publie" && (
            <p role="note" className="mb-6 font-semibold text-rouge-texte">{lierPonctuation(T.nonPubliee)}</p>
          )}
          <BoutonImprimer />
        </div>
        <AffichetteTable nom={lieu.nom} lien={`https://sosmiam.fr/lieux/${lieu.id}`} lang={langue === LANGUE_PAR_DEFAUT ? undefined : LANGUE_PAR_DEFAUT} />
      </div>
    </section>
  );
}
