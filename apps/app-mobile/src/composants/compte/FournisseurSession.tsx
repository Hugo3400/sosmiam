import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import { creerActiviteApi } from "@sos-miam/commun/client-api/api/api-activite";
import { creerCompteApi } from "@sos-miam/commun/client-api/api/api-compte";
import { creerContenuApi } from "@sos-miam/commun/client-api/api/api-contenu";
import { creerClientHttp } from "@sos-miam/commun/client-api/client-http";
import type { SessionOuverte } from "@sos-miam/commun/client-api/contrat-compte";
import type { CompteApp } from "@sos-miam/commun/types/compte-app";
import { ContexteSession, type ValeurSession } from "~/hooks/utiliser-session";
import { ADRESSE_API } from "~/services/adresse-api";
import { effacerJetonSession, enregistrerJetonSession, lireJetonSession } from "~/stockage/session-compte";

/**
 * La session du compte unique : le jeton (coffre-fort du téléphone), le compte relu sur le serveur au démarrage et au retour
 * dans l'app, et le client HTTP de l'API qui s'en sert. Une session que l'API dit expirée est oubliée tout de suite. Sans
 * compte connecté, rien ne change : l'app tourne comme avant (démo en développement).
 */
export function FournisseurSession({ children }: { children: ReactNode }) {
  const [pret, setPret] = useState(false);
  const [jeton, setJeton] = useState<string | null>(null);
  const [compte, setCompte] = useState<CompteApp | null>(null);
  const jetonActuel = useRef<string | null>(null);

  const oublier = useCallback(async () => {
    jetonActuel.current = null;
    setJeton(null);
    setCompte(null);
    await effacerJetonSession();
  }, []);

  // Un seul client pour toute l'app : il relit le jeton à chaque demande
  const client = useMemo(
    () => creerClientHttp({ adresse: ADRESSE_API, lireJeton: () => jetonActuel.current, surSessionExpiree: () => void oublier() }),
    [oublier],
  );
  const services = useMemo(() => ({ comptes: creerCompteApi(client), contenu: creerContenuApi(client), activite: creerActiviteApi(client) }), [client]);

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
    () => ({ pret, connecte: jeton !== null, compte, client, ...services, ouvrir, fermer, rafraichir }),
    [pret, jeton, compte, client, services, ouvrir, fermer, rafraichir],
  );
  return <ContexteSession.Provider value={valeur}>{children}</ContexteSession.Provider>;
}
