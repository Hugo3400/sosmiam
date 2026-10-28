import { PALIERS_AMBASSADEUR } from "../regles/ambassadeurs.ts";
import type { PalierAmbassadeur } from "../types/ambassadeur.ts";
import type { ParLangue } from "../types/traduction.ts";
import { NOMS_PALIERS_ANGLAIS } from "./anglais/noms-paliers.ts";

export type NomsPaliers = Readonly<Record<PalierAmbassadeur["cle"], string>>;

export const NOMS_PALIERS: NomsPaliers = Object.fromEntries(PALIERS_AMBASSADEUR.map((palier) => [palier.cle, palier.nom])) as NomsPaliers;

export const NOMS_PALIERS_PAR_LANGUE: ParLangue<NomsPaliers> = { fr: NOMS_PALIERS, en: NOMS_PALIERS_ANGLAIS };
