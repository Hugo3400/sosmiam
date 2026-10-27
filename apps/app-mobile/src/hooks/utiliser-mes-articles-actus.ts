import { useCallback, useEffect, useState } from "react";
import type { ImageSourcePropType } from "react-native";

import type { MonArticleActus } from "@sos-miam/commun/types/actus";
import { ARTICLES_ENVOYES_SEMAINE_EXEMPLE, mesArticlesActusExemples } from "~/contenus/actus-exemples";
import { utiliserServiceActus } from "~/hooks/utiliser-service-actus";
import { EXEMPLES_ACTUS_EN_SECOURS } from "~/services/actus-visibles";
import { ADRESSE_API } from "~/services/adresse-api";

type EtatMesArticles = { articles: MonArticleActus<ImageSourcePropType>[]; envoyesCetteSemaine: number; exemples: boolean };

export function utiliserMesArticlesActus() {
  const { service, client } = utiliserServiceActus();
  const [etat, setEtat] = useState<EtatMesArticles | null>(null);

  useEffect(() => {
    let actif = true;
    void (async () => {
      const r = await service.mesArticles();
      if (!actif) return;
      if (!r.ok) {
        setEtat(EXEMPLES_ACTUS_EN_SECOURS
          ? { articles: mesArticlesActusExemples, envoyesCetteSemaine: ARTICLES_ENVOYES_SEMAINE_EXEMPLE, exemples: true }
          : { articles: [], envoyesCetteSemaine: 0, exemples: false });
        return;
      }
      const { entetes } = await client.preparerTelechargement("/app/actus/miens");
      if (!actif) return;
      setEtat({
        articles: r.articles.map((a) => ({ ...a, couverture: { uri: `${ADRESSE_API}${a.couverture}`, headers: entetes } })),
        envoyesCetteSemaine: r.envoyesCetteSemaine,
        exemples: false,
      });
    })();
    return () => {
      actif = false;
    };
  }, [service, client]);

  const supprimer = useCallback(async (id: number): Promise<boolean> => {
    const r = etat?.exemples ? { ok: true as const } : await service.supprimerArticle(id);
    if (!r.ok) return false;
    setEtat((e) => (e ? { ...e, articles: e.articles.filter((a) => a.id !== id) } : e));
    return true;
  }, [etat, service]);

  return { chargement: etat === null, articles: etat?.articles ?? [], envoyesCetteSemaine: etat?.envoyesCetteSemaine ?? 0, exemples: etat?.exemples ?? false, supprimer };
}
