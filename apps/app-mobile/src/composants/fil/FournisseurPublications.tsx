import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import type { PublicationApi } from "@sos-miam/commun/types/publication";
import type { Publication } from "~/contenus/type-publication";
import { convertirPublicationApi } from "~/fonctions/publications/convertir-publication-api";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { ContextePublications, type EtatPublications } from "~/hooks/utiliser-publications";
import { utiliserSession } from "~/hooks/utiliser-session";
import { enregistrerPublicationsServeur, lirePublicationsServeur } from "~/stockage/publications-serveur";
import { TAILLE_PAGE_FIL } from "~/contenus/taille-page-fil";

// Une relecture au retour dans l'app, au plus toutes les 10 minutes ; 20 publications par page (le maximum de l'API : 30)
const RELECTURE_MS = 10 * 60_000;

/** Pour chaque publication lue : ton J'aime était-il déjà sur le serveur à ce moment-là (son compteur le compte alors) ? */
type AimeesALaLecture = Readonly<Record<string, boolean>>;

/** Note l'état de ton J'aime sur le serveur pour ces publications ; `connus` null : pas encore connu (rien de noté) */
function noterAimees(deja: AimeesALaLecture, publications: PublicationApi[], connus: readonly string[] | null, garderDeja = false): AimeesALaLecture {
  const suivant: Record<string, boolean> = { ...deja };
  for (const p of publications) {
    if (garderDeja && p.id in suivant) continue;
    if (connus) suivant[p.id] = connus.includes(p.id);
    else delete suivant[p.id];
  }
  return suivant;
}

/**
 * La source du fil « Pour toi » et de tout ce qui montre une publication (vignettes, profils, notifications) : les
 * publications du serveur (GET /app/publications), page après page, avec la première page gardée sur le téléphone pour
 * s'ouvrir tout de suite et hors ligne. Le compteur de J'aime du serveur compte déjà le tien : chaque page lue note s'il y
 * était (jaimesServeur de l'activité), pour que le fil ne le compte jamais deux fois.
 */
export function FournisseurPublications({ children }: { children: ReactNode }) {
  const { contenu, connecte } = utiliserSession();
  const { jaimesServeur } = utiliserActivite();
  const [lues, setLues] = useState<PublicationApi[] | null>(null);
  const [aimees, setAimees] = useState<AimeesALaLecture>({});
  // Les J'aime du serveur à l'instant où une page arrive (lus dans les réponses, jamais pendant le rendu). Écart connu, borné
  // à la relecture suivante (comme le cache de 30 s des compteurs) : une page relue juste avant ton activité (même retour dans
  // l'app) note un J'aime fait sur un autre appareil comme absent, et son compteur affiche un J'aime de plus
  const jaimesConnus = useRef(jaimesServeur);
  const [suite, setSuite] = useState<string | null>(null);
  const [horsLigne, setHorsLigne] = useState(false);
  const derniereLecture = useRef(0);
  const enCours = useRef(false);

  useEffect(() => {
    jaimesConnus.current = jaimesServeur;
  }, [jaimesServeur]);

  // Ton activité arrive (ou un autre compte se connecte, ou personne) : les publications déjà lues sont notées à nouveau
  const sourceJaimes = `${connecte}:${jaimesServeur !== null}`;
  const [sourceNotee, setSourceNotee] = useState(sourceJaimes);
  if (sourceNotee !== sourceJaimes) {
    setSourceNotee(sourceJaimes);
    if (jaimesServeur && lues) setAimees(noterAimees({}, lues, jaimesServeur));
  }

  const recharger = useCallback(async () => {
    derniereLecture.current = Date.now();
    const r = await contenu.listerPublications(null, TAILLE_PAGE_FIL);
    if (!r.ok) return setHorsLigne(true);
    const connus = jaimesConnus.current;
    setHorsLigne(false);
    setLues(r.publications);
    setAimees((deja) => noterAimees(deja, r.publications, connus));
    setSuite(r.suite);
    await enregistrerPublicationsServeur(r.publications);
  }, [contenu]);

  const chargerSuite = useCallback(async () => {
    if (!suite || enCours.current) return;
    enCours.current = true;
    try {
      const r = await contenu.listerPublications(suite, TAILLE_PAGE_FIL);
      if (!r.ok) return setHorsLigne(true);
      const connus = jaimesConnus.current;
      setHorsLigne(false);
      setAimees((deja) => noterAimees(deja, r.publications, connus));
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
    let actif = true;
    lirePublicationsServeur().then((copie) => {
      if (!actif || !copie) return;
      const connus = jaimesConnus.current;
      setLues((deja) => deja ?? copie);
      setAimees((deja) => noterAimees(deja, copie, connus, true));
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

  const publications = useMemo<Publication[]>(
    () => (lues ?? []).map((p) => convertirPublicationApi(p, aimees[p.id] ?? false)),
    [lues, aimees],
  );
  const parId = useMemo(() => new Map(publications.map((p) => [p.id, p] as const)), [publications]);

  const valeur = useMemo<EtatPublications>(
    () => ({
      publications,
      trouverPublication: (id) => parId.get(id),
      pret: lues !== null || horsLigne,
      horsLigne,
      aUneSuite: suite !== null,
      chargerSuite,
      recharger,
    }),
    [publications, parId, lues, horsLigne, suite, chargerSuite, recharger],
  );
  return <ContextePublications.Provider value={valeur}>{children}</ContextePublications.Provider>;
}
