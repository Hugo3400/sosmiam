import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BandeauVisiteEnCours } from "~/composants/visites/BandeauVisiteEnCours";

type Props = {
  /** Nom de l'onglet affiché (« index », « explorer », « scan », « potes », « profil ») */
  ongletActif: string;
};

// Hauteur de la barre d'onglets d'iPhone (sans la zone du bas de l'écran), et l'écart entre elle et les bandeaux
const HAUTEUR_BARRE_ONGLETS = 49;
const ECART = 8;
// Le fil « Pour toi » est plein écran : un bandeau y couvrirait les boutons de la publication (l'onglet Scan garde son badge)
const ONGLETS_SANS_BANDEAU: readonly string[] = ["index"];

/**
 * Les bandeaux posés au-dessus de la barre d'onglets, dans les onglets perso : ta demande d'addition en cours (puis son
 * issue), et plus tard les additions qui attendent dans ton lieu (mode pro). Toujours montés, même cachés, pour ne rien
 * rater de ce qui change ; ils laissent passer les touchers autour d'eux.
 */
export function BandeauxOnglets({ ongletActif }: Props) {
  const marges = useSafeAreaInsets();
  const masque = ONGLETS_SANS_BANDEAU.includes(ongletActif);
  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", left: 12, right: 12, bottom: marges.bottom + HAUTEUR_BARRE_ONGLETS + ECART, gap: 8, alignItems: "center" }}
    >
      <View pointerEvents="box-none" style={{ width: "100%", maxWidth: 520, gap: 8 }}>
        <BandeauVisiteEnCours masque={masque} demandeAffichee={ongletActif === "scan"} />
      </View>
    </View>
  );
}
