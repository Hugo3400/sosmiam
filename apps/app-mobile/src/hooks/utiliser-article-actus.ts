import { useCallback, useEffect, useRef, useState } from "react";

import type { ArticleActusAffiche } from "~/contenus/type-article-actus";
import { convertirArticleActus } from "~/fonctions/actus/convertir-article-actus";
import { utiliserServiceActus } from "~/hooks/utiliser-service-actus";

type EtatArticle = { id: number; article: ArticleActusAffiche | null };

export function utiliserArticleActus(id: number) {
  const { service } = utiliserServiceActus();
  const [etat, setEtat] = useState<EtatArticle | null>(null);
  const enCours = useRef(false);

  useEffect(() => {
    let actif = true;
    void service.lire(id).then((r) => {
      if (!actif) return;
      setEtat({ id, article: r.ok ? convertirArticleActus(r.article) : null });
    });
    return () => {
      actif = false;
    };
  }, [service, id]);

  const basculerJaime = useCallback(async () => {
    const article = etat?.article;
    if (!article || enCours.current) return;
    const aime = !article.aime;
    const avant = { jaime: article.jaime, aime: article.aime };
    setEtat((e) => (e?.article ? { ...e, article: { ...e.article, aime, jaime: e.article.jaime + (aime ? 1 : -1) } } : e));
    enCours.current = true;
    try {
      const r = await service.aimer(article.id, aime);
      setEtat((e) => (e?.article ? { ...e, article: { ...e.article, ...(r.ok ? { jaime: r.jaime, aime: r.aime } : avant) } } : e));
    } finally {
      enCours.current = false;
    }
  }, [etat, service]);

  const pret = etat?.id === id;
  return { chargement: !pret, article: pret ? etat.article : null, basculerJaime };
}
