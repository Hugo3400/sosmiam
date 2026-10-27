import { data, Link, type ShouldRevalidateFunctionArgs } from "react-router";

import type { Route } from "./+types/signaler-image";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { FormulaireSignalerImage } from "~/composants/lieux/FormulaireSignalerImage";
import { MerciSignalerImage } from "~/composants/lieux/MerciSignalerImage";
import { TEXTES_SIGNALER_IMAGE_PAR_LANGUE } from "~/contenus/signaler-image";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { ecrireErreursSignalerImage } from "~/fonctions/lieux/ecrire-erreurs-signaler-image";
import { lireFormulaireSignalerImage, ORDRE_CHAMPS_SIGNALER_IMAGE, type ReponseSignalerImage } from "~/fonctions/lieux/lire-formulaire-signaler-image";
import { lireIdLieu } from "~/fonctions/lieux/lire-id-lieu";
import { listerImagesSignalables } from "~/fonctions/lieux/lister-images-signalables";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { ecrireMessageService } from "~/fonctions/texte/ecrire-message-service";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { chargerFicheLieu } from "~/services/fiche-lieu.server";
import { lireLangueRequete } from "~/services/langue.server";
import { lireIpVisiteur } from "~/services/session-compte.server";
import { envoyerSignalementImage } from "~/services/signalements.server";

const ENTETES = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" };

export async function loader({ request, params }: Route.LoaderArgs) {
  const lieuId = lireIdLieu(params.id);
  if (lieuId === null) throw data(null, { status: 404, headers: ENTETES });
  const reponse = await chargerFicheLieu(lieuId, lireIpVisiteur(request));
  if (!reponse.ok) throw data(null, { status: reponse.erreur === "lieu-inconnu" ? 404 : 503, headers: ENTETES });
  const { lieu } = reponse;
  const images = listerImagesSignalables(lieu);
  if (images.length === 0) throw data(null, { status: 404, headers: ENTETES });
  return { lieu: { id: lieu.id, nom: lieu.nom, banniere: lieu.banniere ?? null, logo: lieu.logo ?? null }, images };
}

export async function action({ request, params }: Route.ActionArgs): Promise<ReponseSignalerImage> {
  const lieuId = lireIdLieu(params.id);
  if (lieuId === null) throw data(null, { status: 404, headers: ENTETES });
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data(null, { status: 400, headers: ENTETES });
  const { langue } = lireLangueRequete(request);
  const T = choisirTextes(TEXTES_SIGNALER_IMAGE_PAR_LANGUE, langue);

  const lecture = lireFormulaireSignalerImage(formulaire, lieuId);
  if (!lecture.ok) {
    const fautifs = ORDRE_CHAMPS_SIGNALER_IMAGE.filter((champ) => lecture.codes[champ]);
    const message = fautifs.length > 1 ? T.erreurs.plusieursChamps(fautifs.length) : T.erreurs.unChamp;
    return { ok: false, message: lierPonctuation(message), champ: fautifs[0], erreurs: ecrireErreursSignalerImage(lecture.codes, langue), valeurs: lecture.valeurs };
  }
  if (lecture.piege) return { ok: true };

  const resultat = await envoyerSignalementImage(lecture.signalement, lireIpVisiteur(request));
  if (resultat.ok) return { ok: true };
  const message = resultat.erreur === "signalement-invalide" ? T.erreurs.refuse : ecrireMessageService(resultat.erreur, langue);
  return { ok: false, message: lierPonctuation(message), valeurs: lecture.valeurs };
}

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_SIGNALER_IMAGE_PAR_LANGUE, langue);
  if (!loaderData) return [{ title: T.meta.introuvable }, { name: "robots", content: "noindex" }];
  return [...creerMeta({ titre: T.meta.titre(loaderData.lieu.nom), description: T.meta.description, langue }), { name: "robots", content: "noindex" }];
}

export function headers() {
  return ENTETES;
}

export function shouldRevalidate({ formMethod, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) {
  return formMethod ? false : defaultShouldRevalidate;
}

export default function PageSignalerImage({ loaderData, actionData }: Route.ComponentProps) {
  const { lieu, images } = loaderData;
  const T = utiliserTextes(TEXTES_SIGNALER_IMAGE_PAR_LANGUE);
  if (actionData?.ok) return <MerciSignalerImage lieuId={lieu.id} nom={lieu.nom} />;
  return (
    <div className="bg-creme py-9 md:py-14">
      <div className="mx-auto flex w-[min(760px,100%-32px)] flex-col gap-6">
        <Link
          to={`/lieux/${lieu.id}`}
          className="self-start text-[15px] font-semibold underline underline-offset-4 [overflow-wrap:anywhere] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre"
        >
          <span aria-hidden="true">← </span>
          {T.retour(lieu.nom)}
        </Link>
        <header className="flex flex-col gap-2">
          <h1 className="text-[34px] font-extrabold md:text-[40px]">{T.titre}</h1>
          <p className="text-[17px] leading-relaxed [overflow-wrap:anywhere]">{lierPonctuation(T.intro(lieu.nom))}</p>
        </header>
        <FormulaireSignalerImage lieu={lieu} images={images} reponse={actionData} />
      </div>
    </div>
  );
}
