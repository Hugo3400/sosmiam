import { useRouter, type Href } from "expo-router";
import { useState } from "react";
import { Pressable, Text } from "react-native";

import { FeuilleSecoursMiamSafe } from "~/composants/miam-safe/FeuilleSecoursMiamSafe";
import { TEXTES_MIAM_SAFE_AIDE_PAR_LANGUE } from "~/contenus/textes-miam-safe-aide";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  avecCreerCompte?: boolean;
  sansInternet?: boolean;
};

const DELAI_FERMETURE_FEUILLE_MS = 450;

export function BoutonSecoursMiamSafe({ avecCreerCompte = false, sansInternet = false }: Props) {
  const router = useRouter();
  const T = utiliserTextes(TEXTES_MIAM_SAFE_AIDE_PAR_LANGUE);
  const [etat, setEtat] = useState<"jamais" | "ouvert" | "ferme">("jamais");
  const fermer = () => setEtat("ferme");
  const ouvrirApresFermeture = (chemin: Href) => {
    setEtat("ferme");
    setTimeout(() => router.push(chemin), DELAI_FERMETURE_FEUILLE_MS);
  };
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={T.boutonLu}
        accessibilityHint={T.boutonIndice}
        hitSlop={8}
        onPress={() => setEtat("ouvert")}
        className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
      >
        <Text className="text-lg">🚨</Text>
      </Pressable>
      {etat !== "jamais" ? (
        <FeuilleSecoursMiamSafe
          visible={etat === "ouvert"}
          sansInternet={sansInternet}
          onFermer={fermer}
          onMontrerEcran={() => ouvrirApresFermeture("/miam-safe/comptoir")}
          onCreerCompte={avecCreerCompte ? () => ouvrirApresFermeture("/compte") : undefined}
        />
      ) : null}
    </>
  );
}
