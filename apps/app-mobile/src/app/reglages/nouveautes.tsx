import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { NOUVEAUTES_VERSIONS, type NouveautesVersion } from "~/contenus/nouveautes-versions";
import { TEXTES_NOUVEAUTES } from "~/contenus/textes-nouveautes";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { comparerVersions } from "~/fonctions/version/comparer-versions";
import { VERSION_INSTALLEE } from "~/services/version-installee";

const T = TEXTES_NOUVEAUTES.page;

function TitreVersion({ nouveautes, taVersion }: { nouveautes: NouveautesVersion; taVersion: boolean }) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="flex-1">
        <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
          {T.version(nouveautes.libelle)}
        </Text>
        {nouveautes.date ? <Text className="font-texte text-[13px] text-gris">{nouveautes.date}</Text> : null}
      </View>
      {taVersion ? (
        <View className="rounded-full border-[1.5px] border-encre bg-jaune px-2.5 py-0.5">
          <Text className="font-texte-gras text-xs text-nuit">{T.taVersion}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function Nouveautes() {
  const router = useRouter();
  const revenir = () => (router.canGoBack() ? router.back() : router.replace("/reglages"));
  const sorties = NOUVEAUTES_VERSIONS.filter((v) => VERSION_INSTALLEE === null || comparerVersions(v.version, VERSION_INSTALLEE) <= 0);

  return (
    <EcranReglage titre={T.titre} sousTitre={T.sousTitre} onRetour={revenir}>
      <View className="gap-5 pb-6">
        {sorties.map((nouveautes, i) => {
          const taVersion = VERSION_INSTALLEE !== null && comparerVersions(nouveautes.version, VERSION_INSTALLEE) === 0;
          return i === 0 ? (
            <View key={nouveautes.version} className="gap-3 rounded-carte border-2 border-encre bg-carte p-4">
              <TitreVersion nouveautes={nouveautes} taVersion={taVersion} />
              <Text className="font-texte-semi text-base text-encre">{lierPonctuation(nouveautes.titre)}</Text>
              {nouveautes.points.map((point) => (
                <View key={point.titre} accessible className="flex-row items-start gap-3">
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-jaune-clair">
                    <Text className="text-base">{point.emoji}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-texte-gras text-[15px] leading-5 text-encre">{lierPonctuation(point.titre)}</Text>
                    <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(point.detail)}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View key={nouveautes.version} className="gap-2 px-1">
              <TitreVersion nouveautes={nouveautes} taVersion={taVersion} />
              {nouveautes.points.map((point) => (
                <View key={point.titre} accessible className="gap-0.5">
                  <Text className="font-texte-semi text-sm leading-5 text-encre">
                    <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{`${point.emoji} `}</Text>
                    {lierPonctuation(point.titre)}
                  </Text>
                  <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(point.detail)}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </View>
    </EcranReglage>
  );
}
