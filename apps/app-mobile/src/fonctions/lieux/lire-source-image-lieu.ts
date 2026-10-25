import type { ImageSourcePropType } from "react-native";

import type { ImageLieu } from "@sos-miam/commun/regles/images-lieu";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { IMAGES_LIEUX_DEMO } from "~/contenus/images-lieux-demo";
import { ADRESSE_API } from "~/services/adresse-api";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";
import { lireImageLieuPoseeDemo } from "~/services/demo/images-lieux-posees-demo";

export function lireSourceImageLieu(lieu: Pick<Lieu, "id" | "banniere" | "logo">, quelle: ImageLieu): ImageSourcePropType | null {
  const posee = DEMO_VISITES_ACTIVE ? lireImageLieuPoseeDemo(lieu.id, quelle) : undefined;
  const chemin = posee === undefined ? lieu[quelle] : posee;
  if (chemin) return { uri: chemin.startsWith("/") ? `${ADRESSE_API}${chemin}` : chemin };
  if (posee === null) return null;
  return DEMO_VISITES_ACTIVE ? (IMAGES_LIEUX_DEMO[lieu.id]?.[quelle] ?? null) : null;
}
