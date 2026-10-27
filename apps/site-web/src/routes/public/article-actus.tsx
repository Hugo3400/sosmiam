import { data } from "react-router";

import type { Route } from "./+types/article-actus";
import { CorpsArticleActus } from "~/composants/actus/CorpsArticleActus";
import { EnTeteArticleActus } from "~/composants/actus/EnTeteArticleActus";
import { LieuxArticleActus } from "~/composants/actus/LieuxArticleActus";
import { LireDansLAppActus } from "~/composants/actus/LireDansLAppActus";
import { MentionsArticleActus } from "~/composants/actus/MentionsArticleActus";
import { MotsDesLieuxActus } from "~/composants/actus/MotsDesLieuxActus";
import { TEXTES_ACTUS } from "~/contenus/actus";
import { lireIdArticleActus } from "~/fonctions/actus/lire-id-article-actus";
import { estHoteDEssai } from "~/fonctions/hotes/est-hote-d-essai";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lireArticleActus } from "~/services/actus.server";

const NON_INDEXEE = { name: "robots", content: "noindex" };

export async function loader({ request, params }: Route.LoaderArgs) {
  if (!estHoteDEssai(new URL(request.url).host)) throw data(null, { status: 404 });
  const id = lireIdArticleActus(params.id);
  const article = id === null ? null : await lireArticleActus(id);
  if (!article) throw data(null, { status: 404 });
  return { article };
}

export function headers() {
  return { "X-Robots-Tag": "noindex" };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: `${TEXTES_ACTUS.article.introuvable} — SOS Miam` }, NON_INDEXEE];
  const { article } = loaderData;
  return [...creerMeta({ titre: article.titre, description: article.accroche }), NON_INDEXEE];
}

export default function PageArticleActus({ loaderData }: Route.ComponentProps) {
  const { article } = loaderData;
  return (
    <article className="bg-creme pt-8 pb-16 md:pt-12 md:pb-24">
      <div className="mx-auto flex w-[min(760px,100%-32px)] flex-col gap-10">
        <EnTeteArticleActus article={article} />
        <CorpsArticleActus article={article} />
        <LieuxArticleActus lieux={article.lieux} />
        <MotsDesLieuxActus article={article} />
        <MentionsArticleActus article={article} />
        <LireDansLAppActus article={article} />
      </div>
    </article>
  );
}
