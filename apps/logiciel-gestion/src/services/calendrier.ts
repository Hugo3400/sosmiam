import { appeler, parametres } from "./client-gestion.ts";

export type TypeEvenement = "publication" | "notification" | "big-sos" | "mission" | "newsletter" | "annonce";
export type EvenementCalendrier = { type: TypeEvenement; id: number; debut: string; fin: string | null; titre: string; detail: string };

/** Du jour « debut » inclus au jour « fin » exclu (AAAA-MM-JJ) */
export const lireCalendrier = (debut: string, fin: string) => appeler<EvenementCalendrier[]>("GET", `/calendrier${parametres({ debut, fin })}`);
