import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DUREE_FENETRE_QR_MS } from "@sos-miam/commun/regles/visites";
import { BarreEtatTheme } from "~/composants/interface/BarreEtatTheme";
import { Bouton } from "~/composants/interface/Bouton";
import { BandeauValidationsQr } from "~/composants/pro/BandeauValidationsQr";
import { ChoixPersonnesQr } from "~/composants/pro/ChoixPersonnesQr";
import { QrTournant } from "~/composants/pro/QrTournant";
import { EtiquettesReglement } from "~/composants/visites/EtiquettesReglement";
import { TEXTES_ECRAN_QR_COMPTOIR_PAR_LANGUE } from "~/contenus/textes-ecran-pro-comptoir";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserFermerPile } from "~/hooks/utiliser-fermer-pile";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserQrTournant } from "~/hooks/utiliser-qr-tournant";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * Le QR du comptoir en grand, à tourner vers le client après le paiement : il change toutes les 30 s (l'anneau le
 * montre), s'éteint après 2 minutes ou quand tout le monde a scanné, et l'écran reste allumé pendant ce temps.
 */
export default function EcranQrComptoir() {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_ECRAN_QR_COMPTOIR_PAR_LANGUE);
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
      <BarreEtatTheme />
      <View className="min-h-14 flex-row items-center justify-between px-5 pb-2 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.revenir}
          hitSlop={8}
          onPress={() => {
            vibrerLegerement();
            fermer();
          }}
          className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
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
                {T.titre}
              </Text>
              <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(T.consigne)}</Text>
            </View>
            <View accessible accessibilityLabel={T.qrLu(lieuPro?.nom ?? T.tonLieu)}>
              <QrTournant texte={qr.texte} fenetre={qr.fenetre} changeDansMs={qr.changeDansMs} dureeMs={DUREE_FENETRE_QR_MS} taille={taille} />
            </View>
            <EtiquettesReglement reglement={qr.reglement} pour="lieu" centre />
            <BandeauValidationsQr qr={qr} validees={etat?.validees ?? []} maintenant={maintenant} />
            <Bouton
              libelle={T.eteindre}
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
              {T.eteintTitre}
            </Text>
            <Text className="text-center font-texte text-base leading-6 text-gris">
              {lierPonctuation(etat ? T.eteintTexte : T.chargement)}
            </Text>
            {etat ? <Bouton libelle={T.nouveau} onPress={() => setChoixQr(true)} className="self-stretch" /> : null}
            <Bouton libelle={T.revenir} variante="blanc" onPress={fermer} className="self-stretch" />
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
