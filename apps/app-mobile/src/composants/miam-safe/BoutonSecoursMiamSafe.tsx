import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text } from "react-native";

import { FeuilleSecoursMiamSafe } from "~/composants/miam-safe/FeuilleSecoursMiamSafe";

type Props = {
  avecCreerCompte?: boolean;
  sansInternet?: boolean;
};

const DELAI_FERMETURE_FEUILLE_MS = 450;

export function BoutonSecoursMiamSafe({ avecCreerCompte = false, sansInternet = false }: Props) {
  const router = useRouter();
  const [etat, setEtat] = useState<"jamais" | "ouvert" | "ferme">("jamais");
  const fermer = () => setEtat("ferme");
  const creerCompte = () => {
    setEtat("ferme");
    setTimeout(() => router.push("/compte"), DELAI_FERMETURE_FEUILLE_MS);
  };
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Miam Safe"
        accessibilityHint="Tu ne te sens pas en sécurité ici ? Les numéros d'urgence"
        hitSlop={8}
        onPress={() => setEtat("ouvert")}
        className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
      >
        <Text className="text-lg">🚨</Text>
      </Pressable>
      {etat !== "jamais" ? (
        <FeuilleSecoursMiamSafe visible={etat === "ouvert"} sansInternet={sansInternet} onFermer={fermer} onCreerCompte={avecCreerCompte ? creerCompte : undefined} />
      ) : null}
    </>
  );
}
