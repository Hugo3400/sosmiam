import { useRouter } from "expo-router";
import { useBottomTabBarHeight } from "expo-router/tabs";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MiniCarteFidelite } from "~/composants/fidelite/MiniCarteFidelite";
import { SectionReservationsScan } from "~/composants/reservations/SectionReservationsScan";
import { ApercuVisite } from "~/composants/scan/ApercuVisite";
import { CarteDemandeEnCours } from "~/composants/scan/CarteDemandeEnCours";
import { EnTeteScan } from "~/composants/scan/EnTeteScan";
import { EtapesCommentCaMarche } from "~/composants/scan/EtapesCommentCaMarche";
import { SectionVideScan } from "~/composants/scan/SectionVideScan";
import { TitreSectionScan } from "~/composants/scan/TitreSectionScan";
import { TuileScan } from "~/composants/scan/TuileScan";
import { TEXTES_SCAN_PAR_LANGUE } from "~/contenus/textes-scan";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { utiliserVisites } from "~/hooks/utiliser-visites";

// Dans « Mes visites », seulement les dernières : la liste complète est à un toucher
const VISITES_AFFICHEES = 3;

/**
 * L'onglet Scan pour un inscrit : scanner le QR du comptoir (la grande tuile), demander l'addition, la demande en cours,
 * les cartes de fidélité, les dernières visites et « Comment ça marche ? ». Sans services (version publiée sans API) :
 * seulement l'explication et « Ça arrive avec les comptes ».
 */
export function AccueilScan() {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_SCAN_PAR_LANGUE);
  const router = useRouter();
  const hauteurBarreOnglets = useBottomTabBarHeight();
  const { pret, source, enCours, visites, cartes, reservations } = utiliserVisites();

  const contenu = () => {
    if (source === "indisponible") {
      return (
        <>
          <EnTeteScan />
          <View className="items-center gap-3 rounded-carte border-2 border-encre bg-jaune-clair px-5 py-6">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-5xl">
              🛠️
            </Text>
            <Text accessibilityRole="header" className="text-center font-titre-gras text-2xl text-encre">
              {T.indisponibleTitre}
            </Text>
            <Text className="text-center font-texte text-[15px] leading-[22px] text-gris">
              {lierPonctuation(T.indisponibleTexte)}
            </Text>
          </View>
          <EtapesCommentCaMarche />
        </>
      );
    }

    if (!pret) {
      return (
        <>
          <EnTeteScan />
          <View className="items-center py-10">
            <ActivityIndicator color={couleurs.encre} accessibilityLabel={T.chargement} />
          </View>
        </>
      );
    }

    const dernieres = visites.slice(0, VISITES_AFFICHEES);
    const validees = visites.filter((v) => v.statut === "validee").length;
    // Seulement les points de ces visites (les avis avec photo ont leur propre ligne ailleurs)
    const points = visites.reduce((total, v) => total + (v.statut === "validee" ? v.points : 0), 0);

    return (
      <>
        <EnTeteScan />

        <View className="gap-4">
          <TuileScan
            variante="principale"
            icone="qr-code-outline"
            titre={T.scannerTitre}
            texte={T.scannerTexte}
            indice={T.scannerIndice}
            onPress={() => router.push("/scan/camera")}
          />
          <TuileScan
            variante="secondaire"
            icone="receipt-outline"
            titre={T.additionTitre}
            texte={T.additionTexte}
            onPress={() => router.push("/scan/ou-es-tu")}
          />
        </View>

        {enCours ? <CarteDemandeEnCours visite={enCours} onPress={() => router.push({ pathname: "/visite/[id]", params: { id: String(enCours.id) } })} /> : null}

        <View className="gap-3">
          <TitreSectionScan
            titre={T.cartesTitre}
            libelleLu={T.cartesLu(cartes.length)}
            onToutVoir={cartes.length > 0 ? () => router.push("/fidelite") : undefined}
          />
          {cartes.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 pr-5" className="-mr-5">
              {cartes.map((carte) => (
                <MiniCarteFidelite key={carte.lieu.id} carte={carte} onPress={() => router.push({ pathname: "/fidelite/[lieuId]", params: { lieuId: String(carte.lieu.id) } })} />
              ))}
            </ScrollView>
          ) : (
            <SectionVideScan emoji="🎟️" texte={T.cartesVide} />
          )}
        </View>

        <View className="gap-3">
          <TitreSectionScan titre={T.visitesTitre} libelleLu={T.visitesLu(validees)} onToutVoir={visites.length > 0 ? () => router.push("/visites") : undefined} />
          {dernieres.length > 0 ? (
            <View className="gap-2">
              {dernieres.map((visite) => (
                <ApercuVisite key={visite.id} visite={visite} onPress={() => router.push({ pathname: "/visite/[id]", params: { id: String(visite.id) } })} />
              ))}
              <Text className="pt-1 font-texte-semi text-sm text-gris">
                {T.visitesResume(validees, points)}
              </Text>
            </View>
          ) : (
            <SectionVideScan emoji="🍽️" texte={T.visitesVide} />
          )}
        </View>

        <SectionReservationsScan reservations={reservations} />

        <EtapesCommentCaMarche />
      </>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
      <ScrollView contentContainerClassName="gap-7 px-5 pt-4" contentContainerStyle={{ paddingBottom: hauteurBarreOnglets + 28 }}>
        {contenu()}
      </ScrollView>
    </SafeAreaView>
  );
}
