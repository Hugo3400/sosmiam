import { Stack } from "expo-router";

import { FournisseurBrouillon } from "~/composants/inscription/FournisseurBrouillon";
import couleurs from "~/theme/couleurs";

// Premier écran du parcours (le groupe n'a pas d'index : « / » appartient aux onglets)
export const unstable_settings = { initialRouteName: "bienvenue" };

/**
 * Parcours d'inscription : bienvenue → compte (→ e-mail et mot de passe) → fais connaissance → envies → c'est prêt ; ou « Me
 * connecter » (→ mot de passe oublié, ou un QR code scanné par un téléphone déjà connecté) pour un compte qui existe. Le
 * brouillon suit d'un écran à l'autre.
 */
export default function MiseEnPageInscription() {
  return (
    <FournisseurBrouillon>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: couleurs.creme } }}>
        <Stack.Screen name="bienvenue" />
        <Stack.Screen name="compte" />
        <Stack.Screen name="inscription-email" />
        <Stack.Screen name="connexion" />
        <Stack.Screen name="connexion-qr" />
        <Stack.Screen name="mot-de-passe-oublie" />
        <Stack.Screen name="fais-connaissance" />
        <Stack.Screen name="envies" />
        <Stack.Screen name="c-est-pret" />
      </Stack>
    </FournisseurBrouillon>
  );
}
