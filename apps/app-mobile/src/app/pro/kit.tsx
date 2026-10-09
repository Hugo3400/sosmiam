import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, ScrollView, Share, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";

import { construireLienLieu } from "@sos-miam/commun/fonctions/qr/construire-lien-lieu";
import { Bouton } from "~/composants/interface/Bouton";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserComptoir } from "~/hooks/utiliser-comptoir";
import { utiliserFermerPile } from "~/hooks/utiliser-fermer-pile";
import { utiliserModes } from "~/hooks/utiliser-modes";
import couleurs from "~/theme/couleurs";

/**
 * « Mon kit » : le QR de vitrine du lieu (autocollant, chevalets de table), qui ouvre sa fiche dans l'app. Il ne valide
 * jamais une visite (ça, c'est le QR du comptoir, qui change toutes les 30 s). L'affichette à imprimer est dans l'espace pro du site.
 */
export default function EcranKitPro() {
  const fermer = utiliserFermerPile();
  const { lieuPro } = utiliserModes();
  const { etat } = utiliserComptoir(lieuPro?.id ?? null);
  const lien = etat?.codePublic ? construireLienLieu(etat.codePublic) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <View className="min-h-14 flex-row items-center gap-3 px-5 pb-2 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={8}
          onPress={fermer}
          className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
        <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
          Mon kit
        </Text>
      </View>

      <ScrollView contentContainerClassName="items-center gap-6 px-5 pb-10 pt-2">
        <Text className="self-stretch font-texte text-base leading-6 text-gris">
          {lierPonctuation("Le QR de ta vitrine et de tes chevalets de table : un scan, et on tombe sur ta fiche dans SOS Miam.")}
        </Text>

        {lien ? (
          <View accessible accessibilityLabel={`QR de vitrine de ${lieuPro?.nom ?? "ton lieu"}, il ouvre ta fiche`} className="items-center gap-3 rounded-carte border-2 border-encre bg-white p-6">
            <QRCode value={lien} size={220} color={couleurs.encre} backgroundColor="#FFFFFF" ecl="M" />
            <Text className="font-texte-gras text-base text-encre">{lieuPro ? `${lieuPro.emoji} ${lieuPro.nom}` : ""}</Text>
            <Text className="font-texte text-[13px] text-gris">{lien.replace("https://", "")}</Text>
          </View>
        ) : (
          <ActivityIndicator color={couleurs.encre} accessibilityLabel="On prépare ton QR…" />
        )}

        <View className="self-stretch gap-3 rounded-carte border-2 border-ligne bg-white p-4">
          <Text className="font-texte-gras text-base text-encre">🔒 Bon à savoir</Text>
          <Text className="font-texte text-sm leading-5 text-gris">
            {lierPonctuation("Ce QR ouvre ta fiche : il ne valide jamais une visite (ça, c'est le QR du comptoir, qui change toutes les 30 s). Un scan ne demande jamais de mot de passe.")}
          </Text>
          <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation("L'affichette de table à imprimer est dans l'espace pro du site : pro.sosmiam.fr.")}</Text>
        </View>

        {lien ? (
          <Bouton
            libelle="Partager le lien de ma fiche"
            variante="blanc"
            className="self-stretch"
            onPress={() => Share.share({ message: `Retrouve-nous sur SOS Miam : ${lien}` }).catch(() => {})}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
