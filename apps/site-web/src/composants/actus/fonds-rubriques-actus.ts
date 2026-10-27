import type { RubriqueActus } from "../../../../../packages/commun/src/regles/actus.ts";

export const FONDS_RUBRIQUES_ACTUS: Readonly<Record<RubriqueActus, string>> = {
  portrait: "bg-[linear-gradient(135deg,#FFD60A,#FF9F1C)]",
  "top-quartier": "bg-[linear-gradient(135deg,#FFC9BC,#FF6B57)]",
  "bon-plan": "bg-[linear-gradient(135deg,#D3F5DC,#4CC9A8)]",
  "recit-sortie": "bg-[linear-gradient(135deg,#D6E8FF,#8AA6FF)]",
};
