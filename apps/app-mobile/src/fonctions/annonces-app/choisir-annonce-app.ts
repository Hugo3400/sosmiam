import type { AnnonceApp } from "@sos-miam/commun/types/annonce-app";

const estTexteRempli = (valeur: unknown): valeur is string => typeof valeur === "string" && valeur.trim() !== "";

function estBoutonLisible(bouton: unknown): boolean {
  if (bouton === null || bouton === undefined) return true;
  if (typeof bouton !== "object") return false;
  const { libelle, lien } = bouton as Record<string, unknown>;
  return estTexteRempli(libelle) && typeof lien === "string";
}

function estLisible(annonce: unknown): annonce is AnnonceApp {
  if (typeof annonce !== "object" || annonce === null) return false;
  const { id, titre, texte, emoji, bouton, fin } = annonce as Record<string, unknown>;
  return (
    Number.isSafeInteger(id) &&
    estTexteRempli(titre) &&
    typeof texte === "string" &&
    (emoji === null || emoji === undefined || typeof emoji === "string") &&
    estBoutonLisible(bouton) &&
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
