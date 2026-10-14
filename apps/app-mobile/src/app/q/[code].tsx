import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";
import couleurs from "~/theme/couleurs";

/**
 * Le QR d'un appareil à connecter, ouvert par l'appareil photo du téléphone (sosmiam.fr/q/<code>) : avec un compte connecté,
 * on file à « Connecter un appareil » (qui demande d'abord d'où vient le lien, puis montre qui demande, et demande Face ID) ;
 * sans compte, on explique. En démo (pas de vraie session), on y file aussi : la demande montrée est un exemple.
 */
export default function OuvrirQrConnexion() {
  const router = useRouter();
  const { code = "" } = useLocalSearchParams<{ code: string }>();
  const { connecte } = utiliserSession();
  const { profil } = utiliserProfil();
  const peutValider = (connecte || DEMO_VISITES_ACTIVE) && profil !== null;
  const parti = useRef(false);

  useEffect(() => {
    if (!peutValider || parti.current) return;
    parti.current = true;
    if (router.canGoBack()) router.replace({ pathname: "/reglages/connecter-appareil", params: { code } });
    else {
      // L'app lancée par le lien : rien dessous. Les onglets d'abord, pour que « Retour » ramène quelque part
      router.replace("/");
      router.push({ pathname: "/reglages/connecter-appareil", params: { code } });
    }
  }, [peutValider, code, router]);

  if (peutValider) {
    return (
      <View className="flex-1 items-center justify-center bg-creme">
        <ActivityIndicator color={couleurs.encre} accessibilityLabel="On ouvre la connexion de l'appareil" />
      </View>
    );
  }
  return (
    <EcranReglage
      titre="Ce QR sert à connecter un appareil"
      sousTitre="Scanne-le avec un téléphone où tu es déjà connecté à SOS Miam : Profil → ⚙️ Réglages → Mon compte → « Connecter un appareil »."
    >
      <Bouton libelle="Compris" variante="blanc" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
    </EcranReglage>
  );
}
