import type { EffetVisite, EtatVisitePourTransition, EvenementVisite, TransitionVisite } from "../../types/visite.ts";
import { DELAI_ANNULATION_LIEU_MS } from "../../regles/visites.ts";
import { calculerEffetsValidation } from "./calculer-effets-validation.ts";
import { calculerPointsVisite } from "./calculer-points-visite.ts";

const INTERDITE: TransitionVisite = { ok: false, erreur: "transition-interdite" };
const DELAI_DEPASSE: TransitionVisite = { ok: false, erreur: "delai-depasse" };

/** La demande a-t-elle expiré ? Sans date d'expiration : jamais. Date illisible : oui (refus par défaut). */
function estExpiree(expireLe: string | null, maintenantMs: number): boolean {
  if (expireLe === null) return false;
  const expireLeMs = Date.parse(expireLe);
  return Number.isNaN(expireLeMs) || maintenantMs >= expireLeMs;
}

/** Effets d'une visite retirée : points rendus, tampon enlevé s'il y en avait un, avis masqué. */
function calculerEffetsRetrait(v: EtatVisitePourTransition): EffetVisite[] {
  const effets: EffetVisite[] = [];
  if (v.points > 0) effets.push({ type: "points", valeur: -v.points, raison: "annulation-visite" });
  if (v.tampon) effets.push({ type: "tampon", delta: -1 });
  effets.push({ type: "masquer-avis" });
  return effets;
}

/**
 * Fait évoluer une visite (machine à états partagée par la démo et l'API). Ne modifie rien : rend le nouvel état et
 * les effets à appliquer (points, tampon, avis, contrôle), ou une erreur.
 * - regler : demandee → validee, avant `expireLe` ; annulable par le lieu pendant 15 min.
 * - refuser : demandee → refusee (contrôle « refus-lieu »).
 * - annuler-client : demandee → annulee. expirer : demandee → expiree, à partir de `expireLe`.
 * - annuler-lieu : validee → retiree, jusqu'à `valideLe` + 15 min inclus (contrôle « annulation-lieu »).
 * - retirer (équipe SOS Miam) : validee → retiree, à tout moment, sans contrôle.
 * - donner-raison (équipe SOS Miam, après une contestation) : refusee ou retiree → validee, maintenant, avec les effets d'une
 *   validation (points, tampon, avis) ; jamais annulable par le lieu. Que la visite soit bien contestée, c'est à l'appelant de le voir.
 */
export function faireEvoluerVisite(
  v: EtatVisitePourTransition,
  e: EvenementVisite,
  maintenantMs: number,
  options?: { delaiAvisMs?: number },
): TransitionVisite {
  const maintenant = new Date(maintenantMs).toISOString();

  if (v.statut === "demandee") {
    const terminer = (statut: "refusee" | "annulee" | "expiree", effets: EffetVisite[]): TransitionVisite => ({
      ok: true,
      statut,
      valideLe: null,
      decideLe: maintenant,
      points: 0,
      annulableJusqua: null,
      effets,
    });
    switch (e.type) {
      case "regler":
        if (estExpiree(v.expireLe, maintenantMs)) return DELAI_DEPASSE;
        return {
          ok: true,
          statut: "validee",
          valideLe: maintenant,
          decideLe: maintenant,
          points: calculerPointsVisite(v.pendantSos, e.reglement ?? null),
          annulableJusqua: new Date(maintenantMs + DELAI_ANNULATION_LIEU_MS).toISOString(),
          effets: calculerEffetsValidation(v.pendantSos, maintenantMs, options?.delaiAvisMs, e.reglement ?? null),
        };
      case "refuser":
        return terminer("refusee", [{ type: "controle", motif: "refus-lieu" }]);
      case "annuler-client":
        return terminer("annulee", []);
      case "expirer":
        return estExpiree(v.expireLe, maintenantMs) ? terminer("expiree", []) : INTERDITE;
      default:
        return INTERDITE;
    }
  }

  if (v.statut === "validee" && (e.type === "annuler-lieu" || e.type === "retirer")) {
    if (e.type === "annuler-lieu") {
      const valideLeMs = v.valideLe === null ? Number.NaN : Date.parse(v.valideLe);
      if (Number.isNaN(valideLeMs) || maintenantMs > valideLeMs + DELAI_ANNULATION_LIEU_MS) return DELAI_DEPASSE;
    }
    const effets = calculerEffetsRetrait(v);
    if (e.type === "annuler-lieu") effets.push({ type: "controle", motif: "annulation-lieu" });
    return { ok: true, statut: "retiree", valideLe: v.valideLe, decideLe: maintenant, points: 0, annulableJusqua: null, effets };
  }

  if ((v.statut === "refusee" || v.statut === "retiree") && e.type === "donner-raison") {
    const reglement = e.reglement ?? null;
    return {
      ok: true,
      statut: "validee",
      valideLe: maintenant,
      decideLe: maintenant,
      points: calculerPointsVisite(v.pendantSos, reglement),
      annulableJusqua: null,
      effets: calculerEffetsValidation(v.pendantSos, maintenantMs, options?.delaiAvisMs, reglement),
    };
  }

  return INTERDITE;
}
