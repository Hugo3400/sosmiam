import { useRouter } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Alert, Platform, Share, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_BANDE_ACTIVITE_PAR_LANGUE } from "~/contenus/textes-bande-activite";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLienInvitation } from "~/hooks/utiliser-lien-invitation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** Ton pseudo, sans « @ » ; vide tant que tu n'en as pas choisi */
  pseudo: string;
  /** Libellé du bouton de partage (« Parler de SOS Miam à un pote », « Partager mon profil ») */
  libellePartage?: string;
};

const TAILLE_QR = 196;

/**
 * Ton QR code d'invitation (ton lien SOS Miam dedans, avec ton code secret), ton lien écrit en clair, et de quoi le partager.
 * Compte connecté : le lien vient du serveur, sans date de fin, et « Changer mon lien » le remplace (l'ancien ne marche plus).
 * Sans pseudo, l'invitation à en choisir un dans tes infos.
 */
export function CodeQrInvitation({ pseudo, libellePartage }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_BANDE_ACTIVITE_PAR_LANGUE).invitation;
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
        <Text className="text-center font-texte-gras text-base text-encre">{T.sansPseudoTitre}</Text>
        <Text className="text-center font-texte text-sm leading-5 text-gris">
          {lierPonctuation(T.sansPseudoTexte)}
        </Text>
        <Bouton libelle={T.choisirPseudo} petit indice={T.indiceChoisirPseudo} onPress={() => router.push("/reglages/infos")} />
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
    Alert.alert(T.changerTitre, T.changerTexte, [
      { text: T.annuler, style: "cancel" },
      { text: T.changer, style: "destructive", onPress: () => void lancer() },
    ]);
  }

  async function partager() {
    try {
      // Sans lien d'invitation (pas de compte), le message pointe seulement vers sosmiam.fr
      await Share.share({
        message: changer && lien ? T.messageAvecLien(lien) : T.messageSansLien(pseudo),
      });
      setPartageImpossible(false);
    } catch {
      setPartageImpossible(true);
      // VoiceOver ignore accessibilityLiveRegion (TalkBack le lit tout seul)
      if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibility(T.partageImpossible);
    }
  }

  return (
    <View className="items-center gap-4 rounded-carte border-2 border-encre bg-carte px-5 py-6">
      {/* Fond blanc et marge blanche autour : les appareils photo lisent mieux un QR code bien détouré */}
      <View accessible accessibilityRole="image" accessibilityLabel={lien ? T.qrLu(pseudo) : T.qrArrive} className="rounded-2xl border-2 border-encre bg-white p-3">
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
          <Text selectable accessibilityLabel={T.lienLu(lien)} className="text-center font-texte text-sm text-gris">
            {lien}
          </Text>
        ) : null}
      </View>

      <Bouton libelle={libellePartage ?? T.partager} indice={T.indicePartager} onPress={() => void partager()} className="self-stretch" />
      {partageImpossible ? (
        <Text accessibilityLiveRegion="polite" className="text-center font-texte text-sm leading-5 text-rouge-texte">
          {lierPonctuation(T.partageImpossible)}
        </Text>
      ) : null}

      {changer ? (
        <>
          <Bouton
            libelle={changement === "en-cours" ? T.unInstant : T.changerLien}
            variante="blanc"
            petit
            desactive={changement === "en-cours"}
            indice={T.indiceChangerLien}
            onPress={() => demanderChangement(changer)}
          />
          {changement === "fait" || changement === "rate" ? (
            <Text accessibilityLiveRegion="polite" className="text-center font-texte text-sm leading-5 text-gris">
              {lierPonctuation(changement === "fait" ? T.lienChange : T.lienPasChange)}
            </Text>
          ) : null}
        </>
      ) : null}
      {erreur && !lien ? (
        <Text accessibilityLiveRegion="polite" className="text-center font-texte text-sm leading-5 text-gris">
          {lierPonctuation(T.lienPasCharge)}
        </Text>
      ) : null}
    </View>
  );
}
