import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { garderInvitationEnAttente } from "~/stockage/invitation-en-attente";

/**
 * Un lien d'invitation ouvert dans l'app (sosmiam.fr/invitation/<pseudo>#c=<code>, ou l'ancien ?c=) : avec un compte, on
 * file dans « Ajouter un pote » avec le lien ; sans compte, on le garde le temps de t'inscrire, et il se rouvre ensuite.
 */
export default function OuvrirInvitation() {
  const router = useRouter();
  const { pseudo = "" } = useLocalSearchParams<{ pseudo: string; c?: string }>();
  const url = Linking.useURL();
  const { profil } = utiliserProfil();
  // Le lien entier (le code est dans le fragment « #c= », que seule l'app voit) ; à défaut, celui qu'on reconstruit
  const lien = url && url.includes("/invitation/") ? url : `https://sosmiam.fr/invitation/${pseudo}`;

  useEffect(() => {
    if (profil) router.replace({ pathname: "/potes/ajouter", params: { lien } });
    else void garderInvitationEnAttente(lien);
  }, [profil, lien, router]);

  if (profil) return null;
  return (
    <EcranReglage titre={`@${pseudo} t'invite dans sa bande !`} sousTitre="Pour la rejoindre, il te faut un compte SOS Miam (gratuit, une minute).">
      <View className="items-center gap-4 py-4">
        <Mascotte expression="clin" taille={120} />
        <Text className="text-center font-texte text-base leading-6 text-gris">
          {lierPonctuation("Crée ton compte : juste après, on t'emmène rejoindre sa bande, sans retaper le lien.")}
        </Text>
      </View>
      <View className="gap-3">
        <Bouton libelle="Créer mon compte" variante="encre" onPress={() => router.replace("/compte")} />
      </View>
    </EcranReglage>
  );
}
