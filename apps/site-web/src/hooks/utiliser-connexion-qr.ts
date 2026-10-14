import { useCallback, useEffect, useRef, useState } from "react";

import { lireEtatQr } from "~/fonctions/connexion-qr/lire-etat-qr";
import type { EtatQrSite, QrAffiche } from "~/types/connexion-qr";

/** L'état du bloc : fermé (pas de QR tant qu'on n'a pas cliqué), en chargement, ou un QR et où il en est */
export type EtatBlocQr = { etat: EtatQrSite | "ferme" | "chargement"; svg: string | null; expireLe: number | null };

const INTERVALLE = 2000;
const JSON_ACCEPTE = { Accept: "application/json" };

/**
 * Le bloc « Me connecter avec l'app » : demande un QR au serveur du site (POST /connexion/qr), puis interroge toutes les
 * 2 s (POST /connexion/qr/attente) tant qu'il est en attente ou scanné ; à « accepte », ouvre la page donnée. Sans
 * JavaScript, le formulaire et le lien du bloc font la même chose en rechargeant la page.
 */
export function utiliserConnexionQr(initial: QrAffiche | null) {
  const [bloc, changerBloc] = useState<EtatBlocQr>(initial ?? { etat: "ferme", svg: null, expireLe: null });
  const enCours = bloc.etat === "attente" || bloc.etat === "scanne";
  const actif = useRef(true);
  // Remis à vrai à chaque montage (le mode strict de React démonte et remonte une fois en développement)
  useEffect(() => {
    actif.current = true;
    return () => void (actif.current = false);
  }, []);

  const demander = useCallback(async (formulaire: HTMLFormElement) => {
    changerBloc((avant) => ({ ...avant, etat: "chargement" }));
    try {
      const reponse = await fetch(formulaire.action, { method: "POST", body: new FormData(formulaire), headers: JSON_ACCEPTE });
      const lu = (await reponse.json()) as { ok: boolean; svg?: string; expireLe?: number; etat?: string };
      if (!actif.current) return;
      if (lu.ok && lu.svg && lu.expireLe) changerBloc({ etat: "attente", svg: lu.svg, expireLe: lu.expireLe });
      else changerBloc({ etat: lireEtatQr(lu.etat) ?? "erreur", svg: null, expireLe: null });
    } catch {
      if (actif.current) changerBloc({ etat: "erreur", svg: null, expireLe: null });
    }
  }, []);

  useEffect(() => {
    if (!enCours) return;
    let arrete = false;
    const interroger = async () => {
      if (bloc.expireLe !== null && Date.now() > bloc.expireLe + 2000) return changerBloc({ etat: "expire", svg: null, expireLe: null });
      try {
        const reponse = await fetch("/connexion/qr/attente", { method: "POST", headers: JSON_ACCEPTE });
        const lu = (await reponse.json()) as { ok: boolean; etat?: string; aller?: string };
        if (arrete) return;
        const etat = lireEtatQr(lu.etat);
        if (etat === "accepte" && lu.aller) {
          changerBloc((avant) => ({ ...avant, etat: "accepte" }));
          window.location.assign(lu.aller);
        } else if (etat === "refuse" || etat === "expire") changerBloc({ etat, svg: null, expireLe: null });
        else if (etat === "scanne" || etat === "attente") changerBloc((avant) => (avant.etat === etat ? avant : { ...avant, etat }));
        // « trop » ou « erreur » : passager, on réessaie au tour suivant
      } catch {
        // Réseau coupé un instant : on réessaie au tour suivant
      }
    };
    const minuteur = window.setInterval(() => void interroger(), INTERVALLE);
    return () => {
      arrete = true;
      window.clearInterval(minuteur);
    };
  }, [enCours, bloc.expireLe]);

  return { bloc, demander };
}
