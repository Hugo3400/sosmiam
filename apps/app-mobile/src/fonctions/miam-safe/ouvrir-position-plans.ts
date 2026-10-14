import { Linking, Platform } from "react-native";

import type { PositionMiamSafe } from "@sos-miam/commun/types/miam-safe";

/** Ouvre la position d'un pote dans l'app de cartes du téléphone (Plans sur iPhone, Maps sur Android, sinon le navigateur). */
export async function ouvrirPositionPlans(position: PositionMiamSafe, libelle: string): Promise<void> {
  const { latitude, longitude } = position;
  const nom = encodeURIComponent(libelle);
  const lien = Platform.select({
    ios: `maps:?ll=${latitude},${longitude}&q=${nom}`,
    android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${nom})`,
    default: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`,
  });
  await Linking.openURL(lien).catch(() => Linking.openURL(`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`));
}
