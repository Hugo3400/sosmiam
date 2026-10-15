import { useEffect } from "react";
import { AccessibilityInfo, Text, View } from "react-native";

import type { DetailsErreur } from "@sos-miam/commun/client-api/reponse-api";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  erreur: ErreurService;
  details?: DetailsErreur;
};

export function EncadreRefusEnvoiAvis({ erreur, details }: Props) {
  const { emoji, titre, texte } = decrireEchecVisite(erreur, details);
  const annonce = `${titre}. ${texte}`;

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(annonce);
  }, [annonce]);

  return (
    <View accessible accessibilityLabel={annonce} className="flex-row gap-3 rounded-2xl border-2 border-tomate bg-rose-alerte px-4 py-3">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-xl">
        {emoji}
      </Text>
      <View className="flex-1 gap-1">
        <Text className="font-texte-gras text-[15px] leading-5 text-encre">{lierPonctuation(titre)}</Text>
        <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(texte)}</Text>
      </View>
    </View>
  );
}
