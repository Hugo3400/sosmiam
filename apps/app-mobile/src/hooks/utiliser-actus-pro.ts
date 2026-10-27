import { useCallback, useEffect, useState } from "react";
import type { ImageSourcePropType } from "react-native";

import type { ArticleCitantLieuActus } from "@sos-miam/commun/types/actus";
import { articlesCitantLieuExemples } from "~/contenus/actus-exemples";
import { utiliserServiceActus } from "~/hooks/utiliser-service-actus";
import { EXEMPLES_ACTUS_EN_SECOURS } from "~/services/actus-visibles";
import { ADRESSE_API } from "~/services/adresse-api";

type ArticleCite = ArticleCitantLieuActus<ImageSourcePropType>;

export function utiliserActusPro(lieuId: number | null) {
  const { service } = utiliserServiceActus();
  const [etat, setEtat] = useState<{ lieuId: number; articles: ArticleCite[]; exemples: boolean } | null>(null);

  useEffect(() => {
    if (lieuId === null) return;
    let actif = true;
    void service.articlesDuLieu(lieuId).then((r) => {
      if (!actif) return;
      if (r.ok) return setEtat({ lieuId, articles: r.articles.map((a) => ({ ...a, couverture: { uri: `${ADRESSE_API}${a.couverture}` } })), exemples: false });
      setEtat({ lieuId, articles: EXEMPLES_ACTUS_EN_SECOURS ? articlesCitantLieuExemples : [], exemples: EXEMPLES_ACTUS_EN_SECOURS });
    });
    return () => {
      actif = false;
    };
  }, [service, lieuId]);

  const repondre = useCallback(async (articleId: number, texte: string): Promise<boolean> => {
    if (lieuId === null || !etat) return false;
    const r = etat.exemples ? { ok: true as const } : await service.repondre(lieuId, articleId, texte);
    if (!r.ok) return false;
    setEtat((e) => (e ? { ...e, articles: e.articles.map((a) => (a.id === articleId ? { ...a, reponse: { texte, statut: "en-relecture", motif: null, peutReecrire: false } } : a)) } : e));
    return true;
  }, [etat, lieuId, service]);

  const pret = lieuId !== null && etat?.lieuId === lieuId;
  return { chargement: !pret, articles: pret ? etat.articles : [], repondre };
}
