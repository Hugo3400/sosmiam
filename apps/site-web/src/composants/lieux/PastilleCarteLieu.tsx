import { TEXTES_CARTE_LIEU_PAR_LANGUE } from "~/contenus/carte-lieu";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { LieuCarte } from "~/types/lieux";

const CLASSE = "self-start rounded-full px-2.5 py-0.5 text-xs font-bold";

export function PastilleCarteLieu({ lieu }: { lieu: Pick<LieuCarte, "sos" | "verifie"> }) {
  const T = utiliserTextes(TEXTES_CARTE_LIEU_PAR_LANGUE);
  if (lieu.sos) return <span className={`${CLASSE} border-[1.5px] border-rouge-sos bg-rose-alerte text-rouge-texte`}>{T.sos(lieu.sos.places)}</span>;
  if (lieu.verifie === true) return <span className={`${CLASSE} border-[1.5px] border-encre bg-jaune text-encre`}>{T.verifie}</span>;
  if (lieu.verifie === false) return <span className={`${CLASSE} border-[1.5px] border-dashed border-gris bg-creme text-gris`}>{T.nonVerifie}</span>;
  return null;
}
