import { Image } from "expo-image";
import { Text, View } from "react-native";

import { MENTIONS_AVIS_REGLEMENT_PAR_LANGUE } from "@sos-miam/commun/contenus/libelles-reglement";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { AvisPublic } from "@sos-miam/commun/types/avis";
import { EtoilesAvis } from "~/composants/avis/EtoilesAvis";
import { TEXTES_CARTE_AVIS_PAR_LANGUE } from "~/contenus/textes-carte-avis";
import type { SourcePhotoAvis } from "~/contenus/type-donner-avis";
import { ecrirePreuveAvis } from "~/fonctions/avis/ecrire-preuve-avis";
import { ecrireMoisAnneeLangue } from "~/fonctions/langue/ecrire-mois-annee-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  avis: AvisPublic;
  sourcePhoto: SourcePhotoAvis | null;
  nomLieu: string;
};

function listerEtiquettes(avis: AvisPublic, langue: Langue): { texte: string; fond: string }[] {
  const mentions = MENTIONS_AVIS_REGLEMENT_PAR_LANGUE[langue];
  const etiquettes = [{ texte: ecrirePreuveAvis(avis, langue), fond: avis.verifie ? "bg-carte" : "bg-creme" }];
  if (avis.repasOffert && mentions.offert) etiquettes.push({ texte: `🎁 ${mentions.offert}`, fond: "bg-rose-alerte" });
  if (avis.avecReduction && mentions.reduction) etiquettes.push({ texte: mentions.reduction, fond: "bg-jaune-clair" });
  return etiquettes;
}

export function CarteAvisPublic({ avis, sourcePhoto, nomLieu }: Props) {
  const couleurs = utiliserCouleurs();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_CARTE_AVIS_PAR_LANGUE);
  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-carte p-4">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="font-texte-gras text-base text-encre">{avis.signature}</Text>
          <Text className="font-texte text-[13px] text-gris">{ecrireMoisAnneeLangue(avis.mois, langue)}</Text>
        </View>
        <EtoilesAvis note={avis.note} />
      </View>

      <Text className="font-texte text-[15px] leading-[22px] text-encre">{lierPonctuation(avis.texte)}</Text>

      {sourcePhoto ? (
        <Image
          source={sourcePhoto}
          accessibilityLabel={remplirModele(T.photoLue, { signature: avis.signature })}
          contentFit="cover"
          style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: 12, borderWidth: 1, borderColor: couleurs.ligne }}
        />
      ) : null}

      <View className="flex-row flex-wrap gap-1.5">
        {listerEtiquettes(avis, langue).map((etiquette) => (
          <View key={etiquette.texte} className={`rounded-full border border-encre px-2.5 py-1 ${etiquette.fond}`}>
            <Text className="font-texte-semi text-xs text-encre">{etiquette.texte}</Text>
          </View>
        ))}
      </View>

      {avis.reponseLieu ? (
        <View className="gap-1 rounded-2xl border-l-4 border-jaune bg-creme px-3 py-2.5">
          <Text className="font-texte-gras text-sm text-encre">
            {remplirModele(T.reponseLieu, { lieu: nomLieu, mois: ecrireMoisAnneeLangue(avis.reponseLieu.mois, langue) })}
          </Text>
          <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(avis.reponseLieu.texte)}</Text>
        </View>
      ) : null}
    </View>
  );
}
