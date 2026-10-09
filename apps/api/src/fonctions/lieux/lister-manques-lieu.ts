/** Ce qu'il faut regarder d'une fiche pour savoir ce qui lui manque */
export type FichePourManques = {
  info: string; texte: string; adresse: string | null; quartier: string; ville: string; latitude: number | null; longitude: number | null;
  horaires: string; ouverture: unknown; plat: string; telephone: string | null; siteWeb: string | null; instagram: string | null;
  animaux: string | null; accessible: boolean | null; terrasse: boolean | null; wifi: boolean | null; enfants: boolean | null;
  parking: boolean | null; paiements: string[]; reservation: string | null;
};

/** Points vérifiés, dans l'ordre de la fiche ; une présentation de moins de 80 caractères compte comme manquante */
export const POINTS_FICHE = ["categorie", "presentation", "adresse", "position", "quartier", "horaires", "creneaux", "plat", "contact", "infos-pratiques"] as const;
export type PointFiche = (typeof POINTS_FICHE)[number];

const vide = (texte: string | null | undefined) => !texte || !texte.trim();

/**
 * Ce qui manque à une fiche de lieu pour être complète avant sa mise en ligne : catégorie, présentation d'au moins
 * 80 caractères, adresse, position sur la carte, quartier, horaires, créneaux d'ouverture (pour « ouvert maintenant »),
 * plat signature, un moyen de contact, et au moins une info pratique. Rend la liste des points manquants (vide : complète).
 */
export function listerManquesLieu(fiche: FichePourManques): PointFiche[] {
  const manques: PointFiche[] = [];
  if (vide(fiche.info)) manques.push("categorie");
  if (fiche.texte.trim().length < 80) manques.push("presentation");
  if (vide(fiche.adresse)) manques.push("adresse");
  if (fiche.latitude === null || fiche.longitude === null) manques.push("position");
  if (vide(fiche.quartier)) manques.push("quartier");
  if (vide(fiche.horaires)) manques.push("horaires");
  if (!Array.isArray(fiche.ouverture) || fiche.ouverture.length === 0) manques.push("creneaux");
  if (vide(fiche.plat)) manques.push("plat");
  if (vide(fiche.telephone) && vide(fiche.siteWeb) && vide(fiche.instagram)) manques.push("contact");
  const infos = [fiche.animaux, fiche.accessible, fiche.terrasse, fiche.wifi, fiche.enfants, fiche.parking, fiche.reservation];
  if (infos.every((info) => info === null) && fiche.paiements.length === 0) manques.push("infos-pratiques");
  return manques;
}
