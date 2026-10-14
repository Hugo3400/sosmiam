import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import type { PublicationApi } from "@sos-miam/commun/types/publication";
import { publicationsExemples } from "~/contenus/publications-exemples";
import type { Publication } from "~/contenus/type-publication";
import { convertirPublicationApi } from "~/fonctions/publications/convertir-publication-api";
import { ContextePublications, type EtatPublications } from "~/hooks/utiliser-publications";
import { utiliserSession } from "~/hooks/utiliser-session";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";
import { enregistrerPublicationsServeur, lirePublicationsServeur } from "~/stockage/publications-serveur";

// Une relecture au retour dans l'app, au plus toutes les 10 minutes ; 20 publications par page (le maximum de l'API : 30)
const RELECTURE_MS = 10 * 60_000;
const PAR_PAGE = 20;

/**
 * La source du fil « Pour toi » et de tout ce qui montre une publication (vignettes, profils, notifications). Mode démo :
 * les publications d'exemple. Sinon : celles du serveur (GET /app/publications), page après page, avec la première page
 * gardée sur le téléphone pour s'ouvrir tout de suite et hors ligne.
 */
export function FournisseurPublications({ children }: { children: ReactNode }) {
  const { contenu } = utiliserSession();
  const [lues, setLues] = useState<PublicationApi[] | null>(null);
  const [suite, setSuite] = useState<string | null>(null);
  const [horsLigne, setHorsLigne] = useState(false);
  const derniereLecture = useRef(0);
  const enCours = useRef(false);

  const recharger = useCallback(async () => {
    if (DEMO_VISITES_ACTIVE) return;
    derniereLecture.current = Date.now();
    const r = await contenu.listerPublications(null, PAR_PAGE);
    if (!r.ok) return setHorsLigne(true);
    setHorsLigne(false);
    setLues(r.publications);
    setSuite(r.suite);
    await enregistrerPublicationsServeur(r.publications);
  }, [contenu]);

  const chargerSuite = useCallback(async () => {
    if (DEMO_VISITES_ACTIVE || !suite || enCours.current) return;
    enCours.current = true;
    try {
      const r = await contenu.listerPublications(suite, PAR_PAGE);
      if (!r.ok) return setHorsLigne(true);
      setHorsLigne(false);
      // Une publication déjà là (le fil a bougé entre deux pages) n'est pas doublée
      setLues((deja) => {
        const ids = new Set((deja ?? []).map((p) => p.id));
        return [...(deja ?? []), ...r.publications.filter((p) => !ids.has(p.id))];
      });
      setSuite(r.suite);
    } finally {
      enCours.current = false;
    }
  }, [contenu, suite]);

  useEffect(() => {
    if (DEMO_VISITES_ACTIVE) return;
    let actif = true;
    lirePublicationsServeur().then((copie) => {
      if (actif && copie) setLues((deja) => deja ?? copie);
    });
    void recharger();
    const abonnement = AppState.addEventListener("change", (etat) => {
      if (etat === "active" && Date.now() - derniereLecture.current > RELECTURE_MS) void recharger();
    });
    return () => {
      actif = false;
      abonnement.remove();
    };
  }, [recharger]);

  const publications = useMemo<Publication[]>(() => (DEMO_VISITES_ACTIVE ? publicationsExemples : (lues ?? []).map(convertirPublicationApi)), [lues]);
  const parId = useMemo(() => new Map(publications.map((p) => [p.id, p] as const)), [publications]);

  const valeur = useMemo<EtatPublications>(
    () => ({
      publications,
      trouverPublication: (id) => parId.get(id),
      pret: DEMO_VISITES_ACTIVE || lues !== null || horsLigne,
      source: DEMO_VISITES_ACTIVE ? "demo" : "serveur",
      horsLigne,
      aUneSuite: !DEMO_VISITES_ACTIVE && suite !== null,
      chargerSuite,
      recharger,
    }),
    [publications, parId, lues, horsLigne, suite, chargerSuite, recharger],
  );
  return <ContextePublications.Provider value={valeur}>{children}</ContextePublications.Provider>;
}
