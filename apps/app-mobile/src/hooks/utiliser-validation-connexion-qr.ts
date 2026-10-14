import { useCallback, useEffect, useRef, useState } from "react";

import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { DELAI_ACCEPTATION_QR_S, textesConnexionQr } from "~/contenus/connexion-qr";
import { confirmerAvecBiometrie } from "~/fonctions/compte/confirmer-avec-biometrie";
import { lireLienConnexionQr } from "~/fonctions/compte/lire-lien-connexion-qr";
import type { DemandeConnexionQr, ServiceConnexionQr } from "~/services/demo/connexion-qr-demo";

export type EtapeValidationQr =
  | { type: "scanner"; souci: string | null }
  | { type: "lecture" }
  | { type: "confirmer"; code: string; demande: DemandeConnexionQr; jusqua: number; envoi: boolean; souci: string | null }
  | { type: "fait"; appareil: string }
  | { type: "refuse" }
  | { type: "expire" }
  | { type: "erreur"; erreur: ErreurService };

/**
 * Le téléphone connecté valide la connexion d'un autre appareil : il lit le QR (ou le lien sosmiam.fr/q/…), montre qui
 * demande et d'où, laisse 60 secondes pour répondre, puis demande Face ID, l'empreinte ou le code du téléphone avant
 * d'accepter. Refuser ne demande rien : c'est le geste sûr.
 */
export function utiliserValidationConnexionQr(service: ServiceConnexionQr, codeDuLien?: string) {
  const [etape, setEtape] = useState<EtapeValidationQr>({ type: "scanner", souci: null });
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const occupe = useRef(false);

  const lire = useCallback(
    async (texte: string) => {
      const code = lireLienConnexionQr(texte);
      if (!code) return setEtape({ type: "scanner", souci: textesConnexionQr.pasUnQr });
      setEtape({ type: "lecture" });
      const r = await service.scanner(code);
      if (!r.ok) {
        if (r.erreur === "qr-expire" || r.erreur === "delai-depasse") return setEtape({ type: "expire" });
        if (r.erreur === "introuvable") return setEtape({ type: "scanner", souci: textesConnexionQr.pasUnQr });
        return setEtape({ type: "erreur", erreur: r.erreur });
      }
      const lu = Date.now();
      // On répond dans les 60 secondes du scan, et jamais après la fin du QR
      const jusqua = Math.min(lu + DELAI_ACCEPTATION_QR_S * 1000, new Date(r.demande.expireLe).getTime());
      setMaintenant(lu);
      setEtape({ type: "confirmer", code, demande: r.demande, jusqua, envoi: false, souci: null });
    },
    [service],
  );

  // Un lien sosmiam.fr/q/… ouvert dans l'app : lu tout de suite
  useEffect(() => {
    if (codeDuLien) void lire(codeDuLien);
  }, [codeDuLien, lire]);

  // Le compte à rebours de la confirmation
  const confirmeJusqua = etape.type === "confirmer" ? etape.jusqua : null;
  useEffect(() => {
    if (confirmeJusqua === null) return;
    const minuteur = setInterval(() => {
      const t = Date.now();
      setMaintenant(t);
      if (t >= confirmeJusqua) setEtape((e) => (e.type === "confirmer" && !e.envoi ? { type: "expire" } : e));
    }, 1000);
    return () => clearInterval(minuteur);
  }, [confirmeJusqua]);

  const repondre = useCallback(
    async (accepte: boolean) => {
      if (etape.type !== "confirmer" || occupe.current) return;
      occupe.current = true;
      const { code, demande } = etape;
      try {
        if (accepte) {
          const verrou = await confirmerAvecBiometrie(textesConnexionQr.raisonBiometrie);
          if (verrou === "annule") return setEtape((e) => (e.type === "confirmer" ? { ...e, souci: textesConnexionQr.biometrieAnnulee } : e));
          // Face ID a pu prendre du temps : le délai compte toujours
          if (Date.now() >= etape.jusqua) return setEtape({ type: "expire" });
        }
        setEtape((e) => (e.type === "confirmer" ? { ...e, envoi: true, souci: null } : e));
        const r = await service.repondre(code, accepte);
        if (!r.ok) {
          if (r.erreur === "qr-expire" || r.erreur === "delai-depasse") return setEtape({ type: "expire" });
          return setEtape({ type: "erreur", erreur: r.erreur });
        }
        setEtape(accepte ? { type: "fait", appareil: demande.appareil } : { type: "refuse" });
      } finally {
        occupe.current = false;
      }
    },
    [etape, service],
  );

  const recommencer = useCallback(() => setEtape({ type: "scanner", souci: null }), []);
  const secondesRestantes = etape.type === "confirmer" ? Math.max(0, Math.ceil((etape.jusqua - maintenant) / 1000)) : 0;

  return { etape, secondesRestantes, lire, accepter: () => repondre(true), refuser: () => repondre(false), recommencer };
}
