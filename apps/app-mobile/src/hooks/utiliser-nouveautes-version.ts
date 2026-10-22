import { usePathname } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { NOUVEAUTES_VERSIONS, type NouveautesVersion } from "~/contenus/nouveautes-versions";
import { estSurOngletsPrincipaux } from "~/fonctions/annonces-app/est-sur-onglets-principaux";
import { choisirNouveautesAMontrer } from "~/fonctions/nouveautes/choisir-nouveautes-a-montrer";
import { utiliserFenetreDouce } from "~/hooks/utiliser-fenetre-douce";
import { utiliserFeuilleOuverte } from "~/hooks/utiliser-feuille-ouverte";
import { utiliserPremierPlan } from "~/hooks/utiliser-premier-plan";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { prendreFenetreDouce, rendreFenetreDouce } from "~/services/fenetre-douce-ouverte";
import { lireNotificationOuverteLe } from "~/services/notification-ouverte";
import { VERSION_INSTALLEE } from "~/services/version-installee";
import { lireNouveautesVues, noterNouveautesVues } from "~/stockage/nouveautes-vues";

const DELAI_CALME_MS = 1_000;
const SECOURS_AFFICHAGE_MS = 1_500;
const NOTIFICATION_RECENTE_MS = 10_000;

export type OuvertureNouveautes = { nouveautes: NouveautesVersion | null; ouverte: boolean; fermer: () => void; marquerMontree: () => void };

function attendreApresNotification(maintenant: number): number {
  const ouverteLe = lireNotificationOuverteLe();
  return ouverteLe === null ? 0 : Math.max(0, ouverteLe + NOTIFICATION_RECENTE_MS - maintenant);
}

export function utiliserNouveautesVersion(installee: string | null = VERSION_INSTALLEE): OuvertureNouveautes {
  const { pret: sessionPrete } = utiliserSession();
  const { profil, chargement } = utiliserProfil();
  const chemin = usePathname();
  const feuilleOuverte = utiliserFeuilleOuverte();
  const fenetreDouce = utiliserFenetreDouce();
  const { auPremierPlan } = utiliserPremierPlan(0);
  const [vue, setVue] = useState<string | null | undefined>(undefined);
  const [ratee, setRatee] = useState(false);
  const [affichage, setAffichage] = useState<{ nouveautes: NouveautesVersion; ouverte: boolean } | null>(null);
  const [relances, setRelances] = useState(0);
  const montree = useRef(false);

  const inscrit = profil !== null;
  const choix = vue === undefined || chargement ? null : choisirNouveautesAMontrer({ installee, vue, inscrit, versions: NOUVEAUTES_VERSIONS });
  const aMontrer = ratee ? null : (choix?.aMontrer ?? null);
  const aNoter = choix?.aNoterSansMontrer ?? null;
  const nouveautesAffichees = affichage?.nouveautes ?? null;
  const ouverte = affichage?.ouverte ?? false;
  const surOnglets = estSurOngletsPrincipaux(chemin);
  const autreFenetre = fenetreDouce !== null && fenetreDouce !== "nouveautes";
  const libre = sessionPrete && auPremierPlan && inscrit && surOnglets && !feuilleOuverte && !autreFenetre && !ouverte;

  const fermer = useCallback(() => setAffichage((avant) => (avant ? { ...avant, ouverte: false } : null)), []);

  const noter = useCallback((version: string) => {
    setVue(version);
    noterNouveautesVues(version).catch(() => undefined);
  }, []);

  const marquerMontree = useCallback(() => {
    if (montree.current || nouveautesAffichees === null) return;
    montree.current = true;
    noter(nouveautesAffichees.version);
  }, [nouveautesAffichees, noter]);

  useEffect(() => {
    let monte = true;
    lireNouveautesVues()
      .catch(() => null)
      .then((version) => {
        if (monte) setVue(version);
      });
    return () => {
      monte = false;
      rendreFenetreDouce("nouveautes");
    };
  }, []);

  useEffect(() => {
    if (aNoter !== null) noter(aNoter);
  }, [aNoter, noter]);

  useEffect(() => {
    if (!ouverte) rendreFenetreDouce("nouveautes");
  }, [ouverte]);

  useEffect(() => {
    if (!libre || aMontrer === null) return;
    const minuterie = setTimeout(
      () => {
        if (attendreApresNotification(Date.now()) > 0) {
          setRelances((n) => n + 1);
          return;
        }
        if (!prendreFenetreDouce("nouveautes")) return;
        montree.current = false;
        setAffichage({ nouveautes: aMontrer, ouverte: true });
      },
      Math.max(DELAI_CALME_MS, attendreApresNotification(Date.now())),
    );
    return () => clearTimeout(minuterie);
  }, [libre, aMontrer, relances]);

  useEffect(() => {
    if (!ouverte) return;
    const secours = setTimeout(() => {
      if (montree.current) return;
      setRatee(true);
      fermer();
    }, SECOURS_AFFICHAGE_MS);
    return () => clearTimeout(secours);
  }, [ouverte, fermer]);

  useEffect(() => {
    if (ouverte && !surOnglets) fermer();
  }, [ouverte, surOnglets, fermer]);

  return { nouveautes: nouveautesAffichees, ouverte, fermer, marquerMontree };
}
