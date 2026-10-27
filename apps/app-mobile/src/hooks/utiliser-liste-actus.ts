import { useCallback, useEffect, useRef, useState } from "react";

import type { RubriqueActus } from "@sos-miam/commun/regles/actus";
import type { ArticleActusAffiche } from "~/contenus/type-article-actus";
import { convertirArticleActus } from "~/fonctions/actus/convertir-article-actus";
import { lireExemplesActus } from "~/fonctions/actus/lire-exemples-actus";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserServiceActus } from "~/hooks/utiliser-service-actus";
import { EXEMPLES_ACTUS_EN_SECOURS } from "~/services/actus-visibles";

type EtatListe = { cle: string; articles: ArticleActusAffiche[]; suivant: string | null; enEchec: boolean };

export function utiliserListeActus(rubrique: RubriqueActus | null) {
  const { service } = utiliserServiceActus();
  const { invite } = utiliserProfil();
  const cle = `${rubrique ?? "tout"}-${invite ? "invite" : "compte"}`;
  const [etat, setEtat] = useState<EtatListe | null>(null);
  const [numero, setNumero] = useState(0);
  const suiteEnCours = useRef(false);

  useEffect(() => {
    let actif = true;
    void service.lister({ rubrique, ville: null, curseur: null }).then((r) => {
      if (!actif) return;
      if (r.ok) return setEtat({ cle, articles: r.articles.map(convertirArticleActus), suivant: r.suivant, enEchec: false });
      setEtat({ cle, articles: EXEMPLES_ACTUS_EN_SECOURS ? lireExemplesActus(rubrique, invite) : [], suivant: null, enEchec: true });
    });
    return () => {
      actif = false;
    };
  }, [service, rubrique, invite, cle, numero]);

  const chargerSuite = useCallback(async () => {
    const curseur = etat?.cle === cle ? etat.suivant : null;
    if (!curseur || suiteEnCours.current) return;
    suiteEnCours.current = true;
    try {
      const r = await service.lister({ rubrique, ville: null, curseur });
      if (r.ok) {
        setEtat((avant) => (avant?.cle === cle ? { ...avant, articles: [...avant.articles, ...r.articles.map(convertirArticleActus)], suivant: r.suivant } : avant));
      }
    } finally {
      suiteEnCours.current = false;
    }
  }, [etat, cle, service, rubrique]);

  const pret = etat?.cle === cle;
  return {
    articles: pret ? etat.articles : [],
    chargement: !pret,
    enEchec: pret && etat.enEchec,
    aUneSuite: pret && etat.suivant !== null,
    chargerSuite,
    rafraichir: useCallback(() => setNumero((n) => n + 1), []),
  };
}
