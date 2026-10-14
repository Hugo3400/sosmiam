import { MESURES_DEFI, TYPES_LIEU_DEFI } from "../../contenus/defis.ts";
import type { BrouillonDefi } from "../../services/defis.ts";

/** La règle d'un défi en une ligne : « 3 visites validées · pâtisseries · après 22 h · pendant un SOS ». */
export function decrireRegleDefi(defi: Pick<BrouillonDefi, "mesure" | "filtres" | "objectif">): string {
  const f = defi.filtres ?? {};
  return [
    `${defi.objectif} ${MESURES_DEFI[defi.mesure][defi.objectif > 1 ? 1 : 0]}`,
    f.typesLieu?.length ? f.typesLieu.map((type) => (TYPES_LIEU_DEFI[type] ?? type).toLowerCase()).join(" ou ") : "",
    f.apresHeure !== undefined ? `après ${f.apresHeure} h` : "",
    f.pendantSos ? "pendant un SOS" : "",
    f.avecPhoto ? "avec photo" : "",
  ].filter(Boolean).join(" · ");
}
