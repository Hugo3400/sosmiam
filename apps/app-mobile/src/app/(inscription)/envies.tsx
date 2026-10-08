import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { EcranEtape } from "~/composants/inscription/EcranEtape";
import { GrilleChoix } from "~/composants/inscription/GrilleChoix";
import { etapesEnvies } from "~/contenus/inscription/envies";
import { filtrerEtapesEnvies } from "~/fonctions/inscription/filtrer-etapes-envies";
import { utiliserBrouillonInscription } from "~/hooks/utiliser-brouillon-inscription";

/** Étape 3 sur 4 : les envies, une catégorie à la fois (sans l'alcool sous 18 ans). Tout est facultatif. */
export default function Envies() {
  const router = useRouter();
  const { brouillon, basculerEnvie } = utiliserBrouillonInscription();
  const age = brouillon.dateNaissance ? calculerAge(brouillon.dateNaissance) : null;
  const etapes = useMemo(() => filtrerEtapesEnvies(etapesEnvies, age), [age]);
  const [index, setIndex] = useState(0);

  const etape = etapes[Math.min(index, etapes.length - 1)];
  const coches = brouillon.envies[etape.categorie] ?? [];
  const derniere = index >= etapes.length - 1;

  const suivant = () => (derniere ? router.push("/c-est-pret") : setIndex(index + 1));
  const precedent = () => (index > 0 ? setIndex(index - 1) : router.back());

  return (
    <EcranEtape
      // Nouvelle catégorie : l'écran repart du haut et VoiceOver lit le nouveau titre
      key={etape.categorie}
      titre={`${etape.emoji} ${etape.titre}`}
      sousTitre={etape.sousTitre}
      etape={{ numero: 3, total: 4 }}
      onRetour={precedent}
      boutonPrincipal={{ libelle: coches.length === 0 ? "Passer" : derniere ? "Terminer" : "Continuer", onPress: suivant }}
    >
      <Text className="mb-4 font-texte-semi text-sm text-gris">
        {index + 1} sur {etapes.length}
        {coches.length > 0 ? ` · ${coches.length} choisi${coches.length > 1 ? "s" : ""}` : ""}
      </Text>
      <GrilleChoix choix={etape.choix} coches={coches} onBasculer={(id) => basculerEnvie(etape.categorie, id)} />
      {etape.note ? (
        <View className="mt-6 flex-row gap-3 rounded-carte border-2 border-dashed border-encre bg-white p-4">
          <Text className="text-xl">🔒</Text>
          <Text className="flex-1 font-texte text-[15px] leading-[22px] text-gris">{etape.note}</Text>
        </View>
      ) : null}
    </EcranEtape>
  );
}
