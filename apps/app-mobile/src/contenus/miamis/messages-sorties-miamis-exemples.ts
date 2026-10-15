import type { MessageSortie } from "@sos-miam/commun/types/potes";
import { MIAMIS_EXEMPLES as M } from "~/contenus/miamis/personnes-miamis-exemples";

const ilYa = (maintenant: Date, minutes: number) => new Date(maintenant.getTime() - minutes * 60_000).toISOString();

export const MOTS_ACCUEIL_ORGANISATION = "Bienvenue à bord ! On se retrouve sur place, je serai à la table avec le petit drapeau jaune 🛟";
export const MOTS_REPONSE_MIAMIS = ["Trop bien, à tout à l'heure !", "Carrément, j'ai hâte 😋", "Bien noté, capitaine !"];

export function creerMessagesSortiesMiamisExemples(maintenant: Date): Record<string, MessageSortie[]> {
  return {
    "miamis-ce-soir": [
      { id: "mce-1", auteur: M.sam.id, texte: "J'ai réservé la grande table près du hublot 🛟", date: ilYa(maintenant, 90) },
      { id: "mce-2", auteur: M.theo.id, texte: "Je serai là à l'heure, promis ! Qui prend le dessert ?", date: ilYa(maintenant, 60) },
      { id: "mce-3", auteur: M.sam.id, texte: "L'île flottante, évidemment. On partage ?", date: ilYa(maintenant, 55) },
    ],
    "miamis-ramen": [{ id: "mra-1", auteur: M.jo.id, texte: "Merci de m'avoir accepté ! Je ramène mes baguettes porte-bonheur 🥢", date: ilYa(maintenant, 300) }],
  };
}
