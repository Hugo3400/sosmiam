import { Text, View } from "react-native";

import { DELAIS_RESERVATION } from "@sos-miam/commun/regles/reglages-reservations";
import type { DelaiReservation, ModeAcceptationReservation } from "@sos-miam/commun/types/reglages-reservations";
import { Pastille } from "~/composants/interface/Pastille";
import { DELAIS_RESERVATION_TEXTES, TEXTES_REGLAGES_RESERVATIONS as T } from "~/contenus/textes-reglages-reservations";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  delai: DelaiReservation;
  acceptation: ModeAcceptationReservation;
  modifiable: boolean;
  onChoisir: (delai: DelaiReservation) => void;
};

export function SectionDelaiReservation({ delai, acceptation, modifiable, onChoisir }: Props) {
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
        {T.delaiTitre}
      </Text>
      <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(T.delaiIntro)}</Text>
      <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
        {DELAIS_RESERVATION.map((choix, i) => (
          <Pastille
            key={choix}
            role="radio"
            libelle={DELAIS_RESERVATION_TEXTES[choix].libelle}
            choisi={delai === choix}
            desactive={!modifiable}
            position={i + 1}
            total={DELAIS_RESERVATION.length}
            onPress={() => onChoisir(choix)}
          />
        ))}
      </View>
      <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(DELAIS_RESERVATION_TEXTES[delai].phrase)}</Text>
      {acceptation === "manuelle" && delai === "30-min" ? (
        <Text className="rounded-2xl bg-jaune-clair px-3.5 py-2.5 font-texte text-[13px] leading-5 text-encre">{lierPonctuation(T.delaiCourtALaMain)}</Text>
      ) : null}
    </View>
  );
}
