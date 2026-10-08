import { useRouter } from "expo-router";
import { useBottomTabBarHeight } from "expo-router/tabs";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MiniCarteFidelite } from "~/composants/fidelite/MiniCarteFidelite";
import { ApercuVisite } from "~/composants/scan/ApercuVisite";
import { BandeauDemoVisites } from "~/composants/scan/BandeauDemoVisites";
import { CarteDemandeEnCours } from "~/composants/scan/CarteDemandeEnCours";
import { EtapesCommentCaMarche } from "~/composants/scan/EtapesCommentCaMarche";
import { TuileScan } from "~/composants/scan/TuileScan";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserVisites } from "~/hooks/utiliser-visites";
import couleurs from "~/theme/couleurs";

// Dans « Mes visites », seulement les dernières : la liste complète est à un toucher
const VISITES_AFFICHEES = 3;

/** Le titre d'une section, avec « Tout voir » à droite quand il y a une page complète */
function TitreSection({ titre, libelleLu, onToutVoir }: { titre: string; libelleLu: string; onToutVoir?: () => void }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text accessibilityRole="header" accessibilityLabel={libelleLu} className="font-titre-gras text-xl text-encre">
        {titre}
      </Text>
      {onToutVoir ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Tout voir : ${libelleLu}`}
          hitSlop={8}
          onPress={() => {
            vibrerLegerement();
            onToutVoir();
          }}
          className="min-h-11 justify-center active:opacity-60"
        >
          <Text className="font-texte-gras text-[15px] text-encre underline">Tout voir</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** La carte d'une section encore vide : une phrase qui donne envie, sans culpabiliser */
function SectionVide({ emoji, texte }: { emoji: string; texte: string }) {
  return (
    <View accessible accessibilityLabel={texte} className="flex-row items-center gap-3 rounded-carte border-2 border-dashed border-gris/40 px-4 py-4">
      <Text className="text-2xl">{emoji}</Text>
      <Text className="flex-1 font-texte text-sm leading-5 text-gris">{lierPonctuation(texte)}</Text>
    </View>
  );
}

/** En-tête de l'onglet : le titre, la promesse, et le rappel de démo s'il le faut */
function EnTeteScan({ demo, enPlus }: { demo: boolean; enPlus?: ReactNode }) {
  return (
    <View className="gap-3">
      <View className="gap-1.5">
        <Text accessibilityRole="header" className="font-titre text-4xl text-encre">
          Scan
        </Text>
        <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation("Ta visite compte quand tu paies : c'est ce qui rend les avis vrais.")}</Text>
      </View>
      {demo ? <BandeauDemoVisites /> : null}
      {enPlus}
    </View>
  );
}

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
          <TitreSection
            titre="Mes cartes de fidélité"
            libelleLu={`Mes cartes de fidélité, ${cartes.length}`}
            onToutVoir={cartes.length > 0 ? () => router.push("/fidelite") : undefined}
          />
          {cartes.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 pr-5" className="-mr-5">
              {cartes.map((carte) => (
                <MiniCarteFidelite key={carte.lieu.id} carte={carte} onPress={() => router.push("/fidelite")} />
              ))}
            </ScrollView>
          ) : (
            <SectionVide emoji="🎟️" texte="Ta première visite validée pose ton premier tampon. Les cartes se remplissent plus vite qu'un verre en terrasse." />
          )}
        </View>

        <View className="gap-3">
          <TitreSection titre="Mes visites" libelleLu={`Mes visites, ${validees} validée${validees > 1 ? "s" : ""}`} onToutVoir={visites.length > 0 ? () => router.push("/visites") : undefined} />
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
            <SectionVide emoji="🍽️" texte="Pas encore de visite : ton prochain resto indépendant n'attend que toi (et ton scan)." />
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
