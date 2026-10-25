import { lireImageLieu } from "~/fonctions/lieux/lire-image-lieu";
import { lireLienExterne } from "~/fonctions/lieux/lire-lien-externe";
import type { LieuListe } from "~/types/lieux";
import type { FichePublique } from "~/types/pro";

const ETIQUETTES_MAX = 12;
const ETIQUETTE_LONGUEUR_MAX = 40;
const LIEUX_AUTOUR_MAX = 4;
const OFFRE_LONGUEUR_MAX = 80;
const HEURE = /^\d{2}:\d{2}$/;
const INSTAGRAM = /^[A-Za-z0-9._]{1,30}$/;

const estObjet = (valeur: unknown): valeur is Record<string, unknown> => typeof valeur === "object" && valeur !== null && !Array.isArray(valeur);
const estEntierPositif = (valeur: unknown): valeur is number => typeof valeur === "number" && Number.isInteger(valeur) && valeur > 0;

function lirePosition(valeur: unknown): FichePublique["position"] {
  if (!estObjet(valeur)) return null;
  const { latitude, longitude } = valeur;
  if (typeof latitude !== "number" || typeof longitude !== "number" || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : null;
}

function lireSos(valeur: unknown): FichePublique["sos"] {
  if (!estObjet(valeur) || !estEntierPositif(valeur.places) || typeof valeur.jusqua !== "string") return null;
  const offre = typeof valeur.offre === "string" ? valeur.offre.trim().slice(0, OFFRE_LONGUEUR_MAX) : "";
  return { places: valeur.places, jusqua: valeur.jusqua, ...(offre ? { offre } : {}) };
}

function lireOuverture(valeur: unknown): NonNullable<FichePublique["ouverture"]> {
  if (!Array.isArray(valeur)) return [];
  return valeur.flatMap((creneau) => {
    if (!estObjet(creneau) || !Array.isArray(creneau.jours) || typeof creneau.de !== "string" || typeof creneau.a !== "string") return [];
    if (!HEURE.test(creneau.de) || !HEURE.test(creneau.a)) return [];
    const jours = creneau.jours.filter((jour): jour is number => Number.isInteger(jour) && jour >= 0 && jour <= 6);
    return jours.length > 0 ? [{ jours, de: creneau.de, a: creneau.a }] : [];
  });
}

function lireEtiquettes(valeur: unknown): string[] {
  if (!Array.isArray(valeur)) return [];
  const propres = valeur.filter((etiquette): etiquette is string => typeof etiquette === "string").map((etiquette) => etiquette.trim());
  return [...new Set(propres.filter((etiquette) => etiquette.length > 0 && etiquette.length <= ETIQUETTE_LONGUEUR_MAX))].slice(0, ETIQUETTES_MAX);
}

function lireAutour(valeur: unknown, lieuId: number): LieuListe[] {
  if (!Array.isArray(valeur)) return [];
  return valeur
    .filter((lieu): lieu is LieuListe => estObjet(lieu) && estEntierPositif(lieu.id) && lieu.id !== lieuId && typeof lieu.nom === "string" && lieu.nom.trim() !== "")
    .slice(0, LIEUX_AUTOUR_MAX)
    .map((lieu) => ({
      ...lieu,
      couleurs: Array.isArray(lieu.couleurs) ? lieu.couleurs : [],
      logo: lireImageLieu(lieu.logo),
      verifie: lieu.verifie === true,
      sos: estObjet(lieu.sos) && estEntierPositif(lieu.sos.places) ? { places: lieu.sos.places } : null,
    }));
}

export function nettoyerFichePublique(lieu: FichePublique): FichePublique {
  return {
    ...lieu,
    siteWeb: lireLienExterne(lieu.siteWeb),
    instagram: typeof lieu.instagram === "string" && INSTAGRAM.test(lieu.instagram) ? lieu.instagram : null,
    banniere: lireImageLieu(lieu.banniere),
    logo: lireImageLieu(lieu.logo),
    position: lirePosition(lieu.position),
    sos: lireSos(lieu.sos),
    ouverture: lireOuverture(lieu.ouverture),
    etiquettes: lireEtiquettes(lieu.etiquettes),
    autour: lireAutour(lieu.autour, lieu.id),
    reservable: lieu.reservable === true,
  };
}
