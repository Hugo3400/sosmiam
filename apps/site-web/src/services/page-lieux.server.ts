import { lireImageLieu } from "~/fonctions/lieux/lire-image-lieu";
import { lireApercuLieu } from "~/fonctions/page-lieux/lire-apercu-lieu";
import { lireEpingle } from "~/fonctions/page-lieux/lire-epingle";
import { lireLieuListe } from "~/fonctions/page-lieux/lire-lieu-liste";
import { lireVilleLieux } from "~/fonctions/page-lieux/lire-ville-lieux";
import { listerLieuxPublics } from "~/services/lieux.server";
import type { ApercuLieu, CategorieLieu, EpingleLieu, LieuCarte, PageLieux, VilleLieux } from "~/types/lieux";

const ADRESSE_API = process.env.ADRESSE_API ?? "http://127.0.0.1:5192";
const LIEUX_ACCUEIL = 8;

export type ReponseLieux<T> = { ok: true; donnees: T } | { ok: false; erreur: "absente" | "indisponible" };

export type FiltresListeApi = { ville: string | null; type: CategorieLieu | null; recherche: string | null; page: number };

export type LieuxAccueil = { lieux: LieuCarte[] | null; tirage: boolean };

async function appelerApi(chemin: string, ip: string | null): Promise<ReponseLieux<Record<string, unknown>>> {
  try {
    const reponse = await fetch(`${ADRESSE_API}${chemin}`, {
      headers: ip ? { "X-IP-Visiteur": ip } : {},
      signal: AbortSignal.timeout(3000),
    });
    if (reponse.status === 404) return { ok: false, erreur: "absente" };
    if (!reponse.ok) return { ok: false, erreur: "indisponible" };
    const corps: unknown = await reponse.json();
    return typeof corps === "object" && corps !== null ? { ok: true, donnees: corps as Record<string, unknown> } : { ok: false, erreur: "indisponible" };
  } catch {
    return { ok: false, erreur: "indisponible" };
  }
}

function lireListe<T>(brut: unknown, lire: (element: unknown) => T | null): T[] | null {
  return Array.isArray(brut) ? brut.flatMap((element) => lire(element) ?? []) : null;
}

const lireEntier = (valeur: unknown, defaut: number) => (Number.isSafeInteger(valeur) && (valeur as number) >= 0 ? (valeur as number) : defaut);

export async function listerVillesLieux(ip: string | null): Promise<ReponseLieux<VilleLieux[]>> {
  const reponse = await appelerApi("/lieux/villes", ip);
  if (!reponse.ok) return reponse;
  const villes = lireListe(reponse.donnees.villes, lireVilleLieux);
  return villes ? { ok: true, donnees: villes } : { ok: false, erreur: "indisponible" };
}

export async function listerPageLieux(filtres: FiltresListeApi, ip: string | null): Promise<ReponseLieux<PageLieux>> {
  const parametres = new URLSearchParams();
  if (filtres.ville) parametres.set("ville", filtres.ville);
  if (filtres.type) parametres.set("type", filtres.type);
  if (filtres.recherche) parametres.set("q", filtres.recherche);
  parametres.set("page", String(filtres.page));
  const reponse = await appelerApi(`/lieux/liste?${parametres}`, ip);
  if (!reponse.ok) return reponse;
  const lieux = lireListe(reponse.donnees.lieux, lireLieuListe);
  if (!lieux) return { ok: false, erreur: "indisponible" };
  const pages = Math.max(1, lireEntier(reponse.donnees.pages, 1));
  return {
    ok: true,
    donnees: { lieux, total: lireEntier(reponse.donnees.total, lieux.length), page: Math.min(Math.max(1, lireEntier(reponse.donnees.page, 1)), pages), pages },
  };
}

export async function listerEpinglesLieux(filtres: { ville: string | null; type: CategorieLieu | null }, ip: string | null): Promise<ReponseLieux<EpingleLieu[]>> {
  const parametres = new URLSearchParams();
  if (filtres.ville) parametres.set("ville", filtres.ville);
  if (filtres.type) parametres.set("type", filtres.type);
  const requete = parametres.toString();
  const reponse = await appelerApi(requete ? `/lieux/carte?${requete}` : "/lieux/carte", ip);
  if (!reponse.ok) return reponse;
  const epingles = lireListe(reponse.donnees.epingles, lireEpingle);
  return epingles ? { ok: true, donnees: epingles } : { ok: false, erreur: "indisponible" };
}

export async function listerLieuxAccueil(ip: string | null): Promise<LieuxAccueil> {
  const reponse = await appelerApi("/lieux/accueil", ip);
  const lieux = reponse.ok ? lireListe(reponse.donnees.lieux, lireLieuListe) : null;
  if (lieux) return { lieux: lieux.slice(0, LIEUX_ACCUEIL), tirage: true };
  const publics = await listerLieuxPublics();
  return { lieux: publics ? publics.slice(0, LIEUX_ACCUEIL).map((lieu) => ({ ...lieu, logo: lireImageLieu(lieu.logo) })) : null, tirage: false };
}

export async function lireApercu(id: number, ip: string | null): Promise<ApercuLieu | null> {
  const reponse = await appelerApi(`/lieux/site/${id}`, ip);
  return reponse.ok ? lireApercuLieu(reponse.donnees.lieu) : null;
}
