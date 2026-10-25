import type { ImageSourcePropType } from "react-native";

import type { ImageLieu } from "@sos-miam/commun/regles/images-lieu";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { ADRESSE_API } from "~/services/adresse-api";

export function lireSourceImageLieu(lieu: Pick<Lieu, "banniere" | "logo">, quelle: ImageLieu): ImageSourcePropType | null {
  const chemin = lieu[quelle];
  return chemin?.startsWith("/") ? { uri: `${ADRESSE_API}${chemin}` } : null;
}
