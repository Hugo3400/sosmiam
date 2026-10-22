import { Text, View } from "react-native";

import { LigneEspace } from "~/composants/profil/LigneEspace";
import { DETAILS_MODE_AMBASSADEUR, TEXTES_ESPACES } from "~/contenus/textes-profil";
import { utiliserModes } from "~/hooks/utiliser-modes";

export function EspacesProfil() {
  const { modesOuverts, roles, lieuPro, entrerEnModePro, entrerEnModeAmbassadeur } = utiliserModes();
  const pro = modesOuverts.includes("pro") ? lieuPro : null;
  const statutAmbassadeur = modesOuverts.includes("ambassadeur") ? roles.ambassadeur : null;
  if (!pro && !statutAmbassadeur) return null;

  return (
    <View className="gap-2">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
        {TEXTES_ESPACES.titre}
      </Text>
      <View className="rounded-carte border-2 border-encre bg-carte px-4 py-1">
        {pro ? (
          <LigneEspace
            emoji="🧑‍🍳"
            titre={TEXTES_ESPACES.pro}
            detail={roles.pro.length > 1 ? TEXTES_ESPACES.plusieursLieux(roles.pro.length, pro.nom) : pro.nom}
            indice={TEXTES_ESPACES.indicePro}
            separation={statutAmbassadeur !== null}
            onPress={() => entrerEnModePro()}
          />
        ) : null}
        {statutAmbassadeur ? (
          <LigneEspace
            emoji="🎖️"
            titre={TEXTES_ESPACES.ambassadeur}
            detail={DETAILS_MODE_AMBASSADEUR[statutAmbassadeur]}
            indice={TEXTES_ESPACES.indiceAmbassadeur}
            separation={false}
            onPress={entrerEnModeAmbassadeur}
          />
        ) : null}
      </View>
    </View>
  );
}
