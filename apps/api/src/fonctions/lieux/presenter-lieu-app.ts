// Un lieu de la base, mis au format de l'app (type LieuApi de packages/commun). Jamais la note interne, le statut ni qui
// gère le lieu : seulement « vérifié » (au moins un rattachement validé, docs/decisions.md « Lieux vérifiés »).
import type { InfosPratiques } from "../../../../../packages/commun/src/types/infos-pratiques.ts";
import { JOURS_LIEU_NOUVEAU } from "../../../../../packages/commun/src/regles/lieux-nouveaux.ts";
import type { CreneauOuverture, EnvieLieu, LieuApi, TypeLieu } from "../../../../../packages/commun/src/types/lieu.ts";
import { formaterHeureParis } from "../dates/formater-heure-paris.ts";

/** Ce que le service lit d'un lieu publié */
export type LigneLieuApp = {
  id: number;
  nom: string;
  type: string;
  emoji: string;
  info: string;
  texte: string;
  quartier: string;
  ville: string;
  latitude: number | null;
  longitude: number | null;
  prix: string;
  prixMoyen: number | null;
  couleurs: string[];
  horaires: string;
  ouverture: unknown;
  plat: string;
  tags: string[];
  envies: string[];
  reservable: boolean;
  telephone: string | null;
  siteWeb: string | null;
  instagram: string | null;
  animaux: string | null;
  accessible: boolean | null;
  terrasse: boolean | null;
  wifi: boolean | null;
  enfants: boolean | null;
  parking: boolean | null;
  paiements: string[];
  reservation: string | null;
  decouvertPar: string | null;
  /** Rattachements validés (gérant ou équipe) : au moins un, et le lieu est « vérifié » */
  rattachementsValides: number;
  /** Rescousses reçues depuis toujours */
  rescousses: number;
  /** Le SOS du soir le plus récent qui n'est pas arrêté (son heure de fin est revérifiée ici) ; null sinon */
  sos: { places: number; jusqua: Date; offre: string | null } | null;
  /** Message du moment, montré jusqu'à alerteJusqua (sans fin : jusqu'à ce que le lieu le retire) */
  alerte: string | null;
  alerteJusqua: Date | null;
  /** Première mise en ligne (posée par la base) : « nouveau » pendant JOURS_LIEU_NOUVEAU jours */
  publieLe: Date | null;
};

const JOUR_MS = 24 * 60 * 60 * 1000;

/** Les deux couleurs du dégradé, quand le lieu n'en a pas deux (lieu importé ou demandé depuis le site) */
const COULEURS_REPLI: [string, string] = ["#FFD60A", "#FF4D3D"];
const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Les créneaux d'ouverture bien formés (les autres sont laissés de côté : jamais d'« ouvert maintenant » faux) */
function lireOuverture(brut: unknown): CreneauOuverture[] {
  if (!Array.isArray(brut)) return [];
  return brut.flatMap((c): CreneauOuverture[] => {
    if (typeof c !== "object" || c === null) return [];
    const { jours, de, a } = c as Record<string, unknown>;
    if (!Array.isArray(jours) || !jours.every((j) => Number.isInteger(j) && j >= 0 && j <= 6)) return [];
    if (typeof de !== "string" || typeof a !== "string" || !HEURE.test(de) || !HEURE.test(a)) return [];
    return [{ jours: [...new Set(jours as number[])], de, a }];
  });
}

/** Les infos pratiques connues (une info inconnue n'est jamais envoyée) ; null si on ne sait rien */
function lirePratique(l: LigneLieuApp): InfosPratiques | undefined {
  const p: Record<string, unknown> = {};
  if (l.telephone) p.telephone = l.telephone;
  if (l.siteWeb) p.siteWeb = l.siteWeb;
  if (l.instagram) p.instagram = l.instagram;
  if (l.animaux) p.animaux = l.animaux;
  for (const cle of ["accessible", "terrasse", "wifi", "enfants", "parking"] as const) if (l[cle] !== null) p[cle] = l[cle];
  if (l.paiements.length > 0) p.paiements = l.paiements;
  if (l.reservation) p.reservation = l.reservation;
  return Object.keys(p).length > 0 ? (p as InfosPratiques) : undefined;
}

/**
 * Met un lieu publié au format de l'app. La distance (km) n'y est pas : l'app la calcule, la position du téléphone n'étant
 * jamais envoyée. Le SOS du soir n'est montré que pour un lieu vérifié et tant que son heure n'est pas passée (« HH:MM » à
 * Paris) ; le message du moment, tant qu'il n'a pas expiré ; « nouveau » pendant 30 jours après la première mise en ligne.
 */
export function presenterLieuApp(l: LigneLieuApp, maintenant: Date): LieuApi {
  const pratique = lirePratique(l);
  const verifie = l.rattachementsValides > 0;
  const sos = verifie && l.sos && l.sos.jusqua > maintenant ? l.sos : null;
  const alerte = l.alerte && (!l.alerteJusqua || l.alerteJusqua > maintenant) ? l.alerte : null;
  const nouveau = l.publieLe !== null && maintenant.getTime() - l.publieLe.getTime() < JOURS_LIEU_NOUVEAU * JOUR_MS;
  return {
    id: l.id,
    nom: l.nom,
    type: l.type as TypeLieu,
    emoji: l.emoji,
    quartier: l.quartier,
    ville: l.ville,
    ...(l.latitude !== null && l.longitude !== null ? { position: { latitude: l.latitude, longitude: l.longitude } } : {}),
    prix: l.prix as LieuApi["prix"],
    ...(l.prixMoyen !== null ? { prixMoyen: l.prixMoyen } : {}),
    info: l.info,
    couleurs: l.couleurs.length >= 2 ? [l.couleurs[0], l.couleurs[1]] : COULEURS_REPLI,
    texte: l.texte,
    rescousses: l.rescousses,
    ...(alerte ? { alerte } : {}),
    ...(sos ? { sos: { places: sos.places, jusqua: formaterHeureParis(sos.jusqua), ...(sos.offre ? { offre: sos.offre } : {}) } } : {}),
    horaires: l.horaires,
    ouverture: lireOuverture(l.ouverture),
    plat: l.plat,
    tags: l.tags,
    envies: l.envies as EnvieLieu[],
    ...(l.decouvertPar ? { decouvertPar: l.decouvertPar } : {}),
    ...(nouveau ? { nouveau: true } : {}),
    reservable: l.reservable,
    verifie,
    ...(pratique ? { pratique } : {}),
  };
}
