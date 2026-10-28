import { useState } from "react";
import { View } from "react-native";

import { LIBELLES_MOTIF_AVIS_LOUCHE, LIBELLES_MOTIF_AVIS_LOUCHE_PAR_LANGUE } from "@sos-miam/commun/contenus/raisons-relecture";
import type { MotifAvisLouche } from "@sos-miam/commun/types/avis";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { Pastille } from "~/composants/interface/Pastille";
import { TEXTES_MOTIF_LOUCHE_PAR_LANGUE } from "~/contenus/textes-espace-ambassadeur";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const MOTIFS = Object.keys(LIBELLES_MOTIF_AVIS_LOUCHE) as MotifAvisLouche[];

type Props = { visible: boolean; onChoisir: (motif: MotifAvisLouche) => void; onFermer: () => void };

/** « Qu'est-ce qui cloche ? » : un motif de la liste fermée (jamais de texte libre), puis l'équipe tranche. */
export function FeuilleMotifLouche({ visible, onChoisir, onFermer }: Props) {
  const T = utiliserTextes(TEXTES_MOTIF_LOUCHE_PAR_LANGUE);
  const libelles = utiliserTextes(LIBELLES_MOTIF_AVIS_LOUCHE_PAR_LANGUE);
  const [motif, setMotif] = useState<MotifAvisLouche | null>(null);
  return (
    <FeuilleBas
      visible={visible}
      titre={T.titre}
      sousTitre={T.sousTitre}
      onFermer={onFermer}
      pied={
        <Bouton
          libelle={T.envoyer}
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
          <Pastille key={m} libelle={libelles[m]} role="radio" choisi={motif === m} onPress={() => setMotif(m)} position={i + 1} total={MOTIFS.length} />
        ))}
      </View>
    </FeuilleBas>
  );
}
