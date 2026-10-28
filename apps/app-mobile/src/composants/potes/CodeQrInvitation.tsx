import { useRouter } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Alert, Platform, Share, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { Bouton } from "~/composants/interface/Bouton";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLienInvitation } from "~/hooks/utiliser-lien-invitation";

type Props = {
  /** Ton pseudo, sans « @ » ; vide tant que tu n'en as pas choisi */
  pseudo: string;
  /** Libellé du bouton de partage (« Parler de SOS Miam à un pote », « Partager mon profil ») */
  libellePartage?: string;
};

const TAILLE_QR = 196;
const PARTAGE_IMPOSSIBLE = "Le partage n'a pas voulu s'ouvrir ici. Réessaie dans un instant, ou montre plutôt ton QR code !";

/**
 * Ton QR code d'invitation (ton lien SOS Miam dedans, avec ton code secret), ton lien écrit en clair, et de quoi le partager.
 * Compte connecté : le lien vient du serveur, sans date de fin, et « Changer mon lien » le remplace (l'ancien ne marche plus).
 * Sans pseudo, l'invitation à en choisir un dans tes infos.
 */
export function CodeQrInvitation({ pseudo, libellePartage = "Parler de SOS Miam à un pote" }: Props) {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const { lien, erreur, changer } = utiliserLienInvitation(pseudo);
  const [changement, setChangement] = useState<"en-cours" | "fait" | "rate" | null>(null);
  // Partage impossible (aperçu web sans partage) : on le dit gentiment
  const [partageImpossible, setPartageImpossible] = useState(false);

  if (!pseudo) {
    return (
      <View className="items-center gap-3 rounded-carte border-2 border-dashed border-ligne bg-carte px-5 py-6">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-4xl">
          🏷️
        </Text>
        <Text className="text-center font-texte-gras text-base text-encre">Il te faut d'abord un pseudo</Text>
        <Text className="text-center font-texte text-sm leading-5 text-gris">
          {lierPonctuation("C'est lui qui se cache dans ton QR code et ton lien : tes potes te retrouvent avec. Choisis-le dans tes infos, c'est réglé en 10 secondes.")}
        </Text>
        <Bouton libelle="Choisir mon pseudo" petit indice="Ouvre tes infos, où tu choisis ton pseudo" onPress={() => router.push("/reglages/infos")} />
      </View>
    );
  }

  function demanderChangement(faire: () => Promise<unknown>) {
    const lancer = async () => {
      setChangement("en-cours");
      const rate = await faire();
      setChangement(rate ? "rate" : "fait");
    };
    if (Platform.OS === "web") return void lancer();
    Alert.alert("Changer ton lien ?", "Ton ancien lien et ton ancien QR code ne marcheront plus. Ceux qui sont déjà dans ta bande y restent.", [
      { text: "Annuler", style: "cancel" },
      { text: "Changer", style: "destructive", onPress: () => void lancer() },
    ]);
  }

  async function partager() {
    try {
      // Sans lien d'invitation (pas de compte), le message pointe seulement vers sosmiam.fr
      await Share.share({
        message:
          changer && lien
            ? `Rejoins ma bande sur SOS Miam, l'app qui file un coup de main aux petits lieux du coin 🛟 Un clic et on est potes : ${lien}`
            : `SOS Miam, l'app qui file un coup de main aux petits lieux du coin 🛟 Je suis dessus sous le pseudo @${pseudo} : rejoins-moi ! https://sosmiam.fr`,
      });
      setPartageImpossible(false);
    } catch {
      setPartageImpossible(true);
      // VoiceOver ignore accessibilityLiveRegion (TalkBack le lit tout seul)
      if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibility(PARTAGE_IMPOSSIBLE);
    }
  }

  return (
    <View className="items-center gap-4 rounded-carte border-2 border-encre bg-carte px-5 py-6">
      {/* Fond blanc et marge blanche autour : les appareils photo lisent mieux un QR code bien détouré */}
      <View accessible accessibilityRole="image" accessibilityLabel={lien ? `QR code de ton invitation, @${pseudo}` : "Ton QR code arrive"} className="rounded-2xl border-2 border-encre bg-white p-3">
        {lien ? (
          <QRCode value={lien} size={TAILLE_QR} color={couleurs.nuit} backgroundColor="#FFFFFF" ecl="M" />
        ) : (
          <View style={{ width: TAILLE_QR, height: TAILLE_QR }} className="items-center justify-center">
            <ActivityIndicator color={couleurs.nuit} />
          </View>
        )}
      </View>

      <View className="items-center gap-1">
        <Text className="font-titre-gras text-xl text-encre">@{pseudo}</Text>
        {/* Sélectionnable : on peut le copier à la main */}
        {lien ? (
          <Text selectable accessibilityLabel={`Ton lien : ${lien}`} className="text-center font-texte text-sm text-gris">
            {lien}
          </Text>
        ) : null}
      </View>

      <Bouton libelle={libellePartage} indice="Ouvre le partage de ton téléphone, avec un petit mot pour parler de SOS Miam" onPress={() => void partager()} className="self-stretch" />
      {partageImpossible ? (
        <Text accessibilityLiveRegion="polite" className="text-center font-texte text-sm leading-5 text-rouge-texte">
          {lierPonctuation(PARTAGE_IMPOSSIBLE)}
        </Text>
      ) : null}

      {changer ? (
        <>
          <Bouton
            libelle={changement === "en-cours" ? "Un instant…" : "Changer mon lien"}
            variante="blanc"
            petit
            desactive={changement === "en-cours"}
            indice="L'ancien lien et l'ancien QR code ne marcheront plus"
            onPress={() => demanderChangement(changer)}
          />
          {changement === "fait" || changement === "rate" ? (
            <Text accessibilityLiveRegion="polite" className="text-center font-texte text-sm leading-5 text-gris">
              {lierPonctuation(changement === "fait" ? "C'est fait : ton ancien lien ne marche plus, voici le nouveau." : "Le lien n'a pas pu changer. Réessaie dans un instant.")}
            </Text>
          ) : null}
        </>
      ) : null}
      {erreur && !lien ? (
        <Text accessibilityLiveRegion="polite" className="text-center font-texte text-sm leading-5 text-gris">
          {lierPonctuation("Ton lien n'a pas pu se charger (le réseau, sûrement). Il reviendra tout seul à la prochaine ouverture.")}
        </Text>
      ) : null}
    </View>
  );
}
