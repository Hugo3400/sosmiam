import { useEffect, useRef } from "react";
import { Keyboard, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { CoucheMiseAJour } from "~/composants/mise-a-jour/CoucheMiseAJour";
import { TEXTES_MISE_A_JOUR } from "~/contenus/textes-mise-a-jour";
import { annoncerLecteurEcran } from "~/fonctions/interaction/annoncer-lecteur-ecran";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserOuvertureStore } from "~/hooks/utiliser-ouverture-store";
import { VERSION_INSTALLEE } from "~/services/version-installee";

const T = TEXTES_MISE_A_JOUR.obligatoire;
const DELAI_FOCUS_TITRE = 700;

export function EcranMiseAJourObligatoire() {
  const marges = useSafeAreaInsets();
  const refTitre = useRef<Text>(null);
  const store = utiliserOuvertureStore();

  useEffect(() => {
    Keyboard.dismiss();
    annoncerLecteurEcran(T.annonceLecteurEcran);
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(refTitre.current), DELAI_FOCUS_TITRE);
    return () => clearTimeout(minuterie);
  }, []);

  return (
    <CoucheMiseAJour>
      <View accessibilityViewIsModal style={{ flex: 1, paddingTop: marges.top, paddingBottom: marges.bottom }} className="bg-creme">
        <ScrollView bounces={false} contentContainerClassName="flex-grow items-center justify-center gap-4 px-6 py-8">
          <Mascotte expression="surprise" taille={150} flotte />
          <Text className="font-texte-gras text-xs uppercase tracking-widest text-gris">{T.surtitre}</Text>
          <Text ref={refTitre} accessibilityRole="header" className="max-w-[420px] text-center font-titre text-3xl leading-10 text-encre">
            {lierPonctuation(T.titre)}
          </Text>
          <Text className="max-w-[420px] text-center font-texte text-base leading-6 text-encre">{lierPonctuation(T.texte)}</Text>
          <View className="mt-2 w-full max-w-[420px] gap-3">
            <Bouton libelle={T.bouton} indice={store.indice} onPress={() => void store.ouvrir()} />
            {store.erreur ? (
              <Text accessibilityLiveRegion="polite" className="text-center font-texte-semi text-sm leading-5 text-rouge-texte">
                {store.erreur}
              </Text>
            ) : null}
          </View>
          {VERSION_INSTALLEE ? <Text className="font-texte text-xs text-gris">{remplirModele(T.versionInstallee, { version: VERSION_INSTALLEE })}</Text> : null}
        </ScrollView>
      </View>
    </CoucheMiseAJour>
  );
}
