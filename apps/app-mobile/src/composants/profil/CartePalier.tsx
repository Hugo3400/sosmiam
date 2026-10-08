import { Text, View } from "react-native";

import { POINTS_AMBASSADEUR } from "@sos-miam/commun/regles/ambassadeurs";
import { calculerPalier } from "@sos-miam/commun/regles/calculer-palier";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  /** Points gagnés avec ce que le téléphone sait mesurer (calculerPointsLocaux) */
  points: number;
};

/** Ton palier du programme Ambassadeurs : où tu en es, ce qu'il manque pour le suivant, et comment gagner des points aujourd'hui. */
export function CartePalier({ points }: Props) {
  const { actuel, suivant, reste, avancee } = calculerPalier(points);
  const pourcentage = Math.round(Math.min(1, Math.max(0, avancee)) * 100);

  const prochaineEtape = !suivant
    ? "Tu es tout en haut. Chapeau bas, la ville te doit une fière chandelle !"
    : reste !== null
      ? `${reste} point${reste > 1 ? "s" : ""} avant ${suivant.emoji} ${suivant.nom}`
      : `Prochaine étape : ${suivant.nom}, sur candidature`;
  const valeurJauge = reste !== null && suivant?.seuil != null
    ? `${points - (actuel.seuil ?? 0)} points sur ${suivant.seuil - (actuel.seuil ?? 0)}`
    : "Palier rempli";

  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-white p-5">
      <View className="flex-row items-center gap-3">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-4xl">
          {actuel.emoji}
        </Text>
        <View className="flex-1">
          <Text className="font-texte-semi text-sm text-gris">Ton palier Ambassadeur</Text>
          <Text accessibilityRole="header" className="font-titre text-2xl text-encre">{actuel.nom}</Text>
        </View>
        <View className="rounded-full border-2 border-encre bg-jaune px-3 py-1">
          <Text accessibilityLabel={`${points} point${points > 1 ? "s" : ""}`} className="font-texte-gras text-sm text-encre">
            {points} pts
          </Text>
        </View>
      </View>

      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={suivant ? `Vers ${suivant.nom}` : "Palier"}
        accessibilityValue={{ min: 0, max: 100, now: pourcentage, text: valeurJauge }}
        className="h-3 overflow-hidden rounded-full border-2 border-encre bg-white"
      >
        <View className="h-full rounded-full bg-tomate" style={{ width: `${pourcentage}%` }} />
      </View>
      <Text className="font-texte-semi text-base text-encre">{lierPonctuation(prochaineEtape)}</Text>

      <Text className="font-texte text-sm leading-5 text-gris">
        {lierPonctuation(
          `Pour l'instant, chaque rescousse te rapporte +${POINTS_AMBASSADEUR.rescousse} points, être le premier sauveteur d'un lieu +${POINTS_AMBASSADEUR.premierSauveteur}, et chaque défi réussi ses propres points. Les visites validées arrivent bientôt !`,
        )}
      </Text>
    </View>
  );
}
