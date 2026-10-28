import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import { creerActiviteApi } from "@sos-miam/commun/client-api/api/api-activite";
import { creerCompteApi } from "@sos-miam/commun/client-api/api/api-compte";
import { creerContenuApi } from "@sos-miam/commun/client-api/api/api-contenu";
import { creerServicesSociauxApi } from "@sos-miam/commun/client-api/api/creer-services-sociaux-api";
import { creerClientHttp } from "@sos-miam/commun/client-api/client-http";
import type { SessionOuverte } from "@sos-miam/commun/client-api/contrat-compte";
import type { CompteApp } from "@sos-miam/commun/types/compte-app";
import { observerCompteLimite } from "~/fonctions/compte/observer-compte-limite";
import { ContexteSession, type ValeurSession } from "~/hooks/utiliser-session";
import { ADRESSE_API } from "~/services/adresse-api";
import { signalerCompteLimite } from "~/services/refus-compte-limite";
import { lireLangueActuelle } from "~/services/langue-actuelle";
import { VERSION_INSTALLEE } from "~/services/version-installee";
import { oublierCleApercu } from "~/stockage/cle-apercu";
import { effacerJetonSession, enregistrerJetonSession, lireJetonSession } from "~/stockage/session-compte";

/**
 * La session du compte unique : le jeton (coffre-fort du téléphone), le compte relu sur le serveur au démarrage et au retour
 * dans l'app, et le client HTTP de l'API qui s'en sert. Une session que l'API dit expirée est oubliée tout de suite. Sans
 * compte connecté, rien ne change : l'app tourne comme avant.
 */
export function FournisseurSession({ children }: { children: ReactNode }) {
  const [pret, setPret] = useState(false);
  const [jeton, setJeton] = useState<string | null>(null);
  const [compte, setCompte] = useState<CompteApp | null>(null);
  // La session a pris fin sans que tu le demandes (le serveur l'a dite expirée) : l'app te le dira et te ramènera à « Me connecter »
  const [perdue, setPerdue] = useState(false);
  const jetonActuel = useRef<string | null>(null);

  const oublier = useCallback(async (parLeServeur = false) => {
    if (parLeServeur && jetonActuel.current) setPerdue(true);
    jetonActuel.current = null;
    setJeton(null);
    setCompte(null);
    await effacerJetonSession();
    await oublierCleApercu();
  }, []);

  // Un seul client pour toute l'app : il relit le jeton à chaque demande. Une écriture refusée « compte-limite » est signalée
  // à l'annonce de toute l'app (AnnonceCompteLimite) ; la réponse arrive telle quelle à l'écran
  const client = useMemo(
    () =>
      observerCompteLimite(
        creerClientHttp({ adresse: ADRESSE_API, lireJeton: () => jetonActuel.current, surSessionExpiree: () => void oublier(true), versionApp: VERSION_INSTALLEE ?? undefined, lireLangue: lireLangueActuelle }),
        signalerCompteLimite,
      ),
    [oublier],
  );
  // Les services sociaux (potes, messages, cloche…) en version API : une visite n'a rien
  const services = useMemo(
    () => ({ comptes: creerCompteApi(client), contenu: creerContenuApi(client), activite: creerActiviteApi(client), sociaux: creerServicesSociauxApi(client) }),
    [client],
  );

  const rafraichir = useCallback(async () => {
    if (!jetonActuel.current) return;
    const r = await services.comptes.lireCompte();
    if (r.ok) setCompte(r.compte);
    // « connexion-requise » : surSessionExpiree a déjà tout oublié ; hors ligne : on garde le jeton, on réessaiera
  }, [services]);

  useEffect(() => {
    let actif = true;
    lireJetonSession().then(async (lu) => {
      if (!actif) return;
      jetonActuel.current = lu;
      setJeton(lu);
      setPret(true);
      if (lu) await rafraichir();
    });
    // De retour dans l'app : le compte a pu changer (rôle validé, e-mail confirmé, points)
    const abonnement = AppState.addEventListener("change", (etat) => {
      if (etat === "active") void rafraichir();
    });
    return () => {
      actif = false;
      abonnement.remove();
    };
  }, [rafraichir]);

  const ouvrir = useCallback(async (session: SessionOuverte) => {
    await enregistrerJetonSession(session.session);
    setPerdue(false);
    jetonActuel.current = session.session;
    setJeton(session.session);
    setCompte(session.compte);
  }, []);

  const fermer = useCallback(
    async (o: { prevenirServeur?: boolean } = {}) => {
      // Le serveur ferme la session s'il répond ; sinon, elle mourra seule (un an sans usage)
      if (o.prevenirServeur !== false && jetonActuel.current) await services.comptes.deconnecter().catch(() => undefined);
      await oublier();
    },
    [services, oublier],
  );

  const valeur = useMemo<ValeurSession>(
    () => ({ pret, connecte: jeton !== null, perdue, compte, client, ...services, ouvrir, fermer, rafraichir }),
    [pret, jeton, perdue, compte, client, services, ouvrir, fermer, rafraichir],
  );
  return <ContexteSession.Provider value={valeur}>{children}</ContexteSession.Provider>;
}
