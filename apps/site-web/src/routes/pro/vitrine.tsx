import type { CSSProperties } from "react";
import { Link } from "react-router";

import type { Route } from "./+types/vitrine";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { LANGUE_PAR_DEFAUT } from "../../../../../packages/commun/src/regles/langues.ts";
import { AfficheVitrineLieu, HAUTEURS_AFFICHE_VITRINE } from "~/composants/pro/AfficheVitrineLieu";
import { BoutonImprimer } from "~/composants/pro/BoutonImprimer";
import { TitreLieuPro } from "~/composants/pro/TitreLieuPro";
import { TEXTES_IMPRIMES_PRO_PAR_LANGUE } from "~/contenus/imprimes-pro";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { exigerLieuPro } from "~/services/lieu-pro.server";
import { lireCharteMiamSafe } from "~/services/pro.server";

/**
 * Les formats du papier. L'affiche est dessinée sur 794 px (210 mm à 96 points par pouce) : le zoom l'amène à la largeur
 * du papier, un poil en dessous pour ne jamais déborder sur une deuxième page.
 */
const FORMATS = {
  a4: { libelle: "A4", page: "210mm 297mm", zoom: 0.9994 },
  a3: { libelle: "A3", page: "297mm 420mm", zoom: 1.4129 },
  "40x60": { libelle: "40 × 60 cm", page: "400mm 600mm", zoom: 1.9029 },
} as const;
type Format = keyof typeof FORMATS;

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_IMPRIMES_PRO_PAR_LANGUE, langue).vitrine.meta;
  return [...creerMeta({ titre: loaderData ? T.titre(loaderData.lieu.nom) : T.titreParDefaut, description: T.description, langue }), { name: "robots", content: "noindex" }];
}

/** Le lieu (le QR mène à sa fiche publique), s'il a signé la charte Miam Safe, et le format demandé (A4 par défaut). */
export async function loader({ request, params }: Route.LoaderArgs) {
  const { jeton, ip, lieu } = await exigerLieuPro(request, params.id);
  const charte = await lireCharteMiamSafe(jeton, ip, lieu.id);
  const demande = new URL(request.url).searchParams.get("format");
  const format: Format = demande === "a3" || demande === "40x60" ? demande : "a4";
  return { lieu, miamSafe: charte.ok ? charte.charte.signee : false, format };
}

/**
 * Page /lieu/:id/vitrine : l'affiche de vitrine au nom du lieu (maquette validée par Hugo), en A4, A3 ou 40 × 60 cm, et
 * « Imprimer ». À l'impression (règle @page de cette page seulement), il ne reste que l'affiche, au format du papier.
 */
export default function PageVitrine({ loaderData }: Route.ComponentProps) {
  const { lieu, miamSafe, format } = loaderData;
  const choisi = FORMATS[format];
  const lien = `https://sosmiam.fr/lieux/${lieu.id}`;
  const T = utiliserTextes(TEXTES_IMPRIMES_PRO_PAR_LANGUE);
  const V = T.vitrine;
  const langue = utiliserLangue();
  return (
    <section className="bg-creme pt-10 pb-16 md:pt-14 md:pb-24 print:bg-white print:p-0">
      <style>{`@page { size: ${choisi.page}; margin: 0; }`}</style>
      <div className="mx-auto grid w-[min(1120px,100%-32px)] items-start gap-10 md:grid-cols-[minmax(0,1fr)_auto] print:block print:w-auto">
        <div className="print:hidden">
          <TitreLieuPro lieu={lieu} page={V.page} chapo={lierPonctuation(V.chapo)} />
          <p className="mb-3 font-semibold">{V.format}</p>
          <ul className="mb-6 flex flex-wrap gap-2">
            {(Object.keys(FORMATS) as Format[]).map((f) => (
              <li key={f}>
                <Link
                  to={`?format=${f}`}
                  aria-current={f === format ? "page" : undefined}
                  className={`inline-block rounded-full border-2 border-encre px-4 py-1.5 font-semibold ${f === format ? "bg-encre text-jaune" : "bg-white hover:bg-jaune"}`}
                >
                  {FORMATS[f].libelle}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mb-8 grid list-disc gap-1.5 pl-5 text-gris">
            <li>{lierPonctuation(V.conseils[format])}</li>
            <li>{lierPonctuation(T.qr)}</li>
            <li>{lierPonctuation(miamSafe ? V.miamSafeSignee : V.miamSafeNonSignee)}</li>
            {T.enFrancais && <li>{T.enFrancais}</li>}
          </ul>
          {lieu.statut !== "publie" && (
            <p role="note" className="mb-6 font-semibold text-rouge-texte">{lierPonctuation(T.nonPubliee)}</p>
          )}
          <BoutonImprimer libelle={V.imprimer} />
        </div>
        <div
          lang={langue === LANGUE_PAR_DEFAUT ? undefined : LANGUE_PAR_DEFAUT}
          className="mx-auto overflow-hidden rounded-carte border-2 border-encre shadow-brut-grand [zoom:0.42] sm:[zoom:0.5] print:rounded-none print:border-0 print:shadow-none print:[zoom:var(--zoom-impression)]"
          style={{ "--zoom-impression": choisi.zoom } as CSSProperties}
        >
          <AfficheVitrineLieu nom={lieu.nom} lien={lien} lienCourt={`sosmiam.fr/lieux/${lieu.id}`} miamSafe={miamSafe} hauteur={HAUTEURS_AFFICHE_VITRINE[format]} />
        </div>
      </div>
    </section>
  );
}
