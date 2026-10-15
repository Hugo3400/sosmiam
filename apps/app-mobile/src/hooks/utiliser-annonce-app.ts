import { usePathname } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ServiceAnnoncesApp } from "@sos-miam/commun/client-api/contrat-annonces-app";
import { DELAI_RETOUR_ANNONCE_APP_MS } from "@sos-miam/commun/regles/annonces-app";
import type { AnnonceApp } from "@sos-miam/commun/types/annonce-app";
import { choisirAnnonceApp } from "~/fonctions/annonces-app/choisir-annonce-app";
import { estSurOngletsPrincipaux } from "~/fonctions/annonces-app/est-sur-onglets-principaux";
import { utiliserFeuilleOuverte } from "~/hooks/utiliser-feuille-ouverte";
import { utiliserPremierPlan } from "~/hooks/utiliser-premier-plan";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserSession } from "~/hooks/utiliser-session";
import { annoncesAppSansCompte } from "~/services/annonces-app-sans-compte";
import { lireAnnoncesAppVues, noterAnnonceAppVue } from "~/stockage/annonces-app-vues";

const DELAI_CALME_MS = 1_200;
const DELAI_AFFICHAGE_MS = 400;

type Prochaine = { annonce: AnnonceApp; service: ServiceAnnoncesApp };

export type EtatAnnonceApp = { annonce: AnnonceApp | null; ouverte: boolean; fermer: () => void };

export function utiliserAnnonceApp(): EtatAnnonceApp {
  const services = utiliserServices();
  const { pret: sessionPrete } = utiliserSession();
  const { profil, invite } = utiliserProfil();
  const chemin = usePathname();
  const feuilleOuverte = utiliserFeuilleOuverte();
  const { auPremierPlan, retoursApresAbsence } = utiliserPremierPlan(DELAI_RETOUR_ANNONCE_APP_MS);
  const [affichage, setAffichage] = useState<{ annonce: AnnonceApp; ouverte: boolean } | null>(null);
  const [prochaine, setProchaine] = useState<Prochaine | null>(null);
  const occasionLue = useRef<number | null>(null);
  const monte = useRef(true);

  const service = services.source === "indisponible" ? annoncesAppSansCompte : services.annoncesApp;
  const ville = profil?.ville.trim() || null;
  const enAttente = prochaine !== null && prochaine.service === service ? prochaine.annonce : null;
  const ouverte = affichage?.ouverte ?? false;
  const libre =
    sessionPrete && auPremierPlan && (profil !== null || invite) && estSurOngletsPrincipaux(chemin) && !feuilleOuverte && !ouverte;

  useEffect(() => {
    monte.current = true;
    return () => {
      monte.current = false;
    };
  }, []);

  useEffect(() => {
    if (!libre || enAttente !== null || occasionLue.current === retoursApresAbsence) return;
    const minuterie = setTimeout(() => {
      occasionLue.current = retoursApresAbsence;
      Promise.all([service.lister(ville), lireAnnoncesAppVues()])
        .then(([reponse, vues]) => {
          if (!monte.current || !reponse.ok) return;
          const choisie = choisirAnnonceApp(reponse.annonces, vues, Date.now());
          if (choisie) setProchaine({ annonce: choisie, service });
        })
        .catch(() => undefined);
    }, DELAI_CALME_MS);
    return () => clearTimeout(minuterie);
  }, [libre, enAttente, retoursApresAbsence, service, ville]);

  useEffect(() => {
    if (!libre || enAttente === null) return;
    const minuterie = setTimeout(() => {
      occasionLue.current = retoursApresAbsence;
      setProchaine(null);
      if (choisirAnnonceApp([enAttente], [], Date.now()) === null) return;
      setAffichage({ annonce: enAttente, ouverte: true });
      noterAnnonceAppVue(enAttente.id).catch(() => undefined);
    }, DELAI_AFFICHAGE_MS);
    return () => clearTimeout(minuterie);
  }, [libre, enAttente, retoursApresAbsence]);

  const fermer = useCallback(() => setAffichage((avant) => (avant ? { ...avant, ouverte: false } : null)), []);

  return { annonce: affichage?.annonce ?? null, ouverte, fermer };
}
