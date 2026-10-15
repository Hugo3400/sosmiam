import { useEffect, useState } from "react";
import { View } from "react-native";

import { LIBELLES_MOTIF_REFUS_RESERVATION } from "@sos-miam/commun/contenus/motifs-refus";
import { MOTIFS_REFUS_RESERVATION } from "@sos-miam/commun/regles/reservations";
import type { MotifRefusReservation } from "@sos-miam/commun/types/reservation";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { Pastille } from "~/composants/interface/Pastille";
import { TEXTES_RESERVATIONS_PRO } from "~/contenus/textes-reservations-pro";

type Props = {
  visible: boolean;
  titre: string;
  onConfirmer: (motif: MotifRefusReservation) => void;
  onFermer: () => void;
};

export function FeuilleRefusReservation({ visible, titre, onConfirmer, onFermer }: Props) {
  const [motif, setMotif] = useState<MotifRefusReservation | null>(null);

  useEffect(() => {
    if (visible) setMotif(null);
  }, [visible]);

  return (
    <FeuilleBas
      visible={visible}
      titre={titre}
      sousTitre={TEXTES_RESERVATIONS_PRO.refusDetail}
      onFermer={onFermer}
      pied={
        <>
          <Bouton
            libelle={TEXTES_RESERVATIONS_PRO.refusConfirmer}
            variante="encre"
            desactive={motif === null}
            indice={motif === null ? "Choisis d'abord un motif" : undefined}
            onPress={() => motif && onConfirmer(motif)}
          />
          <Bouton libelle={TEXTES_RESERVATIONS_PRO.refusRester} variante="blanc" onPress={onFermer} />
        </>
      }
    >
      <View className="gap-2">
        {MOTIFS_REFUS_RESERVATION.map((m, i) => (
          <Pastille
            key={m}
            libelle={LIBELLES_MOTIF_REFUS_RESERVATION[m]}
            role="radio"
            position={i + 1}
            total={MOTIFS_REFUS_RESERVATION.length}
            choisi={motif === m}
            onPress={() => setMotif(m)}
          />
        ))}
      </View>
    </FeuilleBas>
  );
}
