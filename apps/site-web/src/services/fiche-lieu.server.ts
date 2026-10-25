import { nettoyerFichePublique } from "~/fonctions/lieux/nettoyer-fiche-publique";
import { appelerApiComptes } from "~/services/comptes.server";
import { lireFichePublique } from "~/services/pro.server";
import type { FichePublique } from "~/types/pro";

export type ResultatFicheLieu = { ok: true; lieu: FichePublique } | { ok: false; erreur: "lieu-inconnu" | "indisponible" };

export function lireFicheSite(lieuId: number, ip: string | null) {
  return appelerApiComptes<{ lieu: FichePublique }>(`/lieux/site/${lieuId}`, { ip });
}

export async function chargerFicheLieu(lieuId: number, ip: string | null): Promise<ResultatFicheLieu> {
  const enrichie = await lireFicheSite(lieuId, ip);
  if (enrichie.ok) return { ok: true, lieu: nettoyerFichePublique(enrichie.lieu) };
  if (enrichie.erreur === "lieu-inconnu") return { ok: false, erreur: "lieu-inconnu" };
  const publique = await lireFichePublique(lieuId, ip);
  if (publique.ok) return { ok: true, lieu: nettoyerFichePublique(publique.lieu) };
  return { ok: false, erreur: publique.erreur === "lieu-inconnu" || publique.erreur === "introuvable" ? "lieu-inconnu" : "indisponible" };
}
