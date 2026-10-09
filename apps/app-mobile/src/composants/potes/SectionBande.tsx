import { View } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { ActivitePotes } from "~/composants/potes/ActivitePotes";
import { ClassementPotes } from "~/composants/potes/ClassementPotes";
import { RangeeBande } from "~/composants/potes/RangeeBande";
import { SuggestionsSuivre } from "~/composants/suivi/SuggestionsSuivre";

const TYPES_SUGGESTIONS = ["personne"] as const;
const SOUS_TITRE_SUGGESTIONS = "Des potes de tes potes. Suivre, c'est voir passer leurs listes ; Ma bande, c'est pour sortir ensemble.";

type Props = {
  /** Lieux que tu peux voir (sans les bars sous 18 ans), par identifiant */
  lieux: ReadonlyMap<number, Lieu>;
  /** Après un retrait : le bandeau « Retiré · Annuler » de l'écran */
  onRetire: (texte: string, annuler: () => void) => void;
};

/** Onglet « Ma bande » : le classement du mois, ce que font tes potes, ta bande et de quoi l'agrandir, puis des potes de potes à suivre. */
export function SectionBande({ lieux, onRetire }: Props) {
  return (
    <View className="gap-8">
      <ClassementPotes />
      <ActivitePotes lieux={lieux} onRetire={onRetire} />
      <RangeeBande />
      <SuggestionsSuivre titre="Tu pourrais suivre" sousTitre={SOUS_TITRE_SUGGESTIONS} types={TYPES_SUGGESTIONS} />
    </View>
  );
}
