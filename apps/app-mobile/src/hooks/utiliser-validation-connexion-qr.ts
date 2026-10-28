import { useCallback, useEffect, useRef, useState } from "react";

import { lireCodeConnexionQr } from "@sos-miam/commun/fonctions/qr/lire-code-connexion-qr";
import type { DemandeConnexionQr } from "@sos-miam/commun/types/connexion-qr";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { DELAI_ACCEPTATION_QR_S, DUREE_QR_CONNEXION_S, textesConnexionQr } from "~/contenus/connexion-qr";
import { confirmerAvecBiometrie } from "~/fonctions/compte/confirmer-avec-biometrie";
import type { ServiceConnexionQr } from "~/hooks/utiliser-service-connexion-qr";
import { lireLangueActuelle } from "~/services/langue-actuelle";

export type EtapeValidationQr =
  | { type: "lien"; code: string }
  | { type: "scanner"; souci: string | null }
  | { type: "lecture" }
  | {
      type: "confirmer";
      code: string;
      demande: DemandeConnexionQr;
      jusqua: number;
      /** La réponse qui part (le bouton touché), ou null */
      envoi: "accepte" | "refuse" | null;
      souci: string | null;
    }
  | { type: "fait"; appareil: string }
  | { type: "refuse" }
  | { type: "lien-refuse" }
  | { type: "expire" }
  | { type: "erreur"; erreur: ErreurService };

// Le premier scan de chaque code, à l'heure de CE téléphone : l'API garde l'heure du premier scan (la fenêtre de 60 s ne
// repart pas quand on rescanne), on fait pareil. Rien n'est comparé à l'horloge du serveur, qui peut être décalée.
const premiersScans = new Map<string, number>();

function noterPremierScan(code: string, maintenant: number): number {
  for (const [autre, le] of premiersScans) if (maintenant - le > DUREE_QR_CONNEXION_S * 1000) premiersScans.delete(autre);
  const premier = premiersScans.get(code) ?? maintenant;
  premiersScans.set(code, premier);
  return premier;
}

/**
 * Le téléphone connecté valide la connexion d'un autre appareil : il lit le QR (ou le lien sosmiam.fr/q/…), montre qui
 * demande et d'où, laisse 60 secondes pour répondre, puis demande Face ID, l'empreinte ou le code du téléphone avant
 * d'accepter. Refuser ne demande rien : c'est le geste sûr. Un lien ouvert dans l'app ne part pas tout seul : il peut venir
 * d'un escroc, on demande d'abord (« Refuser » en premier). Un QR expiré, déjà utilisé ou trop vieux se dit « Trop tard » ;
 * les autres refus de l'API (scanné par un autre compte, déjà répondu, trop d'essais) gardent leur propre texte.
 */
export function utiliserValidationConnexionQr(service: ServiceConnexionQr, codeDuLien?: string) {
  const [etape, setEtape] = useState<EtapeValidationQr>(() => (codeDuLien ? { type: "lien", code: codeDuLien } : { type: "scanner", souci: null }));
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const occupe = useRef(false);

  const lire = useCallback(
    async (texte: string) => {
      const code = lireCodeConnexionQr(texte);
      if (!code) return setEtape({ type: "scanner", souci: textesConnexionQr.pasUnQr });
      setEtape({ type: "lecture" });
      // Compté depuis l'envoi du (premier) scan : jamais plus long que la fenêtre de l'API, qui tranche avec son « Trop tard »
      const premier = noterPremierScan(code, Date.now());
      const r = await service.scannerConnexionQr(code);
      if (!r.ok) {
        if (r.erreur === "connexion-qr-expiree") return setEtape({ type: "expire" });
        if (r.erreur === "connexion-qr-inconnue")
          return setEtape({
            type: "scanner",
            souci: textesConnexionQr.pasUnQr,
          });
        return setEtape({ type: "erreur", erreur: r.erreur });
      }
      const recu = Date.now();
      setMaintenant(recu);
      // L'API dit combien de secondes il reste (depuis le PREMIER scan, jamais après la fin du QR) : on la croit, sans
      // comparer d'horloges ; sans elle (ancien serveur), on compte depuis notre premier scan
      const jusqua = r.demande.repondreDansS !== undefined ? recu + r.demande.repondreDansS * 1000 : premier + DELAI_ACCEPTATION_QR_S * 1000;
      setEtape({
        type: "confirmer",
        code,
        demande: r.demande,
        jusqua,
        envoi: null,
        souci: null,
      });
    },
    [service],
  );

  // Un lien sosmiam.fr/q/… ouvert dans l'app (le code seul arrive par la route /q/[code]) : rien ne part avant un geste
  useEffect(() => {
    if (codeDuLien) setEtape({ type: "lien", code: codeDuLien });
  }, [codeDuLien]);

  const continuerLien = useCallback(() => {
    if (etape.type === "lien") void lire(`https://sosmiam.fr/q/${etape.code}`);
  }, [etape, lire]);
  // Rien n'a été scanné : l'API ne sait même pas que le lien a été ouvert
  const refuserLien = useCallback(() => setEtape({ type: "lien-refuse" }), []);

  // Le compte à rebours de la confirmation
  const confirmeJusqua = etape.type === "confirmer" ? etape.jusqua : null;
  useEffect(() => {
    if (confirmeJusqua === null) return;
    const minuteur = setInterval(() => {
      const t = Date.now();
      setMaintenant(t);
      if (t >= confirmeJusqua) setEtape((e) => (e.type === "confirmer" && e.envoi === null ? { type: "expire" } : e));
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
          const verrou = await confirmerAvecBiometrie(textesConnexionQr.raisonBiometrie, lireLangueActuelle());
          if (verrou === "annule") return setEtape((e) => (e.type === "confirmer" ? { ...e, souci: textesConnexionQr.biometrieAnnulee } : e));
          // Face ID a pu prendre du temps : le délai compte toujours
          if (Date.now() >= etape.jusqua) return setEtape({ type: "expire" });
        }
        setEtape((e) => (e.type === "confirmer" ? { ...e, envoi: accepte ? "accepte" : "refuse", souci: null } : e));
        const r = await service.repondreConnexionQr(code, accepte);
        if (!r.ok) {
          if (r.erreur === "connexion-qr-expiree") return setEtape({ type: "expire" });
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

  return {
    etape,
    secondesRestantes,
    lire,
    continuerLien,
    refuserLien,
    accepter: () => repondre(true),
    refuser: () => repondre(false),
    recommencer,
  };
}
