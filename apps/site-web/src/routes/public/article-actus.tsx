import { data } from "react-router";

import type { Route } from "./+types/article-actus";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { ActusIndisponibles } from "~/composants/actus/ActusIndisponibles";
import { CorpsArticleActus } from "~/composants/actus/CorpsArticleActus";
import { EnTeteArticleActus } from "~/composants/actus/EnTeteArticleActus";
import { LienSignalerArticleActus } from "~/composants/actus/LienSignalerArticleActus";
import { LieuxArticleActus } from "~/composants/actus/LieuxArticleActus";
import { LireDansLAppActus } from "~/composants/actus/LireDansLAppActus";
import { MentionsArticleActus } from "~/composants/actus/MentionsArticleActus";
import { MotsDesLieuxActus } from "~/composants/actus/MotsDesLieuxActus";
import { PhotosArticleActus } from "~/composants/actus/PhotosArticleActus";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/actus";
import { lireIdArticleActus } from "~/fonctions/actus/lire-id-article-actus";
import { estHoteDEssai } from "~/fonctions/hotes/est-hote-d-essai";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { chargerArticleActus } from "~/services/actus.server";
import { lireIpVisiteur } from "~/services/session-compte.server";
import type { ArticleActusSite } from "~/types/actus";

const NON_INDEXEE = { name: "robots", content: "noindex" };

export async function loader({ request, params }: Route.LoaderArgs) {
  if (!estHoteDEssai(new URL(request.url).host)) throw data(null, { status: 404 });
  const id = lireIdArticleActus(params.id);
  if (id === null) throw data(null, { status: 404 });
  const reponse = await chargerArticleActus(id, lireIpVisiteur(request));
  if (reponse.ok) return { article: reponse.donnees as ArticleActusSite | null, id };
  if (reponse.erreur === "introuvable") throw data(null, { status: 404 });
  return data({ article: null as ArticleActusSite | null, id }, { status: 503 });
}

export function headers() {
  return { "X-Robots-Tag": "noindex" };
}

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_ACTUS_PAR_LANGUE, langue);
  const article = loaderData?.article;
  if (!loaderData) return [{ title: `${T.article.introuvable} — SOS Miam` }, NON_INDEXEE];
  if (!article) return [...creerMeta({ titre: T.indisponible.titre, description: T.meta.description, langue }), NON_INDEXEE];
  return [...creerMeta({ titre: article.titre, description: article.accroche, langue }), NON_INDEXEE];
}

export default function PageArticleActus({ loaderData }: Route.ComponentProps) {
  const { article, id } = loaderData;
  return (
    <article className="bg-creme pt-8 pb-16 md:pt-12 md:pb-24">
      <div className="mx-auto flex w-[min(760px,100%-32px)] flex-col gap-10">
        {article ? (
          <>
            <EnTeteArticleActus article={article} />
            <CorpsArticleActus article={article} />
            <PhotosArticleActus photos={article.photos.filter((photo): photo is string => photo !== null)} />
            <LieuxArticleActus lieux={article.lieux} />
            <MotsDesLieuxActus article={article} />
            <MentionsArticleActus article={article} />
            <LireDansLAppActus article={article} />
            <LienSignalerArticleActus articleId={article.id} />
          </>
        ) : (
          <ActusIndisponibles reessayer={`/actus/${id}`} principal />
        )}
      </div>
    </article>
  );
}
