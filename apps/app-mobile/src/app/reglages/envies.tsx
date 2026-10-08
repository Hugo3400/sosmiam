import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Platform, Text, View } from "react-native";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import type { CategorieEnvie, Profil } from "@sos-miam/commun/types/profil";
import { GrilleChoix } from "~/composants/inscription/GrilleChoix";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { etapesEnvies } from "~/contenus/inscription/envies";
import { filtrerEtapesEnvies } from "~/fonctions/inscription/filtrer-etapes-envies";
import { utiliserProfil } from "~/hooks/utiliser-profil";

/**
 * Mes envies : toutes les catégories permises à ton âge, l'une sous l'autre. On coche sur une copie, enregistrée d'un coup.
 * Les catégories et les choix masqués par l'âge (alcool sous 18 ans) gardent leurs valeurs.
 */
export default function ReglagesEnvies() {
  const router = useRouter();
  const { profil, enregistrer } = utiliserProfil();
  const [envies, setEnvies] = useState<Profil["envies"]>(() => profil?.envies ?? {});
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);
  const age = profil ? calculerAge(profil.dateNaissance) : null;
  const etapes = useMemo(() => filtrerEtapesEnvies(etapesEnvies, age), [age]);
  if (!profil) return null;

  // Comparées comme des ensembles : décocher puis recocher ne compte pas comme un changement
  const change = etapesEnvies.some(({ categorie }) => {
    const avant = profil.envies[categorie] ?? [];
    const apres = envies[categorie] ?? [];
    return avant.length !== apres.length || apres.some((id) => !avant.includes(id));
  });

  function basculer(categorie: CategorieEnvie, id: string) {
    setEnvies((actuelles) => {
      const coches = actuelles[categorie] ?? [];
      return { ...actuelles, [categorie]: coches.includes(id) ? coches.filter((c) => c !== id) : [...coches, id] };
    });
  }

  async function sauver() {
    if (!profil || !change || enregistrementEnCours) return;
    setEnregistrementEnCours(true);
    try {
      await enregistrer({ ...profil, envies });
      router.back();
    } catch {
      setEnregistrementEnCours(false);
      if (Platform.OS !== "web") Alert.alert("Oups, ça a coincé", "Tes envies n'ont pas pu être enregistrées. Réessaie dans un instant.");
    }
  }

  return (
    <EcranReglage
      titre="Mes envies"
      sousTitre="Coche tout ce qui te tente : on s'en sert pour mettre en avant les lieux qui te ressemblent."
      boutonPrincipal={{
        libelle: "Enregistrer",
        onPress: () => void sauver(),
        desactive: !change || enregistrementEnCours,
        indice: "Enregistre tes envies et revient aux réglages",
      }}
    >
      <View className="gap-10">
        {etapes.map((etape) => {
          const coches = envies[etape.categorie] ?? [];
          // Seuls les choix affichés sont comptés (pas ceux masqués par l'âge)
          const nombre = etape.choix.filter((choix) => coches.includes(choix.id)).length;
          return (
            <View key={etape.categorie} className="gap-4">
              <View className="flex-row items-center gap-2">
                <Text accessibilityElementsHidden importantForAccessibility="no" className="text-2xl">
                  {etape.emoji}
                </Text>
                <Text accessibilityRole="header" className="flex-1 font-titre-gras text-xl text-encre">
                  {etape.nom}
                </Text>
                {nombre > 0 ? (
                  <Text className="font-texte-semi text-sm text-gris">
                    {nombre} choisi{nombre > 1 ? "s" : ""}
                  </Text>
                ) : null}
              </View>
              <GrilleChoix choix={etape.choix} coches={coches} onBasculer={(id) => basculer(etape.categorie, id)} />
              {etape.note ? (
                <View className="flex-row gap-3 rounded-carte border-2 border-dashed border-encre bg-white p-4">
                  <Text accessibilityElementsHidden importantForAccessibility="no" className="text-xl">
                    🔒
                  </Text>
                  <Text className="flex-1 font-texte text-[15px] leading-[22px] text-gris">{etape.note}</Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </EcranReglage>
  );
}
