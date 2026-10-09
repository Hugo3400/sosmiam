import { simplifierNom } from "../texte/simplifier-nom.ts";

/** Noms de colonnes reconnus (simplifiés : sans accents ni majuscules) → champ d'une fiche de lieu */
const COLONNES: Record<string, string> = {
  nom: "nom", "nom du lieu": "nom", name: "nom", etablissement: "nom",
  type: "type",
  categorie: "info", "ce que c est": "info", info: "info", cuisine: "info",
  ville: "ville", commune: "ville", city: "ville",
  quartier: "quartier",
  adresse: "adresse", address: "adresse", rue: "adresse",
  latitude: "latitude", lat: "latitude",
  longitude: "longitude", lon: "longitude", lng: "longitude",
  horaires: "horaires",
  plat: "plat", "plat signature": "plat",
  telephone: "telephone", tel: "telephone", phone: "telephone",
  site: "siteWeb", "site web": "siteWeb", siteweb: "siteWeb", url: "siteWeb",
  instagram: "instagram", insta: "instagram",
  prix: "prix", "prix moyen": "prixMoyen",
  presentation: "texte", description: "texte", texte: "texte",
};

/** Types reconnus dans la colonne « type » (simplifiés) */
const TYPES: Record<string, string> = {
  resto: "resto", restaurant: "resto", restauration: "resto",
  bar: "bar", pub: "bar", cave: "bar",
  patisserie: "patisserie", boulangerie: "patisserie", salon: "patisserie",
  sortie: "sortie", activite: "sortie", loisir: "sortie",
};

const nombre = (valeur: string) => {
  const propre = valeur.trim().replace(",", ".");
  const n = propre === "" ? NaN : Number(propre);
  return Number.isFinite(n) ? n : null;
};

/**
 * Les lignes d'un CSV (la première donne les colonnes) en fiches à importer : colonnes reconnues par leur nom (« Nom »,
 * « Commune », « Site web »…), type reconnu (« Restaurant » → resto), nombres à virgule acceptés, cellules vides
 * laissées de côté. Rend aussi les colonnes ignorées, pour le dire avant d'importer.
 */
export function convertirLignesLieux(tableau: string[][]): { lieux: Record<string, unknown>[]; reconnues: string[]; ignorees: string[] } {
  const [entetes = [], ...lignes] = tableau;
  const champs = entetes.map((entete) => COLONNES[simplifierNom(entete)] ?? null);
  const lieux = lignes.map((ligne) => {
    const fiche: Record<string, unknown> = {};
    champs.forEach((champ, colonne) => {
      const valeur = (ligne[colonne] ?? "").trim();
      if (!champ || !valeur || champ in fiche) return;
      if (champ === "type") fiche.type = TYPES[simplifierNom(valeur).split(" ")[0] ?? ""] ?? valeur;
      else if (champ === "latitude" || champ === "longitude" || champ === "prixMoyen") fiche[champ] = nombre(valeur) ?? valeur;
      else if (champ === "siteWeb" && /^www\./i.test(valeur)) fiche.siteWeb = `https://${valeur}`;
      else fiche[champ] = valeur;
    });
    return fiche;
  });
  return {
    lieux,
    reconnues: entetes.filter((_, i) => champs[i]),
    ignorees: entetes.filter((entete, i) => !champs[i] && entete.trim()),
  };
}
