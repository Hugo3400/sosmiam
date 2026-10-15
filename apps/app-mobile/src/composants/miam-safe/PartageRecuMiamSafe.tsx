import { useRouter, type Href } from "expo-router";
import { Text, View } from "react-native";

import type { PartagePositionMiamSafe } from "@sos-miam/commun/types/miam-safe";
import { Bouton } from "~/composants/interface/Bouton";
import { NumerosUrgence } from "~/composants/miam-safe/NumerosUrgence";
import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";
import { decrireFraicheurPosition } from "~/fonctions/miam-safe/decrire-fraicheur-position";
import { ouvrirPositionPlans } from "~/fonctions/miam-safe/ouvrir-position-plans";
import { utiliserConversations } from "~/hooks/utiliser-conversations";

type Props = { partage: PartagePositionMiamSafe };

export function PartageRecuMiamSafe({ partage }: Props) {
  const router = useRouter();
  const { ouvrirPrive } = utiliserConversations();
  const { prenom } = partage.personne;
  const position = partage.position;

  const ecrire = async () => {
    const conversation = await ouvrirPrive(partage.personne.id).catch(() => null);
    if (conversation) router.push({ pathname: "/potes/discussion/[id]", params: { id: conversation } });
    else router.push(`/potes/profil/${partage.personne.id}` as Href);
  };

  return (
    <View className="gap-4">
      <View className="gap-2 rounded-2xl bg-white p-4">
        <Text accessibilityRole="header" className="font-titre-gras text-2xl text-encre">
          {prenom} ne se sent pas en sécurité
        </Text>
        {partage.lieu ? <Text className="font-texte text-base leading-6 text-encre">Le lieu : « {partage.lieu.nom} ».</Text> : null}
      </View>

      {partage.actif ? (
        <View className="gap-3 rounded-2xl bg-jaune-clair p-4">
          {position ? (
            <>
              <Text accessibilityLiveRegion="polite" className="font-texte-gras text-base text-encre">
                📍 Position {decrireFraicheurPosition(position.le)}
                {position.precisionM !== null ? `, à ${position.precisionM} m près` : ""}.
              </Text>
              <Bouton libelle="Ouvrir dans Plans" variante="encre" onPress={() => ouvrirPositionPlans(position, prenom)} />
            </>
          ) : (
            <Text className="font-texte-gras text-base text-encre">📍 Pas de position partagée : tu as le lieu ci-dessus.</Text>
          )}
          <Text className="font-texte text-sm leading-5 text-gris">Visible jusqu'à {ecrireHeure(partage.expireLe)}, si le partage n'est pas arrêté avant.</Text>
        </View>
      ) : (
        <View accessible className="gap-1 rounded-2xl border-2 border-dashed border-encre bg-white p-4">
          <Text className="font-texte-gras text-base text-encre">Partage terminé</Text>
          <Text className="font-texte text-base leading-6 text-encre">{prenom} l'a arrêté, ou l'heure est passée : la position est effacée.</Text>
        </View>
      )}

      <Bouton libelle={`Écrire à ${prenom}`} variante="blanc" onPress={() => void ecrire()} />
      <Text className="font-texte text-base leading-6 text-encre">
        Appelle ton pote. Si tu penses qu'il y a un danger, appelle les secours et donne-leur le lieu.
      </Text>
      <NumerosUrgence />
    </View>
  );
}
