import { Text } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { ZoneClaire } from "~/composants/theme/ZoneClaire";
import { TEXTES_FIL_PAR_LANGUE } from "~/contenus/textes-fil";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Fil « SOS ce soir » sans aucun lieu en SOS ni en alerte. */
export function FilVide({ hauteur, onVoirTout }: { hauteur: number; onVoirTout: () => void }) {
  const T = utiliserTextes(TEXTES_FIL_PAR_LANGUE).videSos;
  return (
    <ZoneClaire style={{ height: hauteur }} className="items-center justify-center gap-4 bg-jaune px-8">
      <Mascotte expression="surprise" taille={140} />
      <Text accessibilityRole="header" className="text-center font-titre text-3xl text-nuit">{T.titre}</Text>
      <Text className="text-center font-texte text-base leading-6 text-nuit/75">{T.texte}</Text>
      <Bouton libelle={T.bouton} variante="blanc" onPress={onVoirTout} className="mt-2 self-stretch" />
    </ZoneClaire>
  );
}
