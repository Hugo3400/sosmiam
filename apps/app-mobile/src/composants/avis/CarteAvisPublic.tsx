import { Image } from "expo-image";
import { Text, View } from "react-native";

import { MENTIONS_AVIS_REGLEMENT } from "@sos-miam/commun/contenus/libelles-reglement";
import { LIBELLES_MODE_VALIDATION } from "@sos-miam/commun/contenus/modes-validation";
import type { AvisPublic } from "@sos-miam/commun/types/avis";
import type { SourcePhotoAvis } from "~/composants/avis/BlocPhotoAvis";
import { EtoilesAvis } from "~/composants/avis/EtoilesAvis";
import { ecrireMoisAnnee } from "~/fonctions/dates/ecrire-mois-annee";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  avis: AvisPublic;
  sourcePhoto: SourcePhotoAvis | null;
  nomLieu: string;
};

function listerEtiquettes(avis: AvisPublic): { texte: string; fond: string }[] {
  const preuve = avis.preuve ? ` · ${LIBELLES_MODE_VALIDATION[avis.preuve]}` : "";
  const etiquettes = [avis.verifie ? { texte: `✓ Visite vérifiée${preuve}`, fond: "bg-white" } : { texte: "Avis non vérifié", fond: "bg-creme" }];
  if (avis.repasOffert && MENTIONS_AVIS_REGLEMENT.offert) etiquettes.push({ texte: `🎁 ${MENTIONS_AVIS_REGLEMENT.offert}`, fond: "bg-rose-alerte" });
  if (avis.avecReduction && MENTIONS_AVIS_REGLEMENT.reduction) etiquettes.push({ texte: MENTIONS_AVIS_REGLEMENT.reduction, fond: "bg-jaune-clair" });
  return etiquettes;
}

export function CarteAvisPublic({ avis, sourcePhoto, nomLieu }: Props) {
  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-white p-4">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="font-texte-gras text-base text-encre">{avis.signature}</Text>
          <Text className="font-texte text-[13px] text-gris">{ecrireMoisAnnee(avis.mois)}</Text>
        </View>
        <EtoilesAvis note={avis.note} />
      </View>

      <Text className="font-texte text-[15px] leading-[22px] text-encre">{lierPonctuation(avis.texte)}</Text>

      {sourcePhoto ? (
        <Image
          source={sourcePhoto}
          accessibilityLabel={`Photo de l'avis de ${avis.signature}`}
          contentFit="cover"
          style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: 12, borderWidth: 1, borderColor: couleurs.ligne }}
        />
      ) : null}

      <View className="flex-row flex-wrap gap-1.5">
        {listerEtiquettes(avis).map((etiquette) => (
          <View key={etiquette.texte} className={`rounded-full border border-encre px-2.5 py-1 ${etiquette.fond}`}>
            <Text className="font-texte-semi text-xs text-encre">{etiquette.texte}</Text>
          </View>
        ))}
      </View>

      {avis.reponseLieu ? (
        <View className="gap-1 rounded-2xl border-l-4 border-jaune bg-creme px-3 py-2.5">
          <Text className="font-texte-gras text-sm text-encre">{`Réponse de ${nomLieu} · ${ecrireMoisAnnee(avis.reponseLieu.mois)}`}</Text>
          <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(avis.reponseLieu.texte)}</Text>
        </View>
      ) : null}
    </View>
  );
}
