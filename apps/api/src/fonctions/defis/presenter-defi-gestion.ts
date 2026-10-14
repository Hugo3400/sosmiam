import type { DefiGestion, MesureDefi } from "../../../../../packages/commun/src/types/defi.ts";
import type { DefiEnBase } from "../../services/defis-regles.ts";
import { lireFiltresEnBase } from "./lire-filtres-en-base.ts";

/** Un défi tel que le logiciel de gestion le lit : brouillon complet, nombre de réussites, dates ISO 8601 */
export function presenterDefiGestion(defi: DefiEnBase & { creeLe: Date; modifieLe: Date }, reussites: number): DefiGestion {
  return {
    id: defi.id,
    emoji: defi.emoji,
    titre: defi.titre,
    texte: defi.texte,
    mesure: defi.mesure as MesureDefi,
    filtres: lireFiltresEnBase(defi.filtres),
    objectif: defi.objectif,
    points: defi.points,
    debut: defi.debut,
    fin: defi.fin,
    publie: defi.publie,
    ordre: defi.ordre,
    reussites,
    creeLe: defi.creeLe.toISOString(),
    modifieLe: defi.modifieLe.toISOString(),
  };
}
