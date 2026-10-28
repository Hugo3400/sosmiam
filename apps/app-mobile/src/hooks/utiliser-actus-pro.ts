import { useCallback, useEffect, useState } from "react";
import type { ImageSourcePropType } from "react-native";

import type { ArticleCitantLieuActus } from "@sos-miam/commun/types/actus";
import { utiliserServiceActus } from "~/hooks/utiliser-service-actus";
import { ADRESSE_API } from "~/services/adresse-api";

type ArticleCite = ArticleCitantLieuActus<ImageSourcePropType>;

export function utiliserActusPro(lieuId: number | null) {
  const { service } = utiliserServiceActus();
  const [etat, setEtat] = useState<{ lieuId: number; articles: ArticleCite[] } | null>(null);

  useEffect(() => {
    if (lieuId === null) return;
    let actif = true;
    void service.articlesDuLieu(lieuId).then((r) => {
      if (!actif) return;
      setEtat({ lieuId, articles: r.ok ? r.articles.map((a) => ({ ...a, couverture: { uri: `${ADRESSE_API}${a.couverture}` } })) : [] });
    });
    return () => {
      actif = false;
    };
  }, [service, lieuId]);

  const repondre = useCallback(async (articleId: number, texte: string): Promise<boolean> => {
    if (lieuId === null || !etat) return false;
    const r = await service.repondre(lieuId, articleId, texte);
    if (!r.ok) return false;
    setEtat((e) => (e ? { ...e, articles: e.articles.map((a) => (a.id === articleId ? { ...a, reponse: { texte, statut: "en-relecture", motif: null, peutReecrire: false } } : a)) } : e));
    return true;
  }, [etat, lieuId, service]);

  const pret = lieuId !== null && etat?.lieuId === lieuId;
  return { chargement: !pret, articles: pret ? etat.articles : [], repondre };
}
