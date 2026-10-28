import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { EcranEtape } from "~/composants/inscription/EcranEtape";
import { GrilleChoix } from "~/composants/inscription/GrilleChoix";
import { ETAPES_ENVIES_PAR_LANGUE } from "~/contenus/inscription/envies";
import { TEXTES_INSCRIPTION_PROFIL_PAR_LANGUE } from "~/contenus/textes-inscription-profil";
import { utiliserBrouillonInscription } from "~/hooks/utiliser-brouillon-inscription";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Étape 3 sur 4 : les envies, une catégorie à la fois. Tout est facultatif. */
export default function Envies() {
  const router = useRouter();
  const T = utiliserTextes(TEXTES_INSCRIPTION_PROFIL_PAR_LANGUE);
  const etapesEnvies = utiliserTextes(ETAPES_ENVIES_PAR_LANGUE);
  const { brouillon, basculerEnvie } = utiliserBrouillonInscription();
  const [index, setIndex] = useState(0);

  const etape = etapesEnvies[Math.min(index, etapesEnvies.length - 1)];
  const coches = brouillon.envies[etape.categorie] ?? [];
  const derniere = index >= etapesEnvies.length - 1;

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
      boutonPrincipal={{ libelle: coches.length === 0 ? T.passer : derniere ? T.terminer : T.continuer, onPress: suivant }}
    >
      <Text className="mb-4 font-texte-semi text-sm text-gris">
        {T.progressionEnvies(index + 1, etapesEnvies.length, coches.length)}
      </Text>
      <GrilleChoix choix={etape.choix} coches={coches} onBasculer={(id) => basculerEnvie(etape.categorie, id)} />
      {etape.note ? (
        <View className="mt-6 flex-row gap-3 rounded-carte border-2 border-dashed border-encre bg-carte p-4">
          <Text className="text-xl">🔒</Text>
          <Text className="flex-1 font-texte text-[15px] leading-[22px] text-gris">{etape.note}</Text>
        </View>
      ) : null}
    </EcranEtape>
  );
}
