import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { RondPote } from "~/composants/potes/RondPote";
import { TEXTES_ONGLETS_POTES_PAR_LANGUE } from "~/contenus/textes-onglets-potes";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const TAILLE_ROND = 60;

/** Ta bande en rangée qui défile (toucher un pote ouvre son profil), avec de quoi en ajouter d'autres. */
export function RangeeBande() {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_ONGLETS_POTES_PAR_LANGUE).bande;
  const router = useRouter();
  const { potes } = utiliserCommunaute();
  const ajouter = () => router.push("/potes/ajouter");

  return (
    <View className="gap-3">
      <View>
        <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
          {T.titre(potes.length)}
        </Text>
        <Text className="font-texte text-sm text-gris">
          {lierPonctuation(potes.length > 0 ? T.sousTitre : T.sousTitreVide)}
        </Text>
      </View>

      {/* -mx-5 px-5 : la rangée défile jusqu'aux bords de l'écran */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerClassName="gap-3 px-5 py-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.ajouterPote}
          accessibilityHint={T.ajouterIndice}
          onPress={() => {
            vibrerLegerement();
            ajouter();
          }}
          style={{ width: TAILLE_ROND + 12 }}
          className="items-center gap-1.5 active:opacity-70"
        >
          <View
            style={{ width: TAILLE_ROND, height: TAILLE_ROND, borderRadius: TAILLE_ROND / 2 }}
            className="items-center justify-center border-2 border-dashed border-encre bg-carte"
          >
            <Ionicons name="add" size={28} color={couleurs.encre} />
          </View>
          <Text numberOfLines={1} className="font-texte-semi text-[13px] text-encre">
            {T.ajouter}
          </Text>
        </Pressable>

        {potes.map((pote) => (
          <Pressable
            key={pote.id}
            accessibilityRole="button"
            accessibilityLabel={`${pote.prenom}, @${pote.pseudo}`}
            accessibilityHint={T.profilIndice}
            onPress={() => {
              vibrerLegerement();
              router.push({ pathname: "/potes/profil/[id]", params: { id: pote.id } });
            }}
            style={{ width: TAILLE_ROND + 12 }}
            className="items-center gap-1.5 active:opacity-70"
          >
            <RondPote pote={pote} taille={TAILLE_ROND} />
            <Text numberOfLines={1} className="font-texte-semi text-[13px] text-encre">
              {pote.prenom}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Bouton libelle={T.inviter} variante="blanc" indice={T.ajouterIndice} onPress={ajouter} />
    </View>
  );
}
