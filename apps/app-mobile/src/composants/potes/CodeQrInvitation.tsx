import { useRouter } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Platform, Share, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { Bouton } from "~/composants/interface/Bouton";
import { creerLienInvitation } from "~/fonctions/communaute/creer-lien-invitation";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCodeInvitation } from "~/hooks/utiliser-code-invitation";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Ton pseudo, sans « @ » ; vide tant que tu n'en as pas choisi */
  pseudo: string;
  /** Libellé du bouton de partage (« Parler de SOS Miam à un pote », « Partager mon profil ») */
  libellePartage?: string;
};

const TAILLE_QR = 196;
const PARTAGE_IMPOSSIBLE = "Le partage n'a pas voulu s'ouvrir ici. Réessaie dans un instant, ou montre plutôt ton QR code !";

/**
 * Ton QR code d'invitation (ton lien SOS Miam dedans, avec ton code secret), ton lien écrit en clair, et de quoi parler de SOS Miam à un pote.
 * Sans pseudo, l'invitation à en choisir un dans tes infos. On dit franchement ce que le lien ne fait pas encore (démo) :
 * le message partagé ne promet donc pas d'ajout, il donne rendez-vous et pointe vers sosmiam.fr (la page d'invitation n'existe pas encore sur le site).
 */
export function CodeQrInvitation({ pseudo, libellePartage = "Parler de SOS Miam à un pote" }: Props) {
  const router = useRouter();
  const code = utiliserCodeInvitation();
  // Partage impossible (aperçu web sans partage) : on le dit gentiment
  const [partageImpossible, setPartageImpossible] = useState(false);

  if (!pseudo) {
    return (
      <View className="items-center gap-3 rounded-carte border-2 border-dashed border-ligne bg-white px-5 py-6">
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

  // Le temps de lire ton code secret sur le téléphone (un éclair)
  const lien = code ? creerLienInvitation(pseudo, code) : null;

  async function partager() {
    try {
      // Pas de lien d'invitation ici : il ne mène encore nulle part chez un pote qui n'a pas l'app
      await Share.share({
        message: `SOS Miam arrive bientôt sur ton téléphone : l'app qui file un coup de main aux petits lieux du coin 🛟 J'y suis déjà, sous le pseudo @${pseudo}. Dès que les comptes ouvrent, ajoute-moi à ta bande et on sauve des lieux ensemble ! https://sosmiam.fr`,
      });
      setPartageImpossible(false);
    } catch {
      setPartageImpossible(true);
      // VoiceOver ignore accessibilityLiveRegion (TalkBack le lit tout seul)
      if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibility(PARTAGE_IMPOSSIBLE);
    }
  }

  return (
    <View className="items-center gap-4 rounded-carte border-2 border-encre bg-white px-5 py-6">
      {/* Fond blanc et marge blanche autour : les appareils photo lisent mieux un QR code bien détouré */}
      <View accessible accessibilityRole="image" accessibilityLabel={lien ? `QR code de ton invitation, @${pseudo}` : "Ton QR code arrive"} className="rounded-2xl border-2 border-encre bg-white p-3">
        {lien ? (
          <QRCode value={lien} size={TAILLE_QR} color={couleurs.encre} backgroundColor="#FFFFFF" ecl="M" />
        ) : (
          <View style={{ width: TAILLE_QR, height: TAILLE_QR }} className="items-center justify-center">
            <ActivityIndicator color={couleurs.encre} />
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

      <Text className="text-center font-texte text-xs leading-4 text-gris">
        {lierPonctuation("Démo : ton lien et ton QR code ne servent encore que dans l'app, et tes potes ne peuvent pas encore t'ajouter. Ça viendra avec les comptes.")}
      </Text>
    </View>
  );
}
