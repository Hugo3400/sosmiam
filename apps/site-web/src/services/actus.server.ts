import { estArticleActusAlcool } from "~/fonctions/actus/est-article-actus-alcool";
import { lireArticleActusApi } from "~/fonctions/actus/lire-article-actus-api";
import { lireVilleActus } from "~/fonctions/actus/lire-ville-actus";
import type { ArticleActusSite, FiltresActus, PageActus, VilleActus } from "~/types/actus";
import { entetesLangue } from "./langue-courante.server.ts";

const ADRESSE_API = process.env.ADRESSE_API ?? "http://127.0.0.1:5192";
const CURSEUR = /^\d{1,15}\.\d{1,9}$/;

export type ReponseActus<T> = { ok: true; donnees: T } | { ok: false; erreur: "introuvable" | "indisponible" };

async function appelerApi(chemin: string, ip: string | null): Promise<ReponseActus<Record<string, unknown>>> {
  try {
    const reponse = await fetch(`${ADRESSE_API}${chemin}`, {
      headers: { ...entetesLangue(), ...(ip ? { "X-IP-Visiteur": ip } : {}) },
      signal: AbortSignal.timeout(3000),
    });
    if (reponse.status === 404) return { ok: false, erreur: "introuvable" };
    if (!reponse.ok) return { ok: false, erreur: "indisponible" };
    const corps: unknown = await reponse.json();
    return typeof corps === "object" && corps !== null && (corps as { ok?: unknown }).ok === true
      ? { ok: true, donnees: corps as Record<string, unknown> }
      : { ok: false, erreur: "indisponible" };
  } catch {
    return { ok: false, erreur: "indisponible" };
  }
}

function lireArticles(brut: unknown): ArticleActusSite[] | null {
  if (!Array.isArray(brut)) return null;
  return brut.flatMap((element) => {
    const article = lireArticleActusApi(element);
    return article && !estArticleActusAlcool(article) ? [article] : [];
  });
}

async function listerVilles(ip: string | null): Promise<VilleActus[] | null> {
  const reponse = await appelerApi("/app/actus/villes", ip);
  if (!reponse.ok || !Array.isArray(reponse.donnees.villes)) return null;
  const villes = reponse.donnees.villes.flatMap((element) => lireVilleActus(element) ?? []);
  return villes.filter((ville, rang) => villes.findIndex((autre) => autre.identifiant === ville.identifiant) === rang).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}

export async function listerArticlesActus(filtres: FiltresActus, ip: string | null): Promise<ReponseActus<PageActus>> {
  const villes = await listerVilles(ip);
  if (!villes) return { ok: false, erreur: "indisponible" };
  const ville = filtres.ville === null ? null : villes.find((une) => une.identifiant === filtres.ville);
  if (ville === undefined) return { ok: true, donnees: { articles: [], villes, suivant: null } };
  const parametres = new URLSearchParams();
  if (filtres.rubrique) parametres.set("rubrique", filtres.rubrique);
  if (ville) parametres.set("ville", ville.nom);
  if (filtres.curseur) parametres.set("curseur", filtres.curseur);
  const requete = parametres.toString();
  const reponse = await appelerApi(requete ? `/app/actus?${requete}` : "/app/actus", ip);
  if (!reponse.ok) return { ok: false, erreur: "indisponible" };
  const articles = lireArticles(reponse.donnees.articles);
  if (!articles) return { ok: false, erreur: "indisponible" };
  const { suivant } = reponse.donnees;
  return { ok: true, donnees: { articles, villes, suivant: typeof suivant === "string" && CURSEUR.test(suivant) ? suivant : null } };
}

export async function chargerArticleActus(id: number, ip: string | null): Promise<ReponseActus<ArticleActusSite>> {
  const reponse = await appelerApi(`/app/actus/${id}`, ip);
  if (!reponse.ok) return reponse;
  const article = lireArticleActusApi(reponse.donnees.article);
  if (!article || article.id !== id) return { ok: false, erreur: "indisponible" };
  return estArticleActusAlcool(article) ? { ok: false, erreur: "introuvable" } : { ok: true, donnees: article };
}
