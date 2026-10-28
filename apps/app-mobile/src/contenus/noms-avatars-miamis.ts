import { AVATARS_MIAMIS, type IdMiamiAuChoix } from "@sos-miam/commun/regles/avatars-miamis";
import type { ParLangue } from "@sos-miam/commun/types/traduction";
import { NOMS_AVATARS_MIAMIS_ANGLAIS } from "~/contenus/anglais/noms-avatars-miamis";

export const NOMS_AVATARS_MIAMIS = Object.fromEntries(AVATARS_MIAMIS.map(({ id, nom }) => [id, `Miami ${nom}`])) as Readonly<Record<IdMiamiAuChoix, string>>;

export const NOMS_AVATARS_MIAMIS_PAR_LANGUE: ParLangue<Readonly<Record<IdMiamiAuChoix, string>>> = { fr: NOMS_AVATARS_MIAMIS, en: NOMS_AVATARS_MIAMIS_ANGLAIS };
