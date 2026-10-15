import type { EvenementMiamis } from "@sos-miam/commun/types/qui-est-la";
import { MIAMIS_EXEMPLES as M } from "~/contenus/miamis/personnes-miamis-exemples";

const ilYa = (maintenant: Date, minutes: number) => new Date(maintenant.getTime() - minutes * 60_000).toISOString();

export function creerFilMiamisExemples(maintenant: Date): EvenementMiamis[] {
  return [
    { id: "f-1", auteur: M.sam, type: "idee-proposee", titre: "Le classement des meilleures frites de la ville", nombre: 1, date: ilYa(maintenant, 4) },
    { id: "f-2", auteur: M.nina, type: "sortie-rejointe", titre: "Tournée des crêpes", nombre: 1, date: ilYa(maintenant, 12) },
    { id: "f-3", auteur: null, type: "reponse-brigade", titre: "Un filtre « J'ai 10 € pour manger »", nombre: 1, date: ilYa(maintenant, 60) },
    { id: "f-4", auteur: M.yanis, type: "votes-idees", titre: "", nombre: 3, date: ilYa(maintenant, 120) },
    { id: "f-5", auteur: M.zoe, type: "sortie-organisee", titre: "Pique-nique des Miamis", nombre: 1, date: ilYa(maintenant, 300) },
  ];
}
