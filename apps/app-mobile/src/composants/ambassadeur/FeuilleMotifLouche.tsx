import { useState } from "react";
import { View } from "react-native";

import { LIBELLES_MOTIF_AVIS_LOUCHE } from "@sos-miam/commun/contenus/raisons-relecture";
import type { MotifAvisLouche } from "@sos-miam/commun/types/avis";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { Pastille } from "~/composants/interface/Pastille";

const MOTIFS = Object.keys(LIBELLES_MOTIF_AVIS_LOUCHE) as MotifAvisLouche[];

type Props = { visible: boolean; onChoisir: (motif: MotifAvisLouche) => void; onFermer: () => void };

/** « Qu'est-ce qui cloche ? » : un motif de la liste fermée (jamais de texte libre), puis l'équipe tranche. */
export function FeuilleMotifLouche({ visible, onChoisir, onFermer }: Props) {
  const [motif, setMotif] = useState<MotifAvisLouche | null>(null);
  return (
    <FeuilleBas
      visible={visible}
      titre="Qu'est-ce qui cloche ?"
      sousTitre="Ton avis aide l'équipe, qui a toujours le dernier mot. On ne masque jamais un avis tout seul."
      onFermer={onFermer}
      pied={
        <Bouton
          libelle="Envoyer à l'équipe"
          variante="encre"
          desactive={!motif}
          onPress={() => {
            if (motif) onChoisir(motif);
            setMotif(null);
          }}
        />
      }
    >
      <View accessibilityRole="radiogroup" className="gap-2">
        {MOTIFS.map((m, i) => (
          <Pastille key={m} libelle={LIBELLES_MOTIF_AVIS_LOUCHE[m]} role="radio" choisi={motif === m} onPress={() => setMotif(m)} position={i + 1} total={MOTIFS.length} />
        ))}
      </View>
    </FeuilleBas>
  );
}
