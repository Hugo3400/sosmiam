import type { ExpressionSpecification, Map as CarteMaplibre } from "maplibre-gl";

const NOM_EN_FRANCAIS: ExpressionSpecification = ["coalesce", ["get", "name:fr"], ["get", "name"]];

export function mettreEtiquettesEnFrancais(carte: CarteMaplibre) {
  for (const couche of carte.getStyle()?.layers ?? []) {
    if (couche.type !== "symbol") continue;
    const texte: unknown = carte.getLayoutProperty(couche.id, "text-field");
    if (texte !== undefined && JSON.stringify(texte).includes("name_en")) carte.setLayoutProperty(couche.id, "text-field", NOM_EN_FRANCAIS);
  }
}
