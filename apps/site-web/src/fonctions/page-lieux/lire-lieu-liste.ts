import { lireImageLieu } from "~/fonctions/lieux/lire-image-lieu";
import type { CategorieLieu, LieuListe } from "~/types/lieux";

const TYPES: ReadonlySet<string> = new Set<CategorieLieu>(["resto", "patisserie", "bar", "sortie"]);

const lireTexte = (valeur: unknown) => (typeof valeur === "string" ? valeur : "");

export function lireLieuListe(brut: unknown): LieuListe | null {
  if (typeof brut !== "object" || brut === null) return null;
  const lieu = brut as Record<string, unknown>;
  if (!Number.isSafeInteger(lieu.id) || (lieu.id as number) <= 0) return null;
  if (typeof lieu.nom !== "string" || !lieu.nom.trim() || typeof lieu.type !== "string" || !TYPES.has(lieu.type)) return null;
  const sos = typeof lieu.sos === "object" && lieu.sos !== null ? (lieu.sos as { places?: unknown }).places : null;
  return {
    id: lieu.id as number,
    nom: lieu.nom,
    type: lieu.type as CategorieLieu,
    emoji: lireTexte(lieu.emoji),
    info: lireTexte(lieu.info),
    quartier: lireTexte(lieu.quartier),
    ville: lireTexte(lieu.ville),
    prix: lireTexte(lieu.prix),
    couleurs: Array.isArray(lieu.couleurs) ? lieu.couleurs.filter((couleur): couleur is string => typeof couleur === "string") : [],
    decouvertPar: typeof lieu.decouvertPar === "string" && lieu.decouvertPar.trim() ? lieu.decouvertPar : null,
    logo: lireImageLieu(lieu.logo),
    verifie: lieu.verifie === true,
    sos: lieu.verifie === true && Number.isSafeInteger(sos) && (sos as number) > 0 ? { places: sos as number } : null,
  };
}
