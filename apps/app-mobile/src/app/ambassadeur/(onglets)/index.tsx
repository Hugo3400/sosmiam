import { useRouter } from "expo-router";
import { ActivityIndicator, Linking, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CarteStatutAmbassadeur } from "~/composants/ambassadeur/CarteStatutAmbassadeur";
import { TuileEspace } from "~/composants/ambassadeur/TuileEspace";
import { Bouton } from "~/composants/interface/Bouton";
import { EnTeteMode } from "~/composants/modes/EnTeteMode";
import { LigneMonLieu } from "~/composants/pro/LigneMonLieu";
import { TEXTES_ECRAN_ESPACE_AMBASSADEUR_PAR_LANGUE } from "~/contenus/textes-espace-ambassadeur";
import { TEXTES_EN_TETE_MODE_PAR_LANGUE } from "~/contenus/textes-modes";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserEspaceAmbassadeur } from "~/hooks/utiliser-espace-ambassadeur";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const SITE_ESPACE = "https://ambassadeur.sosmiam.fr/espace";

/**
 * L'Espace du mode ambassadeur : où en est ton rôle, et trois tuiles (missions à faire, avis à relire, messages non lus)
 * qui ouvrent leur onglet. Le reste (fondateurs, propositions de lieux, ambassadeur certifié) est sur ambassadeur.sosmiam.fr.
 */
export default function EcranEspaceAmbassadeur() {
  const couleurs = utiliserCouleurs();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_ECRAN_ESPACE_AMBASSADEUR_PAR_LANGUE);
  const textesMode = utiliserTextes(TEXTES_EN_TETE_MODE_PAR_LANGUE);
  const router = useRouter();
  const { roles, revenirAuModePerso } = utiliserModes();
  const { espace, erreur } = utiliserEspaceAmbassadeur();
  const statut = espace?.statut ?? roles.ambassadeur;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 px-5 pb-10 pt-3">
        <EnTeteMode mode="ambassadeur" titre={T.titre} sousTitre={T.sousTitre} />
        {statut ? <CarteStatutAmbassadeur statut={statut} /> : null}

        {statut === "actif" ? (
          espace ? (
            <View className="flex-row gap-3">
              <TuileEspace emoji="🧭" nombre={espace.missionsAFaire} libelle={T.missionsAFaire(espace.missionsAFaire)} onPress={() => router.navigate("/ambassadeur/missions")} />
              <TuileEspace emoji="🔍" nombre={espace.avisARelire} libelle={T.avisARelire(espace.avisARelire)} onPress={() => router.navigate("/ambassadeur/relectures")} />
              <TuileEspace emoji="📬" nombre={espace.messagesNonLus} libelle={T.messagesNonLus(espace.messagesNonLus)} onPress={() => router.navigate("/ambassadeur/messages")} />
            </View>
          ) : erreur ? (
            <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation(decrireEchecVisite(erreur, langue).texte)}</Text>
          ) : (
            <ActivityIndicator color={couleurs.encre} accessibilityLabel={T.ouverture} />
          )
        ) : null}

        <View className="gap-3">
          <LigneMonLieu
            emoji="🌐"
            titre={T.siteTitre}
            detail={T.siteDetail}
            onPress={() => void Linking.openURL(SITE_ESPACE)}
          />
        </View>
        <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(T.palier)}</Text>
        <Bouton libelle={textesMode.revenir} variante="blanc" onPress={revenirAuModePerso} />
      </ScrollView>
    </SafeAreaView>
  );
}
