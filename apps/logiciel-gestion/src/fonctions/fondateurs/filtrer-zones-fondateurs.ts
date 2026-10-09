import type { ZoneFondateurs } from "~/services/fondateurs.ts";

export type FiltreZones = "toutes" | "villes" | "departements" | "actives" | "completes";

const sansAccents = (texte: string) => texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[-'’\s]+/g, " ").trim();

/**
 * Les zones qui répondent au filtre (« actives » : au moins une candidature en attente, un fondateur ou un souvenir ;
 * « completes » : plus aucune place) et à la recherche (nom sans accents ni tirets, ou numéro de département), sans
 * changer leur ordre.
 */
export function filtrerZonesFondateurs(zones: ZoneFondateurs[], filtre: FiltreZones, recherche: string): ZoneFondateurs[] {
  const texte = sansAccents(recherche);
  return zones.filter((zone) => {
    if (filtre === "villes" && zone.type !== "ville") return false;
    if (filtre === "departements" && zone.type !== "departement") return false;
    if (filtre === "actives" && zone.prises + zone.enAttente + zone.souvenirs === 0) return false;
    if (filtre === "completes" && zone.prises < zone.places) return false;
    return !texte || sansAccents(zone.nom).includes(texte) || zone.codeDepartement.toLowerCase() === texte;
  });
}
