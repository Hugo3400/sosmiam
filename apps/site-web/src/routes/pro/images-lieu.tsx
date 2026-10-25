import type { Route } from "./+types/images-lieu";
import { Section } from "~/composants/mise-en-page/Section";
import { GestionImagesLieu } from "~/composants/pro/GestionImagesLieu";
import { TitreLieuPro } from "~/composants/pro/TitreLieuPro";
import { TEXTES_IMAGES_LIEU } from "~/contenus/pro-images-lieu";
import { lireImageLieu } from "~/fonctions/lieux/lire-image-lieu";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { exigerLieuPro } from "~/services/lieu-pro.server";
import { lireFichePublique } from "~/services/pro.server";

const T = TEXTES_IMAGES_LIEU;

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    ...creerMeta({ titre: loaderData ? T.meta.titre(loaderData.lieu.nom) : T.meta.titreParDefaut, description: T.meta.description }),
    { name: "robots", content: "noindex" },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { ip, lieu, peutModifier } = await exigerLieuPro(request, params.id);
  const publique = lieu.statut === "publie" ? await lireFichePublique(lieu.id, ip) : null;
  const fiche = publique?.ok ? publique.lieu : null;
  const { id, nom, ville, quartier, info, emoji, statut, estVerifie } = lieu;
  return {
    lieu: { id, nom, ville, quartier, info, emoji, statut, estVerifie, couleurs: fiche?.couleurs ?? [] },
    peutModifier,
    images: fiche ? { banniere: lireImageLieu(fiche.banniere), logo: lireImageLieu(fiche.logo) } : null,
  };
}

export default function PageImagesLieu({ loaderData }: Route.ComponentProps) {
  const { lieu, peutModifier, images } = loaderData;
  const modifiable = peutModifier && lieu.estVerifie;
  const note = !lieu.estVerifie ? T.etats.nonVerifie : !peutModifier ? T.etats.equipe : null;
  const remarque = !modifiable ? null : lieu.statut !== "publie" ? T.etats.nonPubliee : images === null ? T.etats.illisibles : null;
  return (
    <Section fond="creme" className="!pt-10 md:!pt-14">
      <TitreLieuPro lieu={lieu} page={T.page} chapo={lierPonctuation(T.chapo)} />
      {note && (
        <div role="note" className="mb-8 max-w-2xl rounded-2xl border-2 border-dashed border-encre bg-white px-5 py-4">
          <p className="font-bold">{lierPonctuation(note.titre)}</p>
          <p className="mt-1 text-gris">{lierPonctuation(note.texte)}</p>
        </div>
      )}
      {remarque && <p role="note" className="mb-8 max-w-2xl rounded-2xl border-2 border-encre bg-jaune-clair px-5 py-3 font-semibold">{lierPonctuation(remarque)}</p>}
      <GestionImagesLieu lieuId={lieu.id} lieu={lieu} images={images} modifiable={modifiable} />
    </Section>
  );
}
