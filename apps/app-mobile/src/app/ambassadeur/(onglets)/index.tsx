import { useRouter } from "expo-router";
import { ActivityIndicator, Linking, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CarteStatutAmbassadeur } from "~/composants/ambassadeur/CarteStatutAmbassadeur";
import { TuileEspace } from "~/composants/ambassadeur/TuileEspace";
import { Bouton } from "~/composants/interface/Bouton";
import { EnTeteMode } from "~/composants/modes/EnTeteMode";
import { LigneMonLieu } from "~/composants/pro/LigneMonLieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";
import { utiliserEspaceAmbassadeur } from "~/hooks/utiliser-espace-ambassadeur";
import { utiliserModes } from "~/hooks/utiliser-modes";
import couleurs from "~/theme/couleurs";

const SITE_ESPACE = "https://ambassadeur.sosmiam.fr/espace";

/**
 * L'Espace du mode ambassadeur : où en est ton rôle, et trois tuiles (missions à faire, avis à relire, messages non lus)
 * qui ouvrent leur onglet. Le reste (fondateurs, propositions de lieux, ambassadeur certifié) est sur ambassadeur.sosmiam.fr.
 */
export default function EcranEspaceAmbassadeur() {
  const router = useRouter();
  const { roles, revenirAuModePerso } = utiliserModes();
  const { espace, erreur } = utiliserEspaceAmbassadeur();
  const statut = espace?.statut ?? roles.ambassadeur;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 px-5 pb-10 pt-3">
        <EnTeteMode mode="ambassadeur" titre="Espace" sousTitre="La Brigade veille sur les lieux du coin" />
        {statut ? <CarteStatutAmbassadeur statut={statut} /> : null}

        {statut === "actif" ? (
          espace ? (
            <View className="flex-row gap-3">
              <TuileEspace emoji="🧭" nombre={espace.missionsAFaire} libelle={espace.missionsAFaire > 1 ? "missions à faire" : "mission à faire"} onPress={() => router.navigate("/ambassadeur/missions")} />
              <TuileEspace emoji="🔍" nombre={espace.avisARelire} libelle={espace.avisARelire > 1 ? "avis à relire" : "avis à relire"} onPress={() => router.navigate("/ambassadeur/relectures")} />
              <TuileEspace emoji="📬" nombre={espace.messagesNonLus} libelle={espace.messagesNonLus > 1 ? "messages non lus" : "message non lu"} onPress={() => router.navigate("/ambassadeur/messages")} />
            </View>
          ) : erreur ? (
            <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation(decrireEchecVisite(erreur).texte)}</Text>
          ) : (
            <ActivityIndicator color={couleurs.encre} accessibilityLabel="On ouvre ton espace…" />
          )
        ) : null}

        <View className="gap-3">
          <LigneMonLieu
            emoji="🌐"
            titre="Tout ton espace sur le site"
            detail="Fondateurs de ville, propositions de lieux, ambassadeur certifié : sur ambassadeur.sosmiam.fr"
            onPress={() => void Linking.openURL(SITE_ESPACE)}
          />
        </View>
        <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation("Ton palier et tes points sont sur ton profil, comme d'habitude.")}</Text>
        <Bouton libelle="Revenir à mon SOS Miam" variante="blanc" onPress={revenirAuModePerso} />
      </ScrollView>
    </SafeAreaView>
  );
}
