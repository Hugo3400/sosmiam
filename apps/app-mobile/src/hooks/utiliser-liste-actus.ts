import { useCallback, useEffect, useRef, useState } from "react";

import type { ArticleActusAffiche } from "~/contenus/type-article-actus";
import type { FiltreActus } from "~/contenus/type-filtre-actus";
import { convertirArticleActus } from "~/fonctions/actus/convertir-article-actus";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserServiceActus } from "~/hooks/utiliser-service-actus";

type EtatListe = { cle: string; articles: ArticleActusAffiche[]; suivant: string | null; enEchec: boolean };

export function utiliserListeActus(filtre: FiltreActus) {
  const rubrique = filtre === "abonnements" ? null : filtre;
  const { service } = utiliserServiceActus();
  const { invite } = utiliserProfil();
  const cle = `${filtre ?? "tout"}-${invite ? "invite" : "compte"}`;
  const [etat, setEtat] = useState<EtatListe | null>(null);
  const [numero, setNumero] = useState(0);
  const suiteEnCours = useRef(false);

  useEffect(() => {
    let actif = true;
    const lire = filtre === "abonnements" ? service.abonnements().then((r) => (r.ok ? { ...r, suivant: null } : r)) : service.lister({ rubrique, ville: null, curseur: null });
    void lire.then((r) => {
      if (!actif) return;
      if (r.ok) return setEtat({ cle, articles: r.articles.map(convertirArticleActus), suivant: r.suivant, enEchec: false });
      setEtat({ cle, articles: [], suivant: null, enEchec: true });
    });
    return () => {
      actif = false;
    };
  }, [service, filtre, rubrique, invite, cle, numero]);

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
