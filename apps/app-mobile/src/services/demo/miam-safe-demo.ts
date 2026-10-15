import type { ServiceMiamSafe } from "@sos-miam/commun/client-api/contrat-miam-safe";
import { calculerRepereSentiBien } from "@sos-miam/commun/fonctions/miam-safe/calculer-repere-senti-bien";
import { peutAgirAuComptoir } from "@sos-miam/commun/fonctions/roles/peut-agir-au-comptoir";
import { peutReglerLieu } from "@sos-miam/commun/fonctions/roles/peut-regler-lieu";
import { DELAI_RELANCE_ALERTE_SECONDES, type EndroitAlerte } from "@sos-miam/commun/regles/miam-safe";
import type { CharteMiamSafe, StatutAlerteMiamSafe } from "@sos-miam/commun/types/miam-safe";
import { LIEUX_SIGNATAIRES_MIAM_SAFE_EXEMPLES, REPONSES_SENTI_BIEN_EXEMPLES } from "~/contenus/miam-safe";

import type { ContexteDemo } from "./types-demo";

const REPONSE_DEMO_MS = 4000;

type AlerteDemo = { id: number; lieuId: number; endroit: EndroitAlerte; detail: string; creeLe: number; repondueLe: number | null };

function calculerStatut(a: AlerteDemo, maintenant: number): StatutAlerteMiamSafe {
  if (a.repondueLe !== null && a.repondueLe <= maintenant) return "en-route";
  return maintenant - a.creeLe >= DELAI_RELANCE_ALERTE_SECONDES * 1000 ? "sans-reponse" : "envoyee";
}

export function creerMiamSafeDemo(ctx: Pick<ContexteDemo, "lireClient" | "lireRoles" | "maintenant">): ServiceMiamSafe {
  const lirePrenom = () => ctx.lireClient()?.prenom ?? "Quelqu'un";
  const chartes = new Map<number, CharteMiamSafe>(
    LIEUX_SIGNATAIRES_MIAM_SAFE_EXEMPLES.map((id) => [id, { signee: true, signeeLe: "2026-10-09T10:00:00.000Z", retireeParEquipe: false }]),
  );
  const alertes: AlerteDemo[] = [];
  let prochaine = 0;
  const engage = (lieuId: number) => chartes.get(lieuId)?.signee === true;
  const charte = (lieuId: number): CharteMiamSafe => chartes.get(lieuId) ?? { signee: false, signeeLe: null, retireeParEquipe: false };

  return {
    async lireLieu(lieuId) {
      const reponses = REPONSES_SENTI_BIEN_EXEMPLES[lieuId];
      return { ok: true, engage: engage(lieuId), repere: reponses ? calculerRepereSentiBien(reponses.oui, reponses.reponses) : false };
    },
    async envoyerAlerte({ lieuId, endroit, detail }) {
      if (!engage(lieuId)) return { ok: false, erreur: "pas-miam-safe" };
      const maintenant = ctx.maintenant();
      const id = ++prochaine;
      alertes.push({ id, lieuId, endroit, detail: detail.trim().slice(0, 80), creeLe: maintenant, repondueLe: maintenant + REPONSE_DEMO_MS });
      return { ok: true, id, telephones: 1 };
    },
    async suivreAlerte(alerteId) {
      const a = alertes.find((x) => x.id === alerteId);
      if (!a) return { ok: false, erreur: "introuvable" };
      const maintenant = ctx.maintenant();
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
      const maintenant = ctx.maintenant();
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
      a.repondueLe = Math.min(a.repondueLe ?? ctx.maintenant(), ctx.maintenant());
      return { ok: true };
    },
    async lireCharte(lieuId) {
      if (!peutAgirAuComptoir(ctx.lireRoles(), lieuId)) return { ok: false, erreur: "role-requis" };
      return { ok: true, charte: charte(lieuId) };
    },
    async signerCharte(lieuId) {
      if (!peutReglerLieu(ctx.lireRoles(), lieuId)) return { ok: false, erreur: "role-requis" };
      if (charte(lieuId).retireeParEquipe) return { ok: false, erreur: "charte-retiree" };
      if (!engage(lieuId)) chartes.set(lieuId, { signee: true, signeeLe: new Date(ctx.maintenant()).toISOString(), retireeParEquipe: false });
      return { ok: true, charte: charte(lieuId) };
    },
    async quitterCharte(lieuId) {
      if (!peutReglerLieu(ctx.lireRoles(), lieuId)) return { ok: false, erreur: "role-requis" };
      if (engage(lieuId)) chartes.set(lieuId, { signee: false, signeeLe: null, retireeParEquipe: false });
      return { ok: true, charte: charte(lieuId) };
    },
    prevenirPote: async () => ({ ok: false, erreur: "service-indisponible" }),
    envoyerPosition: async () => ({ ok: false, erreur: "partage-inconnu" }),
    arreterPartage: async () => ({ ok: false, erreur: "partage-inconnu" }),
    lirePartage: async () => ({ ok: false, erreur: "partage-inconnu" }),
    listerPartages: async () => ({ ok: true, partages: [] }),
  };
}
