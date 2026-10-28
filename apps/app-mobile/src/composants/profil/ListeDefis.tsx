import { useState } from "react";
import { Text, View } from "react-native";

import { SectionPliable } from "~/composants/interface/SectionPliable";
import { BoutonContour } from "~/composants/profil/BoutonContour";
import { CarteDefi } from "~/composants/profil/CarteDefi";
import { TEXTES_DEFIS_PROFIL_PAR_LANGUE, TEXTES_PROFIL_PAR_LANGUE } from "~/contenus/textes-profil";
import { TEXTES_LISTE_DEFIS_PAR_LANGUE } from "~/contenus/textes-profil-defis";
import { resumerDefis } from "~/fonctions/defis/resumer-defis";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserDefis } from "~/hooks/utiliser-defis";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const DEFIS_VISIBLES = 2;

/**
 * Les défis du moment, chacun avec son avancée : ceux du serveur avec un compte (utiliserDefis).
 * Rien tant qu'ils ne sont pas lus ; un mot si aucun n'est publié, ou si la lecture a raté avant d'en avoir montré.
 */
export function ListeDefis() {
  const T = utiliserTextes(TEXTES_LISTE_DEFIS_PAR_LANGUE);
  const textesProfil = utiliserTextes(TEXTES_PROFIL_PAR_LANGUE);
  const textesDefis = utiliserTextes(TEXTES_DEFIS_PROFIL_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const { defis, erreur } = utiliserDefis();
  const [tousVisibles, setTousVisibles] = useState(false);
  if (defis === null && erreur === null) return null;

  // Un mot à la place des cartes
  const mot =
    defis === null
      ? erreur === "hors-ligne"
        ? { emoji: "📶", texte: T.horsLigne }
        : { emoji: "😴", texte: T.sieste }
      : defis.length === 0
        ? { emoji: "🧑‍🍳", texte: T.aucun }
        : null;

  const resume = !mot && defis ? resumerDefis(defis, langue) : null;
  const liste = defis ?? [];
  const autres = liste.length - DEFIS_VISIBLES;

  return (
    <SectionPliable
      section="defis"
      titre={T.titre}
      sousTitre={T.sousTitre}
      resume={resume ? [resume.compte, resume.accroche] : undefined}
      pliable={resume !== null}
    >
      {mot ? (
        <View className="flex-row items-center gap-3 rounded-carte border-2 border-encre bg-carte p-4">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-3xl">
            {mot.emoji}
          </Text>
          <Text className="flex-1 font-texte text-sm leading-5 text-encre">{lierPonctuation(mot.texte)}</Text>
        </View>
      ) : (
        <>
          {(tousVisibles ? liste : liste.slice(0, DEFIS_VISIBLES)).map((defi) => (
            <CarteDefi key={defi.id} defi={defi} />
          ))}
          {autres > 0 ? (
            <BoutonContour
              libelle={tousVisibles ? textesProfil.voirMoins : textesDefis.voirAutres(autres)}
              libelleLu={tousVisibles ? textesDefis.voirMoinsLu : undefined}
              onPress={() => setTousVisibles(!tousVisibles)}
            />
          ) : null}
        </>
      )}
    </SectionPliable>
  );
}
