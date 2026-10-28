import { useRouter, type Href } from "expo-router";
import { Text, View } from "react-native";

import type { PartagePositionMiamSafe } from "@sos-miam/commun/types/miam-safe";
import { Bouton } from "~/composants/interface/Bouton";
import { NumerosUrgence } from "~/composants/miam-safe/NumerosUrgence";
import { TEXTES_MIAM_SAFE_PARTAGE_PAR_LANGUE } from "~/contenus/textes-miam-safe-partage";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";
import { decrireFraicheurPosition } from "~/fonctions/miam-safe/decrire-fraicheur-position";
import { ouvrirPositionPlans } from "~/fonctions/miam-safe/ouvrir-position-plans";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = { partage: PartagePositionMiamSafe };

export function PartageRecuMiamSafe({ partage }: Props) {
  const router = useRouter();
  const { ouvrirPrive } = utiliserConversations();
  const T = utiliserTextes(TEXTES_MIAM_SAFE_PARTAGE_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const { prenom } = partage.personne;
  const position = partage.position;

  const ecrire = async () => {
    const conversation = await ouvrirPrive(partage.personne.id).catch(() => null);
    if (conversation) router.push({ pathname: "/potes/discussion/[id]", params: { id: conversation } });
    else router.push(`/potes/profil/${partage.personne.id}` as Href);
  };

  return (
    <View className="gap-4">
      <View className="gap-2 rounded-2xl bg-carte p-4">
        <Text accessibilityRole="header" className="font-titre-gras text-2xl text-encre">
          {T.pasEnSecurite(prenom)}
        </Text>
        {partage.lieu ? <Text className="font-texte text-base leading-6 text-encre">{T.leLieu(partage.lieu.nom)}</Text> : null}
      </View>

      {partage.actif ? (
        <View className="gap-3 rounded-2xl bg-jaune-clair p-4">
          {position ? (
            <>
              <Text accessibilityLiveRegion="polite" className="font-texte-gras text-base text-encre">
                {T.position(decrireFraicheurPosition(position.le, langue), position.precisionM)}
              </Text>
              <Bouton libelle={T.ouvrirPlans} variante="encre" onPress={() => ouvrirPositionPlans(position, prenom)} />
            </>
          ) : (
            <Text className="font-texte-gras text-base text-encre">{T.pasDePosition}</Text>
          )}
          <Text className="font-texte text-sm leading-5 text-gris">{T.visibleJusqua(ecrireHeureLangue(partage.expireLe, langue))}</Text>
        </View>
      ) : (
        <View accessible className="gap-1 rounded-2xl border-2 border-dashed border-encre bg-carte p-4">
          <Text className="font-texte-gras text-base text-encre">{T.partageTermine}</Text>
          <Text className="font-texte text-base leading-6 text-encre">{T.arreteParPote(prenom)}</Text>
        </View>
      )}

      <Bouton libelle={T.ecrireA(prenom)} variante="blanc" onPress={() => void ecrire()} />
      <Text className="font-texte text-base leading-6 text-encre">{T.appelleTonPote}</Text>
      <NumerosUrgence />
    </View>
  );
}
