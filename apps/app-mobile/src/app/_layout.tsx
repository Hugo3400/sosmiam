import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

/** Racine de l'app : la pile d'écrans (les onglets, puis plus tard la fiche d'un lieu, le BIG SOS, le compte). */
export default function RacineApp() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
