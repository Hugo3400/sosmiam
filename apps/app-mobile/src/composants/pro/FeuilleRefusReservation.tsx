import { useState } from "react";
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
  sousTitre?: string;
  libelleConfirmer?: string;
  onConfirmer: (motif: MotifRefusReservation) => void;
  onFermer: () => void;
};

export function FeuilleRefusReservation({ visible, titre, sousTitre = TEXTES_RESERVATIONS_PRO.refusDetail, libelleConfirmer = TEXTES_RESERVATIONS_PRO.refusConfirmer, onConfirmer, onFermer }: Props) {
  const [motif, setMotif] = useState<MotifRefusReservation | null>(null);
  const fermer = () => {
    setMotif(null);
    onFermer();
  };
  const confirmer = (choisi: MotifRefusReservation) => {
    setMotif(null);
    onConfirmer(choisi);
  };

  return (
    <FeuilleBas
      visible={visible}
      titre={titre}
      sousTitre={sousTitre}
      onFermer={fermer}
      pied={
        <>
          <Bouton
            libelle={libelleConfirmer}
            variante="encre"
            desactive={motif === null}
            indice={motif === null ? "Choisis d'abord un motif" : undefined}
            onPress={() => motif && confirmer(motif)}
          />
          <Bouton libelle={TEXTES_RESERVATIONS_PRO.refusRester} variante="blanc" onPress={fermer} />
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
