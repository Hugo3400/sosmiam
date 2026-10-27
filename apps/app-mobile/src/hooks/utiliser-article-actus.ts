import { useCallback, useEffect, useRef, useState } from "react";

import { articlesActusExemples } from "~/contenus/actus-exemples";
import type { ArticleActusAffiche } from "~/contenus/type-article-actus";
import { convertirArticleActus } from "~/fonctions/actus/convertir-article-actus";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserServiceActus } from "~/hooks/utiliser-service-actus";
import { EXEMPLES_ACTUS_EN_SECOURS } from "~/services/actus-visibles";

type EtatArticle = { id: number; article: ArticleActusAffiche | null; exemple: boolean };

export function utiliserArticleActus(id: number) {
  const { service } = utiliserServiceActus();
  const { invite } = utiliserProfil();
  const [etat, setEtat] = useState<EtatArticle | null>(null);
  const enCours = useRef(false);

  useEffect(() => {
    let actif = true;
    void service.lire(id).then((r) => {
      if (!actif) return;
      if (r.ok) return setEtat({ id, article: convertirArticleActus(r.article), exemple: false });
      const exemple = EXEMPLES_ACTUS_EN_SECOURS ? articlesActusExemples.find((a) => a.id === id && (!invite || !a.alcool)) ?? null : null;
      setEtat({ id, article: exemple, exemple: exemple !== null });
    });
    return () => {
      actif = false;
    };
  }, [service, id, invite]);

  const basculerJaime = useCallback(async () => {
    const article = etat?.article;
    if (!article || enCours.current) return;
    const aime = !article.aime;
    const avant = { jaime: article.jaime, aime: article.aime };
    setEtat((e) => (e?.article ? { ...e, article: { ...e.article, aime, jaime: e.article.jaime + (aime ? 1 : -1) } } : e));
    if (etat.exemple) return;
    enCours.current = true;
    try {
      const r = await service.aimer(article.id, aime);
      setEtat((e) => (e?.article ? { ...e, article: { ...e.article, ...(r.ok ? { jaime: r.jaime, aime: r.aime } : avant) } } : e));
    } finally {
      enCours.current = false;
    }
  }, [etat, service]);

  const pret = etat?.id === id;
  return { chargement: !pret, article: pret ? etat.article : null, exemple: pret && etat.exemple, basculerJaime };
}
