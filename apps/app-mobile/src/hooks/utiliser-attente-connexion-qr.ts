import { useCallback, useEffect, useRef, useState } from "react";

import type { SessionOuverte } from "@sos-miam/commun/client-api/contrat-compte";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { DUREE_QR_CONNEXION_S, ECHECS_ATTENTE_QR_MAX, INTERVALLE_ATTENTE_QR_MS, MARGE_FIN_QR_MS } from "~/contenus/connexion-qr";
import type { ServiceConnexionQr } from "~/hooks/utiliser-service-connexion-qr";

export type EtatAffichageQr = "chargement" | "attente" | "scanne" | "accepte" | "refuse" | "expire" | "erreur";
/** finLocale : la fin du QR comptée sur l'horloge de CE téléphone (jamais comparée à celle du serveur, qui peut être décalée) */
type Demande = { code: string; secret: string; finLocale: number };

/**
 * Un téléphone pas encore connecté montre un QR, et attend qu'un téléphone connecté l'accepte : il demande où ça en est
 * toutes les 2 secondes, une demande à la fois (« accepte » n'est rendu qu'une fois par l'API : une demande plus récente ne
 * doit jamais doubler celle qui l'apporte). Un QR qui expire sans avoir été scanné est remplacé tout seul, même si le
 * réseau a coupé ; après un scan, un refus ou une expiration se disent, et on redemande un QR d'un geste. Plusieurs échecs
 * d'affilée (pas de réseau, API en panne) se disent aussi. Le secret de l'attente ne quitte jamais ce téléphone.
 */
export function utiliserAttenteConnexionQr(service: ServiceConnexionQr, surAccepte: (ouverte: SessionOuverte) => void) {
  const [demande, setDemande] = useState<Demande | null>(null);
  const [etat, setEtat] = useState<EtatAffichageQr>("chargement");
  const [erreur, setErreur] = useState<ErreurService | null>(null);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const rappel = useRef(surAccepte);
  rappel.current = surAccepte;
  // L'état lu par l'interrogation (sans la relancer à chaque changement)
  const etatLu = useRef(etat);
  etatLu.current = etat;
  // Un seul QR demandé à la fois (le bouton, la fin du QR et une réponse « expire » peuvent tomber ensemble)
  const enPreparation = useRef(false);

  const nouvelle = useCallback(async () => {
    if (enPreparation.current) return;
    enPreparation.current = true;
    setDemande(null);
    setEtat("chargement");
    try {
      const avant = Date.now();
      const r = await service.demanderConnexionQr();
      if (!r.ok) {
        setErreur(r.erreur);
        return setEtat("erreur");
      }
      // Compté depuis l'envoi de la demande : jamais plus long que la vraie vie du QR
      setDemande({ code: r.code, secret: r.secret, finLocale: avant + DUREE_QR_CONNEXION_S * 1000 });
      setMaintenant(Date.now());
      setEtat("attente");
    } finally {
      enPreparation.current = false;
    }
  }, [service]);

  useEffect(() => {
    void nouvelle();
  }, [nouvelle]);

  // Où ça en est, tant qu'on attend : la demande suivante part 2 secondes après la réponse d'avant (et rien une fois l'écran quitté)
  const enAttente = demande !== null && (etat === "attente" || etat === "scanne");
  useEffect(() => {
    if (!enAttente || !demande) return;
    let actif = true;
    let echecs = 0;
    let minuteur: ReturnType<typeof setTimeout> | undefined;
    const interroger = async () => {
      const r = await service.attendreConnexionQr(demande.secret);
      if (!actif) return;
      if (!r.ok) {
        // Pas de réseau, trop de demandes, API en panne : on réessaie, puis on le dit
        echecs += 1;
        if (echecs >= ECHECS_ATTENTE_QR_MAX) {
          actif = false;
          setErreur(r.erreur);
          return setEtat("erreur");
        }
      } else {
        echecs = 0;
        if (r.etat === "accepte") {
          actif = false;
          setEtat("accepte");
          return rappel.current({
            session: r.session,
            compte: r.compte,
            nouveau: r.nouveau,
          });
        }
        // Pas encore scanné et déjà expiré : un nouveau QR, sans rien dire
        if (r.etat === "expire") {
          actif = false;
          if (etatLu.current === "attente") return void nouvelle();
          return setEtat("expire");
        }
        setEtat(r.etat);
      }
      minuteur = setTimeout(() => void interroger(), INTERVALLE_ATTENTE_QR_MS);
    };
    minuteur = setTimeout(() => void interroger(), INTERVALLE_ATTENTE_QR_MS);
    return () => {
      actif = false;
      clearTimeout(minuteur);
    };
  }, [enAttente, demande, service, nouvelle]);

  // Le compte à rebours, chaque seconde ; un QR fini sans nouvelles de l'API (réseau coupé) : on en redemande un (ou on dit l'erreur)
  useEffect(() => {
    if (etat !== "attente" || !demande) return;
    const minuteur = setInterval(() => {
      const t = Date.now();
      setMaintenant(t);
      if (t >= demande.finLocale + MARGE_FIN_QR_MS) void nouvelle();
    }, 1000);
    return () => clearInterval(minuteur);
  }, [etat, demande, nouvelle]);

  const secondesRestantes = demande ? Math.max(0, Math.ceil((demande.finLocale - maintenant) / 1000)) : 0;
  return { demande, etat, erreur, secondesRestantes, nouvelle };
}
