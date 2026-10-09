import { useRouter } from "expo-router";
import { useBottomTabBarHeight } from "expo-router/tabs";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MiniCarteFidelite } from "~/composants/fidelite/MiniCarteFidelite";
import { ApercuVisite } from "~/composants/scan/ApercuVisite";
import { CarteDemandeEnCours } from "~/composants/scan/CarteDemandeEnCours";
import { EnTeteScan } from "~/composants/scan/EnTeteScan";
import { EtapesCommentCaMarche } from "~/composants/scan/EtapesCommentCaMarche";
import { SectionVideScan } from "~/composants/scan/SectionVideScan";
import { TitreSectionScan } from "~/composants/scan/TitreSectionScan";
import { TuileScan } from "~/composants/scan/TuileScan";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserVisites } from "~/hooks/utiliser-visites";
import couleurs from "~/theme/couleurs";

// Dans « Mes visites », seulement les dernières : la liste complète est à un toucher
const VISITES_AFFICHEES = 3;

/**
 * L'onglet Scan pour un inscrit : scanner le QR du comptoir (la grande tuile), demander l'addition, la demande en cours,
 * les cartes de fidélité, les dernières visites et « Comment ça marche ? ». Sans services (version publiée sans API) :
 * seulement l'explication et « Ça arrive avec les comptes ».
 */
export function AccueilScan() {
  const router = useRouter();
  const hauteurBarreOnglets = useBottomTabBarHeight();
  const { pret, source, enCours, visites, cartes } = utiliserVisites();

  const contenu = () => {
    if (source === "indisponible") {
      return (
        <>
          <EnTeteScan demo={false} />
          <View className="items-center gap-3 rounded-carte border-2 border-encre bg-jaune-clair px-5 py-6">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-5xl">
              🛠️
            </Text>
            <Text accessibilityRole="header" className="text-center font-titre-gras text-2xl text-encre">
              Ça arrive avec les comptes
            </Text>
            <Text className="text-center font-texte text-[15px] leading-[22px] text-gris">
              {lierPonctuation("Le scan du comptoir et l'addition dans l'app ouvrent avec les vrais comptes. On peaufine les derniers boulons, promis.")}
            </Text>
          </View>
          <EtapesCommentCaMarche />
        </>
      );
    }

    if (!pret) {
      return (
        <>
          <EnTeteScan demo={source === "demo"} />
          <View className="items-center py-10">
            <ActivityIndicator color={couleurs.encre} accessibilityLabel="On rassemble tes visites…" />
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
        <EnTeteScan demo={source === "demo"} />

        <View className="gap-4">
          <TuileScan
            variante="principale"
            icone="qr-code-outline"
            titre="Scanner le QR du comptoir"
            texte="Tu viens de payer ? Scanne le QR que te montre l'équipe."
            indice="Ouvre l'appareil photo"
            onPress={() => router.push("/scan/camera")}
          />
          <TuileScan
            variante="secondaire"
            icone="receipt-outline"
            titre="Demander l'addition"
            texte="Pas de QR en vue ? Demande-la ici : l'équipe la valide d'un geste."
            onPress={() => router.push("/scan/ou-es-tu")}
          />
        </View>

        {enCours ? <CarteDemandeEnCours visite={enCours} onPress={() => router.push({ pathname: "/visite/[id]", params: { id: String(enCours.id) } })} /> : null}

        <View className="gap-3">
          <TitreSectionScan
            titre="Mes cartes de fidélité"
            libelleLu={`Mes cartes de fidélité, ${cartes.length}`}
            onToutVoir={cartes.length > 0 ? () => router.push("/fidelite") : undefined}
          />
          {cartes.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 pr-5" className="-mr-5">
              {cartes.map((carte) => (
                <MiniCarteFidelite key={carte.lieu.id} carte={carte} onPress={() => router.push({ pathname: "/fidelite/[lieuId]", params: { lieuId: String(carte.lieu.id) } })} />
              ))}
            </ScrollView>
          ) : (
            <SectionVideScan emoji="🎟️" texte="Ta première visite validée pose ton premier tampon. Les cartes se remplissent plus vite qu'un verre en terrasse." />
          )}
        </View>

        <View className="gap-3">
          <TitreSectionScan titre="Mes visites" libelleLu={`Mes visites, ${validees} validée${validees > 1 ? "s" : ""}`} onToutVoir={visites.length > 0 ? () => router.push("/visites") : undefined} />
          {dernieres.length > 0 ? (
            <View className="gap-2">
              {dernieres.map((visite) => (
                <ApercuVisite key={visite.id} visite={visite} onPress={() => router.push({ pathname: "/visite/[id]", params: { id: String(visite.id) } })} />
              ))}
              <Text className="pt-1 font-texte-semi text-sm text-gris">
                {validees} visite{validees > 1 ? "s" : ""} validée{validees > 1 ? "s" : ""} · {points} point{points > 1 ? "s" : ""} gagné{points > 1 ? "s" : ""}
              </Text>
            </View>
          ) : (
            <SectionVideScan emoji="🍽️" texte="Pas encore de visite : ton prochain resto indépendant n'attend que toi (et ton scan)." />
          )}
        </View>

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
