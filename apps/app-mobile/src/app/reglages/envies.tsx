import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Text, View } from "react-native";

import type { CategorieEnvie, Profil } from "@sos-miam/commun/types/profil";
import { GrilleChoix } from "~/composants/inscription/GrilleChoix";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { ETAPES_ENVIES_PAR_LANGUE } from "~/contenus/inscription/envies";
import { TEXTES_REGLAGES_PROFIL_PAR_LANGUE } from "~/contenus/textes-reglages-profil";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * Mes envies : toutes les catégories, l'une sous l'autre. On coche sur une copie, enregistrée d'un coup sur le téléphone ;
 * avec un compte, elle part ensuite au serveur sans te faire attendre (sans les régimes, qui restent ici), même sans réseau.
 */
export default function ReglagesEnvies() {
  const router = useRouter();
  const T = utiliserTextes(TEXTES_REGLAGES_PROFIL_PAR_LANGUE);
  const etapesEnvies = utiliserTextes(ETAPES_ENVIES_PAR_LANGUE);
  const { profil, modifierEnvies } = utiliserProfil();
  const [envies, setEnvies] = useState<Profil["envies"]>(() => profil?.envies ?? {});
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);
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
      await modifierEnvies(envies);
      router.back();
    } catch {
      setEnregistrementEnCours(false);
      if (Platform.OS !== "web") Alert.alert(T.enviesOups, T.enviesRatees);
    }
  }

  return (
    <EcranReglage
      titre={T.mesEnvies}
      sousTitre={T.enviesSousTitre}
      boutonPrincipal={{
        libelle: T.enregistrer,
        onPress: () => void sauver(),
        desactive: !change || enregistrementEnCours,
        indice: T.enviesIndice,
      }}
    >
      <View className="gap-10">
        {etapesEnvies.map((etape) => {
          const coches = envies[etape.categorie] ?? [];
          // Seuls les choix encore proposés sont comptés (un ancien identifiant gardé dans le profil est ignoré)
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
                    {T.choisis(nombre)}
                  </Text>
                ) : null}
              </View>
              <GrilleChoix choix={etape.choix} coches={coches} onBasculer={(id) => basculer(etape.categorie, id)} />
              {etape.note ? (
                <View className="flex-row gap-3 rounded-carte border-2 border-dashed border-encre bg-carte p-4">
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
