// Miam Safe joué sur le téléphone (source « demo ») : mêmes règles que l'API (apps/api/src/routes/miam-safe.ts), données
// d'exemple (contenus/miam-safe.ts), rien n'est envoyé. L'équipe du Capitaine Bouiboui répond « On arrive » toute seule.
import type { ServiceMiamSafe } from "@sos-miam/commun/client-api/contrat-miam-safe";
import { calculerRepereSentiBien } from "@sos-miam/commun/fonctions/miam-safe/calculer-repere-senti-bien";
import { DELAI_RELANCE_ALERTE_SECONDES, type EndroitAlerte } from "@sos-miam/commun/regles/miam-safe";
import type { CharteMiamSafe, StatutAlerteMiamSafe } from "@sos-miam/commun/types/miam-safe";
import { LIEUX_MIAM_SAFE_EXEMPLES } from "~/contenus/miam-safe";

/** Démo : l'équipe répond « On arrive » au bout de quelques secondes */
const REPONSE_DEMO_MS = 4000;

type AlerteDemo = { id: number; lieuId: number; endroit: EndroitAlerte; detail: string; creeLe: number; repondueLe: number | null };

function calculerStatut(a: AlerteDemo, maintenant: number): StatutAlerteMiamSafe {
  if (a.repondueLe !== null && a.repondueLe <= maintenant) return "en-route";
  return maintenant - a.creeLe >= DELAI_RELANCE_ALERTE_SECONDES * 1000 ? "sans-reponse" : "envoyee";
}

/** `prenom` : le prénom du profil, tel que l'équipe le verrait au comptoir */
export function creerMiamSafeDemo(lirePrenom: () => string): ServiceMiamSafe {
  const chartes = new Map<number, CharteMiamSafe>(
    Object.keys(LIEUX_MIAM_SAFE_EXEMPLES).map((id) => [Number(id), { signee: true, signeeLe: "2026-10-09T10:00:00.000Z", retireeParEquipe: false }]),
  );
  const alertes: AlerteDemo[] = [];
  let prochaine = 0;
  const engage = (lieuId: number) => chartes.get(lieuId)?.signee === true;
  const charte = (lieuId: number): CharteMiamSafe => chartes.get(lieuId) ?? { signee: false, signeeLe: null, retireeParEquipe: false };

  return {
    async lireLieu(lieuId) {
      const reponses = LIEUX_MIAM_SAFE_EXEMPLES[lieuId];
      return { ok: true, engage: engage(lieuId), repere: reponses ? calculerRepereSentiBien(reponses.oui, reponses.reponses) : false };
    },
    async envoyerAlerte({ lieuId, endroit, detail }) {
      if (!engage(lieuId)) return { ok: false, erreur: "service-indisponible" };
      const maintenant = Date.now();
      const id = ++prochaine;
      alertes.push({ id, lieuId, endroit, detail: detail.trim().slice(0, 80), creeLe: maintenant, repondueLe: maintenant + REPONSE_DEMO_MS });
      return { ok: true, id };
    },
    async suivreAlerte(alerteId) {
      const a = alertes.find((x) => x.id === alerteId);
      if (!a) return { ok: false, erreur: "introuvable" };
      const maintenant = Date.now();
      const statut = calculerStatut(a, maintenant);
      return { ok: true, alerte: { id: a.id, statut, creeLe: new Date(a.creeLe).toISOString(), repondueLe: statut === "en-route" ? new Date(a.repondueLe!).toISOString() : null } };
    },
    async signaler() {
      return { ok: true };
    },
    async repondreSentiBien() {
      return { ok: true };
    },
    async listerAlertesComptoir(lieuId) {
      const maintenant = Date.now();
      const prenom = lirePrenom();
      return {
        ok: true,
        alertes: alertes
          .filter((a) => a.lieuId === lieuId)
          .reverse()
          .map((a) => ({ id: a.id, prenom, endroit: a.endroit, detail: a.detail, statut: calculerStatut(a, maintenant), creeLe: new Date(a.creeLe).toISOString() })),
      };
    },
    async direOnArrive(lieuId, alerteId) {
      const a = alertes.find((x) => x.id === alerteId && x.lieuId === lieuId);
      if (!a) return { ok: false, erreur: "introuvable" };
      a.repondueLe = Math.min(a.repondueLe ?? Date.now(), Date.now());
      return { ok: true };
    },
    async lireCharte(lieuId) {
      return { ok: true, charte: charte(lieuId) };
    },
    async signerCharte(lieuId) {
      chartes.set(lieuId, { signee: true, signeeLe: new Date().toISOString(), retireeParEquipe: false });
      return { ok: true, charte: charte(lieuId) };
    },
    async quitterCharte(lieuId) {
      chartes.set(lieuId, { signee: false, signeeLe: null, retireeParEquipe: false });
      return { ok: true, charte: charte(lieuId) };
    },
  };
}
