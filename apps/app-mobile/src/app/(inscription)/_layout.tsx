import { Stack } from "expo-router";

import { FournisseurBrouillon } from "~/composants/inscription/FournisseurBrouillon";
import couleurs from "~/theme/couleurs";

// Premier écran du parcours (le groupe n'a pas d'index : « / » appartient aux onglets)
export const unstable_settings = { initialRouteName: "bienvenue" };

/** Parcours d'inscription : bienvenue → compte → fais connaissance → envies → c'est prêt. Le brouillon suit d'un écran à l'autre. */
export default function MiseEnPageInscription() {
  return (
    <FournisseurBrouillon>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: couleurs.creme } }}>
        <Stack.Screen name="bienvenue" />
        <Stack.Screen name="compte" />
        <Stack.Screen name="fais-connaissance" />
        <Stack.Screen name="envies" />
        <Stack.Screen name="c-est-pret" />
      </Stack>
    </FournisseurBrouillon>
  );
}
