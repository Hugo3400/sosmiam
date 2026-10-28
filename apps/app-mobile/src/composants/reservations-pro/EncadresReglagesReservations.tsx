import { Linking, View } from "react-native";

import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { EncadreReservation } from "~/composants/reservations/EncadreReservation";
import { TEXTES_REGLAGES_RESERVATIONS_PAR_LANGUE } from "~/contenus/textes-reglages-reservations";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  gerant: boolean;
  reservable: boolean;
  aRevoir: number;
  onVoirReservations: () => void;
};

const ADRESSE_CONTACT = "bonjour@sosmiam.fr";

export function EncadresReglagesReservations({ gerant, reservable, aRevoir, onVoirReservations }: Props) {
  const T = utiliserTextes(TEXTES_REGLAGES_RESERVATIONS_PAR_LANGUE);
  if (gerant && reservable && aRevoir === 0) return null;
  return (
    <View className="gap-3">
      {gerant ? null : <EncadreReservation ton="doux" emoji="🧑‍🍳" titre={T.gerantTitre} texte={T.gerantTexte} />}
      {reservable ? null : (
        <EncadreReservation
          ton="doux"
          emoji="📵"
          titre={T.nonReservableTitre}
          texte={T.nonReservableTexte}
          action={{ libelle: T.nousEcrire, indice: T.indiceNousEcrire, onPress: () => void Linking.openURL(`mailto:${ADRESSE_CONTACT}`).catch(() => {}) }}
        />
      )}
      {aRevoir > 0 ? (
        <EncadreReservation
          ton="refus"
          emoji="👀"
          titre={remplirModele(T.aRevoirTitre, { nombre: String(aRevoir) })}
          texte={T.aRevoirTexte}
          action={{ libelle: T.aRevoirBouton, onPress: onVoirReservations }}
        />
      ) : null}
    </View>
  );
}
