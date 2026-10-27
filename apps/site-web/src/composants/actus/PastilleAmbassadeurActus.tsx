import { LIBELLES_ACTUS_PAR_LANGUE } from "../../../../../packages/commun/src/contenus/libelles-actus.ts";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function PastilleAmbassadeurActus() {
  const L = utiliserTextes(LIBELLES_ACTUS_PAR_LANGUE);
  return <span className="inline-block rounded-full border-[1.5px] border-encre bg-jaune-clair px-2 py-px text-[11px] font-extrabold text-encre">{L.ambassadeur}</span>;
}
