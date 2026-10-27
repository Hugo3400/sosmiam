import { PHOTOS_ACTUS_MAX, RUBRIQUES_ACTUS, type RubriqueActus } from "../../../../../packages/commun/src/regles/actus.ts";
import type { ArticleActusSite } from "../../types/actus.ts";
import { lireAuteurActus } from "./lire-auteur-actus.ts";
import { lireImageActus } from "./lire-image-actus.ts";
import { lireLieuCiteActus } from "./lire-lieu-cite-actus.ts";
import { lireReponseLieuActus } from "./lire-reponse-lieu-actus.ts";

const JOUR = /^\d{4}-\d{2}-\d{2}$/;

const lireTexte = (valeur: unknown) => (typeof valeur === "string" && valeur.trim() ? valeur.trim() : null);
const lireNombre = (valeur: unknown) => (Number.isSafeInteger(valeur) && (valeur as number) >= 0 ? (valeur as number) : 0);
const lireListe = <T,>(brut: unknown, lire: (element: unknown) => T | null): T[] | null => (Array.isArray(brut) ? brut.flatMap((element) => lire(element) ?? []) : null);

export function lireArticleActusApi(brut: unknown): ArticleActusSite | null {
  if (typeof brut !== "object" || brut === null) return null;
  const champs = brut as Record<string, unknown>;
  if (champs.statut !== undefined && champs.statut !== "publie") return null;
  const { id, rubrique, publieLe, finLe } = champs;
  const titre = lireTexte(champs.titre);
  const accroche = lireTexte(champs.accroche);
  const paragraphes = Array.isArray(champs.paragraphes) ? champs.paragraphes.flatMap((paragraphe) => lireTexte(paragraphe) ?? []) : [];
  const lieux = lireListe(champs.lieux, lireLieuCiteActus);
  const auteur = lireAuteurActus(champs.auteur);
  const reponsesLieux = champs.reponsesLieux === undefined ? [] : lireListe(champs.reponsesLieux, lireReponseLieuActus);
  if (!Number.isSafeInteger(id) || (id as number) < 1 || typeof rubrique !== "string" || !(RUBRIQUES_ACTUS as readonly string[]).includes(rubrique)) return null;
  if (!titre || !accroche || paragraphes.length === 0 || !lieux || !auteur || !reponsesLieux) return null;
  if (typeof publieLe !== "string" || Number.isNaN(Date.parse(publieLe))) return null;
  if (typeof champs.collaboration !== "boolean" || typeof champs.alcool !== "boolean") return null;
  return {
    id: id as number,
    rubrique: rubrique as RubriqueActus,
    titre,
    accroche,
    paragraphes,
    citation: lireTexte(champs.citation),
    couverture: lireImageActus(champs.couverture),
    photos: (lireListe(champs.photos, lireImageActus) ?? []).slice(0, PHOTOS_ACTUS_MAX),
    lieux,
    auteur,
    collaboration: champs.collaboration,
    alcool: champs.alcool,
    finLe: typeof finLe === "string" && JOUR.test(finLe) ? finLe : null,
    publieLe,
    aLaUne: champs.aLaUne === true,
    jaime: lireNombre(champs.jaime),
    commentaires: lireNombre(champs.commentaires),
    reponsesLieux,
  };
}
