import { BADGES } from "@sos-miam/commun/contenus/badges";
import { BADGES_ACTUS } from "@sos-miam/commun/regles/actus";
import { ACTUS_VISIBLES } from "~/services/actus-visibles";

const IDS_ACTUS = new Set<string>(BADGES_ACTUS.map((b) => b.id));

export const BADGES_VISIBLES = ACTUS_VISIBLES ? BADGES : BADGES.filter((b) => !IDS_ACTUS.has(b.id));
