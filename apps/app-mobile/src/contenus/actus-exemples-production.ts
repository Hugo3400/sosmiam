import type { ImageSourcePropType } from "react-native";

import type { ArticleCitantLieuActus, CommentaireActus, MonArticleActus } from "@sos-miam/commun/types/actus";
import type { ArticleActusAffiche } from "~/contenus/type-article-actus";

export const articlesActusExemples: ArticleActusAffiche[] = [];

export const commentairesActusExemples: Record<number, CommentaireActus[]> = {};

export const mesArticlesActusExemples: MonArticleActus<ImageSourcePropType>[] = [];

export const ARTICLES_ENVOYES_SEMAINE_EXEMPLE = 0;

export const articlesCitantLieuExemples: ArticleCitantLieuActus<ImageSourcePropType>[] = [];
