import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ARTICLES_ACTUS_PAR_SEMAINE, RUBRIQUES_ACTUS, type RubriqueActus } from "@sos-miam/commun/regles/actus";
import { CarteRubriqueActus } from "~/composants/actus/CarteRubriqueActus";
import { EncartReserveAmbassadeurs } from "~/composants/actus/EncartReserveAmbassadeurs";
import { EnTeteEcranActus } from "~/composants/actus/EnTeteEcranActus";
import { BarreEtatTheme } from "~/composants/interface/BarreEtatTheme";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/textes-actus";
import { ADRESSE_PROGRAMME_AMBASSADEUR, TEXTES_ECRIRE_ACTUS_PAR_LANGUE } from "~/contenus/textes-ecrire-actus";
import { utiliserActus } from "~/hooks/utiliser-actus";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserFermerPile } from "~/hooks/utiliser-fermer-pile";
import { utiliserPeutEcrireActus } from "~/hooks/utiliser-peut-ecrire-actus";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { lireBrouillonActusGarde } from "~/stockage/brouillon-actus";

export default function EcranChoixRubriqueActus() {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const fermer = utiliserFermerPile();
  const T = utiliserTextes(TEXTES_ECRIRE_ACTUS_PAR_LANGUE);
  const TA = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE);
  const peutEcrire = utiliserPeutEcrireActus();
  const { envoyesCetteSemaine } = utiliserActus();
  const restants = Math.max(0, ARTICLES_ACTUS_PAR_SEMAINE - envoyesCetteSemaine);
  const [rubriqueBrouillon, setRubriqueBrouillon] = useState<RubriqueActus | null>(null);

  useEffect(() => {
    let actif = true;
    void lireBrouillonActusGarde().then((garde) => {
      if (actif) setRubriqueBrouillon(garde?.rubrique ?? null);
    });
    return () => {
      actif = false;
    };
  }, []);

  const choisir = (rubrique: RubriqueActus) => router.push({ pathname: "/actus/ecrire/[rubrique]", params: { rubrique } });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <BarreEtatTheme />
      <EnTeteEcranActus titre={T.rubrique.titre} retour={T.formulaire.retour} onRetour={fermer} />
      <ScrollView contentContainerClassName="gap-4 px-5 pb-10 pt-2">
        <Text className="font-texte text-base leading-6 text-gris">{T.rubrique.intro}</Text>
        {peutEcrire ? null : (
          <EncartReserveAmbassadeurs titre={T.rubrique.reserveTitre} texte={T.rubrique.reserveTexte} bouton={T.rubrique.devenir} adresse={ADRESSE_PROGRAMME_AMBASSADEUR} />
        )}
        {peutEcrire ? <Text className="font-texte-semi text-sm text-encre">{T.rubrique.restants(restants)}</Text> : null}
        {RUBRIQUES_ACTUS.map((rubrique) => (
          <CarteRubriqueActus
            key={rubrique}
            rubrique={rubrique}
            nom={TA.rubriques[rubrique]}
            emoji={T.rubrique.emojis[rubrique]}
            description={T.rubrique.descriptions[rubrique]}
            lieux={T.rubrique.lieux[rubrique]}
            brouillon={rubriqueBrouillon === rubrique ? T.rubrique.brouillon : null}
            desactive={!peutEcrire || restants === 0}
            onChoisir={choisir}
          />
        ))}
        {peutEcrire ? <EncartReserveAmbassadeurs titre={T.rubrique.reserveTitre} texte={T.rubrique.reserveTexte} bouton={null} adresse={ADRESSE_PROGRAMME_AMBASSADEUR} /> : null}
        <Pressable accessibilityRole="button" onPress={() => router.push("/actus/mes-articles")} className="min-h-11 items-center justify-center active:opacity-70">
          <Text className="font-texte-gras text-[15px] text-encre underline">{T.mesArticles}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
