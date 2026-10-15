import { Text, View } from "react-native";

import { SectionPliable } from "~/composants/interface/SectionPliable";
import { CarteDefi } from "~/composants/profil/CarteDefi";
import { resumerDefis } from "~/fonctions/defis/resumer-defis";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserDefis } from "~/hooks/utiliser-defis";

/**
 * Les défis du moment, chacun avec son avancée : ceux du serveur avec un compte, ceux d'exemple en démo (utiliserDefis).
 * Rien tant qu'ils ne sont pas lus ; un mot si aucun n'est publié, ou si la lecture a raté avant d'en avoir montré.
 */
export function ListeDefis() {
  const { defis, erreur } = utiliserDefis();
  if (defis === null && erreur === null) return null;

  // Un mot à la place des cartes
  const mot =
    defis === null
      ? erreur === "hors-ligne"
        ? { emoji: "📶", texte: "Tes défis arrivent dès que le réseau revient. Ils t'attendent bien au chaud !" }
        : { emoji: "😴", texte: "Tes défis font une petite sieste. Repasse sur ton profil dans un instant pour les réveiller." }
      : defis.length === 0
        ? { emoji: "🧑‍🍳", texte: "Pas de défi en ce moment : la Brigade en mijote de nouveaux. Reviens vite y goûter !" }
        : null;

  const resume = !mot && defis ? resumerDefis(defis) : null;

  return (
    <SectionPliable
      section="defis"
      titre="Défis du moment"
      sousTitre="Des petites quêtes gourmandes, des points en plus."
      resume={resume ? [resume.compte, resume.accroche] : undefined}
      pliable={resume !== null}
    >
      {mot ? (
        <View className="flex-row items-center gap-3 rounded-carte border-2 border-encre bg-white p-4">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-3xl">
            {mot.emoji}
          </Text>
          <Text className="flex-1 font-texte text-sm leading-5 text-encre">{lierPonctuation(mot.texte)}</Text>
        </View>
      ) : (
        (defis ?? []).map((defi) => <CarteDefi key={defi.id} defi={defi} />)
      )}
    </SectionPliable>
  );
}
