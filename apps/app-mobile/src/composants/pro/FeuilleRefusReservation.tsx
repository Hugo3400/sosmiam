import { useState } from "react";
import { View } from "react-native";

import { LIBELLES_MOTIF_REFUS_RESERVATION_PAR_LANGUE } from "@sos-miam/commun/contenus/motifs-refus";
import { MOTIFS_REFUS_RESERVATION } from "@sos-miam/commun/regles/reservations";
import type { MotifRefusReservation } from "@sos-miam/commun/types/reservation";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { Pastille } from "~/composants/interface/Pastille";
import { TEXTES_DEMANDES_COMPTOIR_PAR_LANGUE } from "~/contenus/textes-demandes-comptoir";
import { TEXTES_RESERVATIONS_PRO_PAR_LANGUE } from "~/contenus/textes-reservations-pro";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  visible: boolean;
  titre: string;
  sousTitre?: string;
  libelleConfirmer?: string;
  onConfirmer: (motif: MotifRefusReservation) => void;
  onFermer: () => void;
};

export function FeuilleRefusReservation({ visible, titre, sousTitre, libelleConfirmer, onConfirmer, onFermer }: Props) {
  const T = utiliserTextes(TEXTES_RESERVATIONS_PRO_PAR_LANGUE);
  const choisirMotif = utiliserTextes(TEXTES_DEMANDES_COMPTOIR_PAR_LANGUE).refus.choisirMotif;
  const motifs = utiliserTextes(LIBELLES_MOTIF_REFUS_RESERVATION_PAR_LANGUE);
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
      sousTitre={sousTitre ?? T.refusDetail}
      onFermer={fermer}
      pied={
        <>
          <Bouton
            libelle={libelleConfirmer ?? T.refusConfirmer}
            variante="encre"
            desactive={motif === null}
            indice={motif === null ? choisirMotif : undefined}
            onPress={() => motif && confirmer(motif)}
          />
          <Bouton libelle={T.refusRester} variante="blanc" onPress={fermer} />
        </>
      }
    >
      <View className="gap-2">
        {MOTIFS_REFUS_RESERVATION.map((m, i) => (
          <Pastille
            key={m}
            libelle={motifs[m]}
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
