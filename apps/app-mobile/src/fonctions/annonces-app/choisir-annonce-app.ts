import type { AnnonceApp } from "@sos-miam/commun/types/annonce-app";

function estLisible(annonce: unknown): annonce is AnnonceApp {
  if (typeof annonce !== "object" || annonce === null) return false;
  const { id, titre, texte, fin } = annonce as Record<string, unknown>;
  return (
    Number.isInteger(id) &&
    typeof titre === "string" &&
    titre.trim() !== "" &&
    typeof texte === "string" &&
    (fin === null || fin === undefined || typeof fin === "string")
  );
}

function estEnCours(annonce: AnnonceApp, maintenant: number): boolean {
  if (annonce.fin === null || annonce.fin === undefined) return true;
  const fin = Date.parse(annonce.fin);
  return Number.isFinite(fin) && fin > maintenant;
}

export function choisirAnnonceApp(annonces: readonly AnnonceApp[], vues: readonly number[], maintenant: number): AnnonceApp | null {
  if (!Array.isArray(annonces)) return null;
  const dejaVues = new Set(vues);
  return annonces.find((annonce) => estLisible(annonce) && !dejaVues.has(annonce.id) && estEnCours(annonce, maintenant)) ?? null;
}
