import { Text, View } from "react-native";

import type { PartagePositionMiamSafe } from "@sos-miam/commun/types/miam-safe";
import { Bouton } from "~/composants/interface/Bouton";
import { NumerosUrgence } from "~/composants/miam-safe/NumerosUrgence";
import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";
import { decrireFraicheurPosition } from "~/fonctions/miam-safe/decrire-fraicheur-position";
import { utiliserEnvoiPositionMiamSafe } from "~/hooks/utiliser-envoi-position-miam-safe";

type Props = {
  partage: PartagePositionMiamSafe;
  /** Sur combien de téléphones du pote la notification est partie (null : écran rouvert plus tard, on ne sait plus) */
  telephones: number | null;
  arret: boolean;
  onArreter: () => void;
  /** Le serveur dit que le partage est fini : relire */
  onTermine: () => void;
};

/**
 * L'écran du partage, côté personne qui partage : si la notification est vraiment partie (sinon, appeler), jusqu'à quand
 * la position est visible, et « Arrêter le partage ». La position part d'ici, tant que l'écran est ouvert.
 */
export function PartageEnvoyeMiamSafe({ partage, telephones, arret, onArreter, onTermine }: Props) {
  // Interrupteur coupé : aucune position ne part, jamais (le serveur les refuserait de toute façon)
  const { etat, derniere } = utiliserEnvoiPositionMiamSafe(partage.actif && partage.avecPosition ? partage.id : null, onTermine);
  const prenom = partage.personne.prenom;

  return (
    <View className="gap-4">
      {telephones === 0 ? (
        <View accessible className="gap-2 rounded-2xl bg-tomate p-4">
          <Text className="font-texte-gras text-base text-encre">⚠️ {prenom} n'a rien reçu</Text>
          <Text className="font-texte text-base leading-6 text-encre">
            Aucun téléphone de ton pote n'est connecté à SOS Miam : la notification n'est pas partie. Appelle ton pote, ou les
            secours si tu es en danger.
          </Text>
        </View>
      ) : telephones !== null ? (
        <View accessible className="rounded-2xl bg-jaune-clair p-4">
          <Text className="font-texte-gras text-base text-encre">✅ La notification est partie sur le téléphone de {prenom}.</Text>
        </View>
      ) : null}

      {partage.actif && !partage.avecPosition ? (
        <View className="gap-3 rounded-2xl bg-white p-4">
          <Text className="font-texte-gras text-base text-encre">
            Tu n'as pas partagé ta position : {prenom} voit seulement le lieu, jusqu'à {ecrireHeure(partage.expireLe)}.
          </Text>
          <Bouton libelle={arret ? "Arrêt…" : "Arrêter le partage"} variante="blanc" desactive={arret} onPress={onArreter} />
        </View>
      ) : partage.actif ? (
        <View className="gap-3 rounded-2xl bg-white p-4">
          <Text className="font-texte-gras text-base text-encre">
            📍 {prenom} voit ta position jusqu'à {ecrireHeure(partage.expireLe)}.
          </Text>
          <Text accessibilityLiveRegion="polite" className="font-texte text-base leading-6 text-encre">
            {etat === "refusee"
              ? `Tu n'as pas donné accès à ta position : ${prenom} voit seulement le lieu. Tu peux l'autoriser dans les réglages du téléphone.`
              : etat === "erreur"
                ? "Ta position n'est pas partie cette fois. On réessaie dès que tu bouges."
                : derniere
                  ? `Dernière position envoyée ${decrireFraicheurPosition(derniere.toISOString())}.`
                  : "On envoie ta position…"}
          </Text>
          <Text className="font-texte text-sm leading-5 text-gris">
            Garde cet écran ouvert : téléphone verrouillé ou app fermée, ta position ne se met plus à jour.
          </Text>
          <Bouton libelle={arret ? "Arrêt…" : "Arrêter le partage"} variante="blanc" desactive={arret} onPress={onArreter} />
        </View>
      ) : (
        <View accessible className="gap-1 rounded-2xl border-2 border-dashed border-encre bg-white p-4">
          <Text className="font-texte-gras text-base text-encre">Partage terminé</Text>
          <Text className="font-texte text-base leading-6 text-encre">{prenom} ne voit plus ta position : elle est effacée.</Text>
        </View>
      )}
      <NumerosUrgence />
    </View>
  );
}
