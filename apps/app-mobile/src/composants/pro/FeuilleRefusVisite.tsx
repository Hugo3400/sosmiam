import { useEffect, useState } from "react";
import { View } from "react-native";

import { LIBELLES_MOTIF_REFUS_VISITE } from "@sos-miam/commun/contenus/motifs-refus";
import type { MotifRefusVisite } from "@sos-miam/commun/types/visite";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { Pastille } from "~/composants/interface/Pastille";

type Props = {
  visible: boolean;
  /** « Refuser l'addition de Karim B. ? », « Annuler la validation de Léa M. ? » */
  titre: string;
  detail: string;
  libelleConfirmer: string;
  onConfirmer: (motif: MotifRefusVisite) => void;
  onFermer: () => void;
};

const MOTIFS: readonly MotifRefusVisite[] = ["introuvable", "pas-venu", "doublon", "autre"];

/**
 * Refuser une addition, ou annuler une validation faite par erreur : un motif à choisir dans une liste fermée (le client
 * le lit en termes neutres ; jamais de texte libre du lieu vers le client), puis la confirmation.
 */
export function FeuilleRefusVisite({ visible, titre, detail, libelleConfirmer, onConfirmer, onFermer }: Props) {
  const [motif, setMotif] = useState<MotifRefusVisite | null>(null);

  useEffect(() => {
    if (visible) setMotif(null);
  }, [visible]);

  return (
    <FeuilleBas
      visible={visible}
      titre={titre}
      sousTitre={detail}
      onFermer={onFermer}
      pied={
        <>
          <Bouton
            libelle={libelleConfirmer}
            variante="encre"
            desactive={motif === null}
            indice={motif === null ? "Choisis d'abord un motif" : undefined}
            onPress={() => motif && onConfirmer(motif)}
          />
          <Bouton libelle="Finalement non" variante="blanc" onPress={onFermer} />
        </>
      }
    >
      <View className="gap-2">
        {MOTIFS.map((m, i) => (
          <Pastille key={m} libelle={LIBELLES_MOTIF_REFUS_VISITE[m]} role="radio" position={i + 1} total={MOTIFS.length} choisi={motif === m} onPress={() => setMotif(m)} />
        ))}
      </View>
    </FeuilleBas>
  );
}
