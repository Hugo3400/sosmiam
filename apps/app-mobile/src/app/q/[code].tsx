import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { TEXTES_INSCRIPTION_CONNEXION_PAR_LANGUE } from "~/contenus/textes-inscription-connexion";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * Le QR d'un appareil à connecter, ouvert par l'appareil photo du téléphone (sosmiam.fr/q/<code>) : avec un compte connecté,
 * on file à « Connecter un appareil » (qui demande d'abord d'où vient le lien, puis montre qui demande, et demande Face ID) ;
 * sans compte, on explique.
 */
export default function OuvrirQrConnexion() {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const T = utiliserTextes(TEXTES_INSCRIPTION_CONNEXION_PAR_LANGUE);
  const { code = "" } = useLocalSearchParams<{ code: string }>();
  const { connecte } = utiliserSession();
  const { profil } = utiliserProfil();
  const peutValider = connecte && profil !== null;
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
        <ActivityIndicator color={couleurs.encre} accessibilityLabel={T.lienOuverture} />
      </View>
    );
  }
  return (
    <EcranReglage
      titre={T.lienTitre}
      sousTitre={T.lienSousTitre}
    >
      <Bouton libelle={T.compris} variante="blanc" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
    </EcranReglage>
  );
}
