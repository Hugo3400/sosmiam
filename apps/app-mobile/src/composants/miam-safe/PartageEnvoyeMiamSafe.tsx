import { Text, View } from "react-native";

import type { PartagePositionMiamSafe } from "@sos-miam/commun/types/miam-safe";
import { Bouton } from "~/composants/interface/Bouton";
import { NumerosUrgence } from "~/composants/miam-safe/NumerosUrgence";
import { TEXTES_MIAM_SAFE_PARTAGE_PAR_LANGUE } from "~/contenus/textes-miam-safe-partage";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";
import { decrireFraicheurPosition } from "~/fonctions/miam-safe/decrire-fraicheur-position";
import { utiliserEnvoiPositionMiamSafe } from "~/hooks/utiliser-envoi-position-miam-safe";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

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
  const T = utiliserTextes(TEXTES_MIAM_SAFE_PARTAGE_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const jusqua = ecrireHeureLangue(partage.expireLe, langue);

  return (
    <View className="gap-4">
      {telephones === 0 ? (
        <View accessible className="gap-2 rounded-2xl bg-tomate p-4">
          <Text className="font-texte-gras text-base text-nuit">{T.rienRecu(prenom)}</Text>
          <Text className="font-texte text-base leading-6 text-nuit">{T.rienRecuTexte}</Text>
        </View>
      ) : telephones !== null ? (
        <View accessible className="rounded-2xl bg-jaune-clair p-4">
          <Text className="font-texte-gras text-base text-encre">{T.notificationPartie(prenom)}</Text>
        </View>
      ) : null}

      {partage.actif && !partage.avecPosition ? (
        <View className="gap-3 rounded-2xl bg-carte p-4">
          <Text className="font-texte-gras text-base text-encre">{T.sansPosition(prenom, jusqua)}</Text>
          <Bouton libelle={arret ? T.arret : T.arreterPartage} variante="blanc" desactive={arret} onPress={onArreter} />
        </View>
      ) : partage.actif ? (
        <View className="gap-3 rounded-2xl bg-carte p-4">
          <Text className="font-texte-gras text-base text-encre">{T.voitPosition(prenom, jusqua)}</Text>
          <Text accessibilityLiveRegion="polite" className="font-texte text-base leading-6 text-encre">
            {etat === "refusee"
              ? T.positionRefusee(prenom)
              : etat === "erreur"
                ? T.positionErreur
                : derniere
                  ? T.dernierePosition(decrireFraicheurPosition(derniere.toISOString(), langue))
                  : T.envoiPosition}
          </Text>
          <Text className="font-texte text-sm leading-5 text-gris">{T.garderOuvert}</Text>
          <Bouton libelle={arret ? T.arret : T.arreterPartage} variante="blanc" desactive={arret} onPress={onArreter} />
        </View>
      ) : (
        <View accessible className="gap-1 rounded-2xl border-2 border-dashed border-encre bg-carte p-4">
          <Text className="font-texte-gras text-base text-encre">{T.partageTermine}</Text>
          <Text className="font-texte text-base leading-6 text-encre">{T.plusVisible(prenom)}</Text>
        </View>
      )}
      <NumerosUrgence />
    </View>
  );
}
