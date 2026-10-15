import type { Prisma } from "../base-de-donnees/client-genere/client.ts";

export const CHAMPS_SORTIE_MIAMIS = {
  id: true, organisateurId: true, lieuId: true, conversationId: true, titre: true, description: true, quand: true, villeCle: true, publicType: true,
  publicValeur: true, places: true, placeGardeeNouveau: true, recurrente: true, serieId: true, suiteTraiteeLe: true, rappelEnvoyeLe: true, annuleeLe: true,
  annulationTardive: true, retireeLe: true, version: true, creeLe: true,
  etiquettes: { where: { retireeLe: null }, select: { nom: true, officielle: true }, orderBy: { nom: "asc" } },
} as const satisfies Prisma.SortieDesMiamisSelect;
