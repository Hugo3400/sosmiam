import { useRouter } from "expo-router";
import { useState } from "react";
import { Share, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { Bouton } from "~/composants/interface/Bouton";
import { creerLienInvitation } from "~/fonctions/communaute/creer-lien-invitation";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Ton pseudo, sans « @ » ; vide tant que tu n'en as pas choisi */
  pseudo: string;
  /** Libellé du bouton de partage (« Partager ton lien », « Partager mon profil ») */
  libellePartage?: string;
};

const TAILLE_QR = 196;

/**
 * Ton QR code d'invitation (ton lien SOS Miam dedans), ton lien écrit en clair et de quoi le partager.
 * Sans pseudo, l'invitation à en choisir un dans tes infos. On dit franchement ce que le lien ne fait pas encore (démo).
 */
export function CodeQrInvitation({ pseudo, libellePartage = "Partager ton lien" }: Props) {
  const router = useRouter();
  // Partage impossible (aperçu web sans partage) : on invite à copier le lien affiché
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

  const lien = creerLienInvitation(pseudo);

  async function partager() {
    try {
      await Share.share({ message: `Rejoins-moi sur SOS Miam ! Je suis @${pseudo} : ajoute-moi à ta bande et on sauve des lieux ensemble 🛟 ${lien}` });
      setPartageImpossible(false);
    } catch {
      setPartageImpossible(true);
    }
  }

  return (
    <View className="items-center gap-4 rounded-carte border-2 border-encre bg-white px-5 py-6">
      {/* Fond blanc et marge blanche autour : les appareils photo lisent mieux un QR code bien détouré */}
      <View accessible accessibilityRole="image" accessibilityLabel={`QR code de ton invitation, @${pseudo}`} className="rounded-2xl border-2 border-encre bg-white p-3">
        <QRCode value={lien} size={TAILLE_QR} color={couleurs.encre} backgroundColor="#FFFFFF" ecl="M" />
      </View>

      <View className="items-center gap-1">
        <Text className="font-titre-gras text-xl text-encre">@{pseudo}</Text>
        {/* Sélectionnable : on peut le copier à la main si le partage ne s'ouvre pas */}
        <Text selectable accessibilityLabel={`Ton lien : ${lien}`} className="text-center font-texte text-sm text-gris">
          {lien}
        </Text>
      </View>

      <Bouton libelle={libellePartage} indice="Ouvre le partage de ton téléphone avec ton lien d'invitation" onPress={() => void partager()} className="self-stretch" />
      {partageImpossible ? (
        <Text accessibilityLiveRegion="polite" className="text-center font-texte text-sm leading-5 text-rouge-texte">
          {lierPonctuation("Le partage n'a pas voulu s'ouvrir ici : copie le lien juste au-dessus, ça marche aussi !")}
        </Text>
      ) : null}

      <Text className="text-center font-texte text-xs leading-4 text-gris">
        {lierPonctuation("Démo : ton lien ne s'ouvre pas encore tout seul chez tes potes, et ils ne peuvent pas encore t'ajouter. Ça viendra avec les comptes.")}
      </Text>
    </View>
  );
}
