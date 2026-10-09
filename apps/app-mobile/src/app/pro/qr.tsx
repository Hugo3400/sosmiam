import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DUREE_FENETRE_QR_MS } from "@sos-miam/commun/regles/visites";
import { Bouton } from "~/composants/interface/Bouton";
import { BandeauValidationsQr } from "~/composants/pro/BandeauValidationsQr";
import { ChoixPersonnesQr } from "~/composants/pro/ChoixPersonnesQr";
import { QrTournant } from "~/composants/pro/QrTournant";
import { EtiquettesReglement } from "~/composants/visites/EtiquettesReglement";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserFermerPile } from "~/hooks/utiliser-fermer-pile";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserQrTournant } from "~/hooks/utiliser-qr-tournant";
import couleurs from "~/theme/couleurs";

/**
 * Le QR du comptoir en grand, à tourner vers le client après le paiement : il change toutes les 30 s (l'anneau le
 * montre), s'éteint après 2 minutes ou quand tout le monde a scanné, et l'écran reste allumé pendant ce temps.
 */
export default function EcranQrComptoir() {
  const { width } = useWindowDimensions();
  const fermer = utiliserFermerPile();
  const { lieuPro } = utiliserModes();
  const comptoir = utiliserQrTournant(lieuPro?.id ?? null);
  const { etat } = comptoir;
  const qr = etat?.qr ?? null;
  const [maintenant, setMaintenant] = useState(() => new Date());
  const [choixQr, setChoixQr] = useState(false);

  useEffect(() => {
    const minuterie = setInterval(() => setMaintenant(new Date()), 1000);
    return () => clearInterval(minuterie);
  }, []);

  const taille = Math.min(width - 48, 360);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <View className="min-h-14 flex-row items-center justify-between px-5 pb-2 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Revenir au comptoir"
          hitSlop={8}
          onPress={() => {
            vibrerLegerement();
            fermer();
          }}
          className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
        >
          <Ionicons name="close" size={22} color={couleurs.encre} />
        </Pressable>
        <Text className="font-texte-gras text-base text-encre">
          {lieuPro ? `${lieuPro.emoji} ${lieuPro.nom}` : ""}
        </Text>
        <View className="h-11 w-11" />
      </View>

      <ScrollView contentContainerClassName="flex-grow items-center gap-6 px-6 pb-8 pt-2">
        {qr ? (
          <>
            <View className="items-center gap-1.5">
              <Text accessibilityRole="header" className="text-center font-titre text-3xl text-encre">
                Scanne-moi
              </Text>
              <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation("Une fois l'addition payée : onglet Scan → « Scanner le QR du comptoir ».")}</Text>
            </View>
            <View accessible accessibilityLabel={`QR du comptoir de ${lieuPro?.nom ?? "ton lieu"}. Il change toutes les 30 secondes.`}>
              <QrTournant texte={qr.texte} fenetre={qr.fenetre} changeDansMs={qr.changeDansMs} dureeMs={DUREE_FENETRE_QR_MS} taille={taille} />
            </View>
            <EtiquettesReglement reglement={qr.reglement} pour="lieu" centre />
            <BandeauValidationsQr qr={qr} validees={etat?.validees ?? []} maintenant={maintenant} />
            <Bouton
              libelle="Éteindre le QR"
              variante="blanc"
              className="self-stretch"
              onPress={async () => {
                const r = await comptoir.cacherQr();
                if (r.ok) fermer();
              }}
            />
          </>
        ) : (
          <View className="flex-1 items-center justify-center gap-4 py-10">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-6xl">
              ✅
            </Text>
            <Text accessibilityRole="header" className="text-center font-titre text-3xl text-encre">
              QR éteint
            </Text>
            <Text className="text-center font-texte text-base leading-6 text-gris">
              {lierPonctuation(etat ? "Tout le monde a scanné, ou les 2 minutes sont passées. Une autre table ? Montre un nouveau QR." : "On allume le comptoir…")}
            </Text>
            {etat ? <Bouton libelle="Montrer un nouveau QR" onPress={() => setChoixQr(true)} className="self-stretch" /> : null}
            <Bouton libelle="Revenir au comptoir" variante="blanc" onPress={fermer} className="self-stretch" />
          </View>
        )}
      </ScrollView>

      <ChoixPersonnesQr
        visible={choixQr}
        onMontrer={async (personnes, reglement) => {
          setChoixQr(false);
          await comptoir.montrerQr(personnes, reglement);
        }}
        onFermer={() => setChoixQr(false)}
      />
    </SafeAreaView>
  );
}
