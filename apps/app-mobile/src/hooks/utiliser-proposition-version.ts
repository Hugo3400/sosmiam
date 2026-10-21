import { usePathname } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { estSurOngletsPrincipaux } from "~/fonctions/annonces-app/est-sur-onglets-principaux";
import { comparerVersions } from "~/fonctions/version/comparer-versions";
import type { EtatVersion } from "~/fonctions/version/decider-etat-version";
import { utiliserFenetreDouce } from "~/hooks/utiliser-fenetre-douce";
import { utiliserFeuilleOuverte } from "~/hooks/utiliser-feuille-ouverte";
import { utiliserPremierPlan } from "~/hooks/utiliser-premier-plan";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { prendreFenetreDouce, rendreFenetreDouce } from "~/services/fenetre-douce-ouverte";
import { lireNotificationOuverteLe } from "~/services/notification-ouverte";
import { lireVersionDejaProposee, noterVersionDejaProposee } from "~/stockage/version-deja-proposee";

const DELAI_CALME_MS = 1_500;
const SECOURS_AFFICHAGE_MS = 1_500;
const NOTIFICATION_RECENTE_MS = 10_000;

export type PropositionVersion = { version: string | null; ouverte: boolean; fermer: () => void; marquerMontree: () => void };

function attendreApresNotification(maintenant: number): number {
  const ouverteLe = lireNotificationOuverteLe();
  return ouverteLe === null ? 0 : Math.max(0, ouverteLe + NOTIFICATION_RECENTE_MS - maintenant);
}

export function utiliserPropositionVersion(etat: EtatVersion): PropositionVersion {
  const { pret: sessionPrete } = utiliserSession();
  const { profil, invite } = utiliserProfil();
  const chemin = usePathname();
  const feuilleOuverte = utiliserFeuilleOuverte();
  const fenetreDouce = utiliserFenetreDouce();
  const { auPremierPlan } = utiliserPremierPlan(0);
  const [dejaProposee, setDejaProposee] = useState<string | null | undefined>(undefined);
  const [ratee, setRatee] = useState<string | null>(null);
  const [affichage, setAffichage] = useState<{ version: string; ouverte: boolean } | null>(null);
  const [relances, setRelances] = useState(0);
  const montree = useRef(false);

  const proposee = etat.etat === "nouvelle-version" ? etat.version : null;
  const nouvelle = proposee !== null && dejaProposee !== undefined && proposee !== ratee && (dejaProposee === null || comparerVersions(proposee, dejaProposee) > 0);
  const aProposer = nouvelle ? proposee : null;
  const versionAffichee = affichage?.version ?? null;
  const ouverte = affichage?.ouverte ?? false;
  const surOnglets = estSurOngletsPrincipaux(chemin);
  const autreFenetre = fenetreDouce !== null && fenetreDouce !== "nouvelle-version";
  const libre = sessionPrete && auPremierPlan && (profil !== null || invite) && surOnglets && !feuilleOuverte && !autreFenetre && !ouverte;

  const fermer = useCallback(() => setAffichage((avant) => (avant ? { ...avant, ouverte: false } : null)), []);

  const marquerMontree = useCallback(() => {
    if (montree.current || versionAffichee === null) return;
    montree.current = true;
    setDejaProposee(versionAffichee);
    noterVersionDejaProposee(versionAffichee).catch(() => undefined);
  }, [versionAffichee]);

  useEffect(() => {
    let monte = true;
    lireVersionDejaProposee()
      .catch(() => null)
      .then((version) => {
        if (monte) setDejaProposee(version);
      });
    return () => {
      monte = false;
      rendreFenetreDouce("nouvelle-version");
    };
  }, []);

  useEffect(() => {
    if (!ouverte) rendreFenetreDouce("nouvelle-version");
  }, [ouverte]);

  useEffect(() => {
    if (!libre || aProposer === null) return;
    const minuterie = setTimeout(
      () => {
        if (attendreApresNotification(Date.now()) > 0) {
          setRelances((n) => n + 1);
          return;
        }
        if (!prendreFenetreDouce("nouvelle-version")) return;
        montree.current = false;
        setAffichage({ version: aProposer, ouverte: true });
      },
      Math.max(DELAI_CALME_MS, attendreApresNotification(Date.now())),
    );
    return () => clearTimeout(minuterie);
  }, [libre, aProposer, relances]);

  useEffect(() => {
    if (!ouverte) return;
    const secours = setTimeout(() => {
      if (montree.current) return;
      setRatee(versionAffichee);
      fermer();
    }, SECOURS_AFFICHAGE_MS);
    return () => clearTimeout(secours);
  }, [ouverte, versionAffichee, fermer]);

  useEffect(() => {
    if (ouverte && !surOnglets) fermer();
  }, [ouverte, surOnglets, fermer]);

  return { version: versionAffichee, ouverte, fermer, marquerMontree };
}
