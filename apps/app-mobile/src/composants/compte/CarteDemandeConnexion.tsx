import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { textesConnexionQr } from "~/contenus/connexion-qr";
import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { DemandeConnexionQr } from "~/services/demo/connexion-qr-demo";

type Props = {
  demande: DemandeConnexionQr;
  secondesRestantes: number;
  envoi: boolean;
  souci: string | null;
  onRefuser: () => void;
  onAccepter: () => void;
};

/**
 * « Quelqu'un veut se connecter à TON compte » : l'appareil, l'hôte réel qui a demandé (sosmiam.fr, pro.sosmiam.fr ou
 * l'app) et l'heure, en gros ; la mise en garde contre les QR envoyés par un escroc ; « Refuser » en bouton principal.
 */
export function CarteDemandeConnexion({ demande, secondesRestantes, envoi, souci, onRefuser, onAccepter }: Props) {
  return (
    <View className="gap-5">
      <View
        accessible
        accessibilityLabel={`Quelqu'un veut se connecter à ton compte sur ${demande.appareil}, depuis ${demande.origine}, demandé à ${ecrireHeure(demande.cree)}`}
        className="gap-2 rounded-carte border-2 border-encre bg-white p-5"
      >
        <Text className="text-4xl">{demande.cible === "app" ? "📱" : "💻"}</Text>
        <Text className="font-texte-semi text-base text-gris">Quelqu'un veut se connecter à TON compte sur :</Text>
        <Text className="font-titre text-2xl leading-8 text-encre">{demande.appareil}</Text>
        <Text className="font-texte-gras text-base text-encre">{demande.origine}</Text>
        <Text className="font-texte text-sm text-gris">Demandé à {ecrireHeure(demande.cree)}</Text>
      </View>

      <Text accessibilityRole="header" className="font-titre text-2xl leading-8 text-encre">
        {textesConnexionQr.questionConfirmer}
      </Text>
      <View className="flex-row gap-3 rounded-2xl border-2 border-rouge-texte bg-white px-4 py-3">
        <Text accessibilityElementsHidden importantForAccessibility="no" className="text-xl">
          ⚠️
        </Text>
        <Text className="flex-1 font-texte-semi text-sm leading-5 text-encre">{lierPonctuation(textesConnexionQr.attention)}</Text>
      </View>

      {souci ? <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(souci)}</Text> : null}

      <Bouton libelle={textesConnexionQr.refuser} onPress={onRefuser} desactive={envoi} />
      <Bouton libelle={envoi ? "Un instant…" : textesConnexionQr.accepter} variante="blanc" onPress={onAccepter} desactive={envoi} />
      <Text accessibilityLiveRegion="polite" className="text-center font-texte text-sm text-gris">
        {secondesRestantes > 0 ? `Encore ${secondesRestantes} s pour répondre` : "C'est l'heure !"}
      </Text>
    </View>
  );
}
