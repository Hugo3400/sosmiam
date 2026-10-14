import { useCallback, useEffect, useRef, useState } from "react";

import type { SessionOuverte } from "@sos-miam/commun/client-api/contrat-compte";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { INTERVALLE_ATTENTE_QR_MS } from "~/contenus/connexion-qr";
import type { ServiceConnexionQr } from "~/services/demo/connexion-qr-demo";

export type EtatAffichageQr = "chargement" | "attente" | "scanne" | "accepte" | "refuse" | "expire" | "erreur";
type Demande = { code: string; secret: string; expireLe: number };

/**
 * Un téléphone pas encore connecté montre un QR, et attend qu'un téléphone connecté l'accepte : il demande où ça en est
 * toutes les 2 secondes. Un QR qui expire sans avoir été scanné est remplacé tout seul ; après un scan, un refus ou une
 * expiration se disent, et on redemande un QR d'un geste. Le secret de l'attente ne quitte jamais ce téléphone.
 */
export function utiliserAttenteConnexionQr(service: ServiceConnexionQr, surAccepte: (ouverte: SessionOuverte | null) => void) {
  const [demande, setDemande] = useState<Demande | null>(null);
  const [etat, setEtat] = useState<EtatAffichageQr>("chargement");
  const [erreur, setErreur] = useState<ErreurService | null>(null);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const rappel = useRef(surAccepte);
  rappel.current = surAccepte;
  // L'état lu par l'interrogation (sans relancer le minuteur à chaque changement)
  const etatLu = useRef(etat);
  etatLu.current = etat;

  const nouvelle = useCallback(async () => {
    setEtat("chargement");
    const r = await service.demander("app");
    if (!r.ok) {
      setErreur(r.erreur);
      return setEtat("erreur");
    }
    setDemande({ code: r.code, secret: r.secret, expireLe: new Date(r.expireLe).getTime() });
    setMaintenant(Date.now());
    setEtat("attente");
  }, [service]);

  useEffect(() => {
    void nouvelle();
  }, [nouvelle]);

  // Où ça en est, toutes les 2 secondes, tant qu'on attend (et rien une fois l'écran quitté)
  const enAttente = demande !== null && (etat === "attente" || etat === "scanne");
  useEffect(() => {
    if (!enAttente || !demande) return;
    let actif = true;
    const minuteur = setInterval(() => {
      setMaintenant(Date.now());
      void service.attendre(demande.secret).then((r) => {
        if (!actif || !r.ok) return;
        if (r.etat === "accepte") {
          actif = false;
          setEtat("accepte");
          return rappel.current(r.ouverte);
        }
        // Pas encore scanné et déjà expiré : un nouveau QR, sans rien dire
        if (r.etat === "expire") {
          actif = false;
          if (etatLu.current === "attente") return void nouvelle();
          return setEtat("expire");
        }
        setEtat(r.etat);
      });
    }, INTERVALLE_ATTENTE_QR_MS);
    return () => {
      actif = false;
      clearInterval(minuteur);
    };
  }, [enAttente, demande, service, nouvelle]);

  const secondesRestantes = demande ? Math.max(0, Math.ceil((demande.expireLe - maintenant) / 1000)) : 0;
  return { demande, etat, erreur, secondesRestantes, nouvelle };
}
