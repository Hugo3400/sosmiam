import { calculerProchaineOccurrence } from "../../../../../packages/commun/src/fonctions/evenements/calculer-prochaine-occurrence.ts";
import { estEvenementAlcool } from "../../../../../packages/commun/src/fonctions/evenements/est-evenement-alcool.ts";
import type { EvenementLieuPro } from "../../../../../packages/commun/src/types/evenement.ts";
import type { TypeLieu } from "../../../../../packages/commun/src/types/lieu.ts";
import type { EvenementEquipe } from "../../services/evenements-regles.ts";

/** Un événement tel que l'équipe du lieu le voit : son réglage, sa prochaine date, son statut, les intéressés (un nombre) */
export function presenterEvenementPro(e: EvenementEquipe, typeLieu: TypeLieu, maintenant: Date): EvenementLieuPro {
  const prochaine = e.annuleLe === null ? calculerProchaineOccurrence(e, maintenant) : null;
  const iso = (date: Date | null) => date?.toISOString() ?? null;
  return {
    id: e.id, titre: e.titre, type: e.type, description: e.description,
    debut: e.debut.toISOString(), fin: iso(e.fin), hebdoJusqua: iso(e.hebdoJusqua),
    tarif: e.tarif, prixCentimes: e.prixCentimes, places: e.places, photo: e.photo, alcool: estEvenementAlcool(e, typeLieu),
    prochaine: prochaine ? { debut: prochaine.debut.toISOString(), fin: iso(prochaine.fin) } : null,
    statut: e.annuleLe !== null ? "annule" : prochaine ? "a-venir" : "passe",
    annuleLe: iso(e.annuleLe), suspendu: e.suspendu, interesses: e.interesses, publiePar: e.publiePar,
    creeLe: e.creeLe.toISOString(), modifieLe: e.modifieLe.toISOString(),
  };
}
