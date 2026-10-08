import { Text, View } from "react-native";

import { Mascotte } from "~/composants/marque/Mascotte";
import type { DiapoBienvenue as Diapo } from "~/contenus/inscription/diapos-bienvenue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  diapo: Diapo;
  largeur: number;
  /** Hauteur de l'écran : la couleur de la diapo le remplit en entier */
  hauteur: number;
  /** Diapo affichée : seule celle-ci fait flotter la mascotte */
  active: boolean;
  /** Place laissée en bas pour les points et le bouton */
  margeBas: number;
};

/** Une diapo du carrousel de bienvenue : la mascotte, un titre et une phrase, sur la couleur de la diapo. */
export function DiapoBienvenue({ diapo, largeur, hauteur, active, margeBas }: Props) {
  const tailleMascotte = Math.min(largeur * 0.58, 240);
  return (
    <View
      accessible
      accessibilityLabel={`${diapo.titre} ${diapo.texte}`}
      style={{ width: largeur, height: hauteur, backgroundColor: couleurs[diapo.fond], paddingBottom: margeBas }}
      className="items-center justify-center px-7"
    >
      <Mascotte expression={diapo.expression} taille={tailleMascotte} flotte={active} />
      <Text className="mt-8 text-center font-titre text-[34px] leading-[38px] text-encre">{lierPonctuation(diapo.titre)}</Text>
      <Text className="mt-4 text-center font-texte text-[17px] leading-[26px] text-encre/75">{lierPonctuation(diapo.texte)}</Text>
    </View>
  );
}
