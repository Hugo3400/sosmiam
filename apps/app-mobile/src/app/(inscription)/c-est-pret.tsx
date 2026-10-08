import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, View } from "react-native";

import { EcranEtape } from "~/composants/inscription/EcranEtape";
import { Mascotte } from "~/composants/marque/Mascotte";
import { construireProfil } from "~/fonctions/inscription/construire-profil";
import { utiliserBrouillonInscription } from "~/hooks/utiliser-brouillon-inscription";
import { utiliserProfil } from "~/hooks/utiliser-profil";

/** Étape 4 sur 4 : récapitulatif, puis enregistrement du profil (la racine bascule alors vers les onglets). */
export default function CEstPret() {
  const router = useRouter();
  const { brouillon, verrouAge } = utiliserBrouillonInscription();
  const { enregistrer } = utiliserProfil();
  const [envoi, setEnvoi] = useState(false);
  const profil = construireProfil(brouillon);

  // Verrou d'âge actif sur ce téléphone : jamais de profil, retour à l'écran qui l'explique
  if (verrouAge) return <Redirect href="/fais-connaissance" />;

  // Ne devrait pas arriver en suivant le parcours : il manque une info obligatoire
  if (!profil) {
    return (
      <EcranEtape
        titre="Il manque une info"
        sousTitre="On a besoin de ton prénom, de ta date de naissance et de ta ville pour finir."
        etape={{ numero: 4, total: 4 }}
        boutonPrincipal={{ libelle: "Compléter mon profil", onPress: () => router.replace("/fais-connaissance") }}
      >
        <Mascotte expression="surprise" taille={120} />
      </EcranEtape>
    );
  }

  const nombreEnvies = Object.values(profil.envies).reduce((total, liste) => total + (liste?.length ?? 0), 0);

  async function decouvrir() {
    if (!profil || envoi || verrouAge) return;
    setEnvoi(true);
    try {
      await enregistrer(profil);
    } catch {
      setEnvoi(false);
      Alert.alert("Oups", "Ton profil n'a pas pu être enregistré sur ce téléphone. Réessaie dans un instant.");
    }
  }

  return (
    <EcranEtape
      titre={`C'est prêt, ${profil.prenom} !`}
      sousTitre="Tes 3 rescousses de la semaine t'attendent. À toi de sauver ta première table !"
      etape={{ numero: 4, total: 4 }}
      boutonPrincipal={{ libelle: envoi ? "C'est parti…" : "Découvrir SOS Miam", onPress: decouvrir, desactive: envoi }}
    >
      <View className="items-center">
        <Mascotte expression="clin" taille={150} flotte />
      </View>
      <View className="mt-6 gap-3 rounded-carte border-2 border-encre bg-white p-5">
        <Text className="font-texte text-base text-encre">📍 {profil.ville}</Text>
        <Text className="font-texte text-base text-encre">
          💛 {nombreEnvies > 0 ? `${nombreEnvies} envie${nombreEnvies > 1 ? "s" : ""} pour te proposer les bons lieux` : "Pas d'envie choisie : tu pourras en ajouter plus tard"}
        </Text>
        <Text className="font-texte text-base text-encre">🔒 Tes infos restent sur ton téléphone, dans son coffre-fort chiffré.</Text>
      </View>
    </EcranEtape>
  );
}
