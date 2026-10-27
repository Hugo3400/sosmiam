import { data, Link, type ShouldRevalidateFunctionArgs } from "react-router";

import type { Route } from "./+types/signaler-article-actus";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { FormulaireSignalerArticleActus } from "~/composants/actus/FormulaireSignalerArticleActus";
import { MerciSignalerArticleActus } from "~/composants/actus/MerciSignalerArticleActus";
import { TEXTES_SIGNALER_ARTICLE_ACTUS_PAR_LANGUE } from "~/contenus/signaler-article-actus";
import { lireCibleSignalementActus } from "~/fonctions/actus/lire-cible-signalement-actus";
import {
  lireFormulaireSignalerArticleActus,
  ORDRE_CHAMPS_SIGNALER_ARTICLE_ACTUS,
  type ReponseSignalerArticleActus,
} from "~/fonctions/actus/lire-formulaire-signaler-article-actus";
import { ecrireErreursSignalerArticleActus } from "~/fonctions/actus/ecrire-erreurs-signaler-article-actus";
import { lireIdArticleActus } from "~/fonctions/actus/lire-id-article-actus";
import { estHoteDEssai } from "~/fonctions/hotes/est-hote-d-essai";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { ecrireMessageService } from "~/fonctions/texte/ecrire-message-service";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { chargerArticleActus } from "~/services/actus.server";
import { lireLangueRequete } from "~/services/langue.server";
import { lireIpVisiteur } from "~/services/session-compte.server";
import { envoyerSignalement } from "~/services/signalements.server";

const ENTETES = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" };

async function chargerCible(request: Request, idTexte: string | undefined) {
  const adresse = new URL(request.url);
  if (!estHoteDEssai(adresse.host)) throw data(null, { status: 404, headers: ENTETES });
  const id = lireIdArticleActus(idTexte);
  const cible = lireCibleSignalementActus(adresse.searchParams);
  if (id === null || cible === null) throw data(null, { status: 404, headers: ENTETES });
  const lecture = await chargerArticleActus(id, lireIpVisiteur(request));
  if (!lecture.ok) throw data(null, { status: lecture.erreur === "introuvable" ? 404 : 503, headers: ENTETES });
  const article = lecture.donnees;
  const reponse = cible.lieuId === null ? null : article.reponsesLieux.find((une) => une.lieuId === cible.lieuId);
  if (reponse === undefined) throw data(null, { status: 404, headers: ENTETES });
  return { article: { id: article.id, titre: article.titre }, reponse: reponse ? { lieuId: reponse.lieuId, nomLieu: reponse.nomLieu } : null };
}

export async function loader({ request, params }: Route.LoaderArgs) {
  return chargerCible(request, params.id);
}

export async function action({ request, params }: Route.ActionArgs): Promise<ReponseSignalerArticleActus> {
  const { article, reponse } = await chargerCible(request, params.id);
  const formulaire = await request.formData().catch(() => null);
  if (!formulaire) throw data(null, { status: 400, headers: ENTETES });
  const { langue } = lireLangueRequete(request);
  const T = choisirTextes(TEXTES_SIGNALER_ARTICLE_ACTUS_PAR_LANGUE, langue);

  const lecture = lireFormulaireSignalerArticleActus(formulaire, { articleId: article.id, lieuId: reponse?.lieuId ?? null });
  if (!lecture.ok) {
    const fautifs = ORDRE_CHAMPS_SIGNALER_ARTICLE_ACTUS.filter((champ) => lecture.codes[champ]);
    const message = fautifs.length > 1 ? T.erreurs.plusieursChamps(fautifs.length) : T.erreurs.unChamp;
    return { ok: false, message: lierPonctuation(message), champ: fautifs[0], erreurs: ecrireErreursSignalerArticleActus(lecture.codes, langue), valeurs: lecture.valeurs };
  }
  if (lecture.piege) return { ok: true };

  const resultat = await envoyerSignalement(lecture.signalement, lireIpVisiteur(request));
  if (resultat.ok) return { ok: true };
  const message = resultat.erreur === "signalement-invalide" ? T.erreurs.refuse : ecrireMessageService(resultat.erreur, langue);
  return { ok: false, message: lierPonctuation(message), valeurs: lecture.valeurs };
}

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_SIGNALER_ARTICLE_ACTUS_PAR_LANGUE, langue);
  if (!loaderData) return [{ title: T.meta.introuvable }, { name: "robots", content: "noindex" }];
  const { article, reponse } = loaderData;
  const titre = reponse ? T.meta.titreReponse(reponse.nomLieu) : T.meta.titreArticle(article.titre);
  return [...creerMeta({ titre, description: T.meta.description, langue }), { name: "robots", content: "noindex" }];
}

export function headers() {
  return ENTETES;
}

export function shouldRevalidate({ formMethod, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) {
  return formMethod ? false : defaultShouldRevalidate;
}

export default function PageSignalerArticleActus({ loaderData, actionData }: Route.ComponentProps) {
  const { article, reponse } = loaderData;
  const T = utiliserTextes(TEXTES_SIGNALER_ARTICLE_ACTUS_PAR_LANGUE);
  if (actionData?.ok) return <MerciSignalerArticleActus articleId={article.id} reponse={reponse !== null} />;
  return (
    <div className="bg-creme py-9 md:py-14">
      <div className="mx-auto flex w-[min(760px,100%-32px)] flex-col gap-6">
        <Link
          to={`/actus/${article.id}`}
          className="self-start text-[15px] font-semibold underline underline-offset-4 [overflow-wrap:anywhere] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre"
        >
          <span aria-hidden="true">← </span>
          {T.retour}
        </Link>
        <header className="flex flex-col gap-2">
          <h1 className="text-[34px] font-extrabold md:text-[40px]">{reponse ? T.titre.reponse : T.titre.article}</h1>
          <p className="text-[17px] leading-relaxed [overflow-wrap:anywhere]">{lierPonctuation(reponse ? T.intro.reponse(reponse.nomLieu) : T.intro.article(article.titre))}</p>
        </header>
        <FormulaireSignalerArticleActus articleId={article.id} reponse={actionData} />
      </div>
    </div>
  );
}
