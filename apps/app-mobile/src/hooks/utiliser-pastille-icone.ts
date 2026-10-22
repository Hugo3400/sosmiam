import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { calculerPastilleIcone } from "@sos-miam/commun/fonctions/messagerie/calculer-pastille-icone";
import { utiliserPoulsSocial } from "~/hooks/utiliser-pouls-social";
import { utiliserProfil } from "~/hooks/utiliser-profil";

export function utiliserPastilleIcone(): void {
  const { pouls } = utiliserPoulsSocial();
  const { profil, chargement } = utiliserProfil();
  const derniere = useRef<number | null>(null);
  const total = chargement ? null : !profil ? 0 : pouls ? calculerPastilleIcone(pouls) : null;

  useEffect(() => {
    if (Platform.OS === "web" || total === null || total === derniere.current) return;
    derniere.current = total;
    Notifications.setBadgeCountAsync(total).catch(() => undefined);
  }, [total]);
}
