import { usePathname } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import type { ServiceAnnoncesApp } from "@sos-miam/commun/client-api/contrat-annonces-app";
import { DELAI_RETOUR_ANNONCE_APP_MS } from "@sos-miam/commun/regles/annonces-app";
import type { AnnonceApp } from "@sos-miam/commun/types/annonce-app";
import { choisirAnnonceApp } from "~/fonctions/annonces-app/choisir-annonce-app";
import { estSurOngletsPrincipaux } from "~/fonctions/annonces-app/est-sur-onglets-principaux";
import { utiliserFenetreDouce } from "~/hooks/utiliser-fenetre-douce";
import { utiliserFeuilleOuverte } from "~/hooks/utiliser-feuille-ouverte";
import { utiliserPremierPlan } from "~/hooks/utiliser-premier-plan";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserSession } from "~/hooks/utiliser-session";
import { annoncesAppSansCompte } from "~/services/annonces-app-sans-compte";
import { estFenetreDouceLibre, prendreFenetreDouce, rendreFenetreDouce } from "~/services/fenetre-douce-ouverte";
import { lireNotificationOuverteLe } from "~/services/notification-ouverte";
import { lireAnnoncesAppVues, noterAnnonceAppVue } from "~/stockage/annonces-app-vues";

const DELAI_CALME_MS = 1_200;
const DELAI_AFFICHAGE_MS = Platform.OS === "ios" ? 750 : 400;
const SECOURS_AFFICHAGE_MS = 1_500;
const NOTIFICATION_RECENTE_MS = 10_000;

type Prochaine = { annonce: AnnonceApp; service: ServiceAnnoncesApp; demandeeLe: number };

export type EtatAnnonceApp = { annonce: AnnonceApp | null; ouverte: boolean; fermer: () => void; marquerMontree: () => void };

function estNotificationOuverteDepuis(instant: number): boolean {
  const ouverteLe = lireNotificationOuverteLe();
  return ouverteLe !== null && ouverteLe >= instant;
}

export function utiliserAnnonceApp(): EtatAnnonceApp {
  const services = utiliserServices();
  const { pret: sessionPrete } = utiliserSession();
  const { profil, invite } = utiliserProfil();
  const chemin = usePathname();
  const feuilleOuverte = utiliserFeuilleOuverte();
  const fenetreDouce = utiliserFenetreDouce();
  const { auPremierPlan, retoursApresAbsence } = utiliserPremierPlan(DELAI_RETOUR_ANNONCE_APP_MS);
  const [affichage, setAffichage] = useState<{ annonce: AnnonceApp; ouverte: boolean } | null>(null);
  const [prochaine, setProchaine] = useState<Prochaine | null>(null);
  const occasionLue = useRef<number | null>(null);
  const montree = useRef(false);
  const monte = useRef(true);

  const service = services.source === "indisponible" ? annoncesAppSansCompte : services.annoncesApp;
  const ville = profil?.ville.trim() || null;
  const enAttente = prochaine !== null && prochaine.service === service ? prochaine : null;
  const annonceAffichee = affichage?.annonce ?? null;
  const ouverte = affichage?.ouverte ?? false;
  const surOnglets = estSurOngletsPrincipaux(chemin);
  const fenetreLibre = fenetreDouce === null || fenetreDouce === "annonce-app";
  const libre = sessionPrete && auPremierPlan && (profil !== null || invite) && surOnglets && !feuilleOuverte && fenetreLibre && !ouverte;

  const fermer = useCallback(() => setAffichage((avant) => (avant ? { ...avant, ouverte: false } : null)), []);

  const marquerMontree = useCallback(() => {
    if (montree.current || annonceAffichee === null) return;
    montree.current = true;
    noterAnnonceAppVue(annonceAffichee.id).catch(() => undefined);
  }, [annonceAffichee]);

  useEffect(() => {
    monte.current = true;
    return () => {
      monte.current = false;
      rendreFenetreDouce("annonce-app");
    };
  }, []);

  useEffect(() => {
    if (!ouverte) rendreFenetreDouce("annonce-app");
  }, [ouverte]);

  useEffect(() => {
    if (!libre || enAttente !== null || occasionLue.current === retoursApresAbsence) return;
    const minuterie = setTimeout(() => {
      occasionLue.current = retoursApresAbsence;
      const demandeeLe = Date.now();
      if (estNotificationOuverteDepuis(demandeeLe - NOTIFICATION_RECENTE_MS)) return;
      Promise.all([Promise.resolve().then(() => service.lister(ville)), lireAnnoncesAppVues()])
        .then(([reponse, vues]) => {
          if (!monte.current || !reponse.ok) return;
          const choisie = choisirAnnonceApp(reponse.annonces, vues, Date.now());
          if (choisie) setProchaine({ annonce: choisie, service, demandeeLe });
        })
        .catch(() => undefined);
    }, DELAI_CALME_MS);
    return () => clearTimeout(minuterie);
  }, [libre, enAttente, retoursApresAbsence, service, ville]);

  useEffect(() => {
    if (!libre || enAttente === null) return;
    const minuterie = setTimeout(() => {
      if (!estFenetreDouceLibre("annonce-app")) return;
      occasionLue.current = retoursApresAbsence;
      setProchaine(null);
      if (estNotificationOuverteDepuis(enAttente.demandeeLe - NOTIFICATION_RECENTE_MS)) return;
      if (choisirAnnonceApp([enAttente.annonce], [], Date.now()) === null) return;
      prendreFenetreDouce("annonce-app");
      montree.current = false;
      setAffichage({ annonce: enAttente.annonce, ouverte: true });
    }, DELAI_AFFICHAGE_MS);
    return () => clearTimeout(minuterie);
  }, [libre, enAttente, retoursApresAbsence]);

  useEffect(() => {
    if (!ouverte) return;
    const secours = setTimeout(() => {
      if (!montree.current) fermer();
    }, SECOURS_AFFICHAGE_MS);
    return () => clearTimeout(secours);
  }, [ouverte, fermer]);

  useEffect(() => {
    if (ouverte && !surOnglets) fermer();
  }, [ouverte, surOnglets, fermer]);

  return { annonce: annonceAffichee, ouverte, fermer, marquerMontree };
}
