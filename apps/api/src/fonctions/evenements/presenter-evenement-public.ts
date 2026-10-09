import { estEvenementAlcool } from "../../../../../packages/commun/src/fonctions/evenements/est-evenement-alcool.ts";
import type { EvenementLieuPublic } from "../../../../../packages/commun/src/types/evenement.ts";
import type { EvenementAvecLieu } from "../../services/evenements-regles.ts";

/**
 * Un événement à une de ses dates, tel que l'app le voit : jamais qui l'a publié, ni le nombre d'intéressés, ni la
 * modération. Alcool relu à chaque fois (case, mots, lieu de type bar).
 */
export function presenterEvenementPublic(e: EvenementAvecLieu, date: { debut: Date; fin: Date | null }): EvenementLieuPublic {
  const { publie: _publie, verifie: _verifie, ...lieu } = e.lieu;
  return {
    id: e.id, lieu, titre: e.titre, type: e.type, description: e.description,
    debut: date.debut.toISOString(), fin: date.fin?.toISOString() ?? null, hebdoJusqua: e.hebdoJusqua?.toISOString() ?? null,
    tarif: e.tarif, prixCentimes: e.prixCentimes, places: e.places, photo: e.photo, alcool: estEvenementAlcool(e, e.lieu.type),
  };
}
