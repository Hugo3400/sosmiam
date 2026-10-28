import { Image } from "expo-image";
import { Platform, Pressable, View } from "react-native";

import { AVATARS_MIAMIS, type IdMiamiAuChoix } from "@sos-miam/commun/regles/avatars-miamis";
import { IMAGES_MIAMIS } from "~/contenus/images-miamis";
import { NOMS_MIAMIS_PAR_LANGUE, TEXTES_GRILLE_MIAMIS_PAR_LANGUE } from "~/contenus/textes-profil-avatars";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** Le Miami de ton avatar, s'il en est un */
  choisi: IdMiamiAuChoix | null;
  /** Diamètre de chaque rond, en points */
  taille: number;
  ecart: number;
  onChoisir: (id: IdMiamiAuChoix) => void;
};

/** Les seize Miamis à choisir comme avatar (jamais le Capitaine, réservé au compte officiel). Le choisi est entouré d'encre, comme un emoji choisi. */
export function GrilleMiamis({ choisi, taille, ecart, onChoisir }: Props) {
  const T = utiliserTextes(TEXTES_GRILLE_MIAMIS_PAR_LANGUE);
  const noms = utiliserTextes(NOMS_MIAMIS_PAR_LANGUE);
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={T.groupeLu} className="mt-3 flex-row flex-wrap" style={{ gap: ecart }}>
      {AVATARS_MIAMIS.map(({ id, nom: nomFrancais }, i) => {
        const nom = noms[id] ?? nomFrancais;
        const estChoisi = choisi === id;
        // Choisi : un anneau d'encre de 4 points autour du Miami ; sinon, le Miami remplit le rond
        const tailleImage = taille - (estChoisi ? 12 : 4);
        return (
          <Pressable
            key={id}
            // Même règle que la grille des emoji : sur iPhone, un bouton « sélectionné » avec sa place ; une radio ailleurs
            accessibilityRole={Platform.OS === "ios" ? "button" : "radio"}
            accessibilityState={Platform.OS === "ios" ? { selected: estChoisi } : { checked: estChoisi }}
            accessibilityLabel={Platform.OS === "ios" ? T.miamiLu(nom, i + 1, AVATARS_MIAMIS.length) : T.miamiCourtLu(nom)}
            onPress={() => {
              vibrerLegerement();
              onChoisir(id);
            }}
            style={{ width: taille, height: taille, borderRadius: taille / 2 }}
            className={`items-center justify-center overflow-hidden border-2 active:opacity-80 ${estChoisi ? "border-encre bg-choix" : "border-ligne bg-carte"}`}
          >
            <Image
              source={IMAGES_MIAMIS[id]}
              accessible={false}
              contentFit="cover"
              style={{ width: tailleImage, height: tailleImage, borderRadius: tailleImage / 2 }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
