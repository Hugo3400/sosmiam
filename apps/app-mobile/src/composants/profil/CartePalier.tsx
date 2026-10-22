import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { calculerPalier } from "@sos-miam/commun/regles/calculer-palier";
import { Jauge } from "~/composants/interface/Jauge";
import { BoueesSemaine } from "~/composants/profil/BoueesSemaine";
import { ChiffresProfil } from "~/composants/profil/ChiffresProfil";
import { FeuillePoints } from "~/composants/profil/FeuillePoints";
import { TEXTES_PALIER } from "~/contenus/textes-profil";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { ecrireProchaineEtape } from "~/fonctions/profil/ecrire-prochaine-etape";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  points: number;
  lieuxSauves: number;
  premiersSauvetages: number;
  badgesObtenus: number;
  badgesTotal: number;
  restantes: number | null;
};

export function CartePalier({ points, lieuxSauves, premiersSauvetages, badgesObtenus, badgesTotal, restantes }: Props) {
  const [explication, setExplication] = useState(false);
  const progression = calculerPalier(points);
  const { actuel, suivant, reste, avancee } = progression;
  const depart = actuel.seuil ?? 0;
  const objectif = reste !== null && suivant?.seuil != null ? suivant.seuil - depart : null;
  const fait = points - depart;
  const etape = ecrireProchaineEtape(progression);

  return (
    <View className="gap-4 rounded-carte border-2 border-encre bg-carte p-5">
      <View accessible accessibilityLabel={`${actuel.nom}, ${TEXTES_PALIER.points(points)}`} className="flex-row items-center gap-3">
        <Text className="text-4xl">{actuel.emoji}</Text>
        <View className="flex-1 flex-row flex-wrap items-center gap-x-2 gap-y-1">
          <Text className="shrink grow font-titre text-2xl text-encre">{actuel.nom}</Text>
          <View className="rounded-full border-2 border-encre bg-jaune px-2.5 py-1">
            <Text className="font-texte-gras text-sm text-nuit">{TEXTES_PALIER.points(points)}</Text>
          </View>
        </View>
      </View>

      <View className="gap-1.5">
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="flex-row justify-between gap-2">
          <Text className="flex-1 font-texte-semi text-sm text-encre">
            {suivant ? TEXTES_PALIER.vers(suivant.emoji, suivant.nom) : `${actuel.emoji} ${actuel.nom}`}
          </Text>
          <Text className="font-texte text-sm text-gris">{objectif !== null ? TEXTES_PALIER.avancee(fait, objectif) : TEXTES_PALIER.palierRempli}</Text>
        </View>
        <Jauge
          avancee={avancee}
          libelle={suivant ? TEXTES_PALIER.versLu(suivant.nom) : actuel.nom}
          texteValeur={objectif !== null ? TEXTES_PALIER.avanceeLue(fait, objectif) : TEXTES_PALIER.palierRempli}
        />
        <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(etape.endsWith("!") ? etape : `${etape}.`)}</Text>
      </View>

      <ChiffresProfil lieuxSauves={lieuxSauves} premiersSauvetages={premiersSauvetages} badgesObtenus={badgesObtenus} badgesTotal={badgesTotal} />
      {restantes !== null ? <BoueesSemaine restantes={restantes} /> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityHint={TEXTES_PALIER.indiceCommentGagner}
        onPress={() => {
          vibrerLegerement();
          setExplication(true);
        }}
        className="min-h-11 justify-center self-start active:opacity-70"
      >
        <Text className="font-texte-semi text-sm text-encre underline">{TEXTES_PALIER.commentGagner}</Text>
      </Pressable>
      <FeuillePoints visible={explication} onFermer={() => setExplication(false)} />
    </View>
  );
}
