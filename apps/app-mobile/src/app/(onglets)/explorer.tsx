import { useBottomTabBarHeight } from "expo-router/tabs";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Linking, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { BarreRechercheExplorer } from "~/composants/explorer/BarreRechercheExplorer";
import { BoutonAutourDeMoi } from "~/composants/explorer/BoutonAutourDeMoi";
import { CarteLieux } from "~/composants/explorer/CarteLieux";
import { FeuilleLieux } from "~/composants/explorer/FeuilleLieux";
import { FiltresExplorer } from "~/composants/explorer/FiltresExplorer";
import { RouletteLieux } from "~/composants/explorer/RouletteLieux";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { centreHerault, centresVilles } from "~/contenus/centres-villes";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { FILTRES_EXPLORER_PAR_DEFAUT, type FiltresExplorer as ChoixFiltres } from "~/contenus/type-filtres-explorer";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { filtrerLieuxExplorer } from "~/fonctions/lieux/filtrer-lieux-explorer";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { trierLieuxExplorer } from "~/fonctions/lieux/trier-lieux-explorer";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserPositionActuelle, type ErreurPosition } from "~/hooks/utiliser-position-actuelle";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import couleurs from "~/theme/couleurs";

// Sur l'aperçu web, pas de carte : la liste prend toute la place
const avecCarte = Platform.OS !== "web";

const messagesPosition: Record<ErreurPosition, string> = {
  refus: "Pas de souci : la liste suit tes envies 💛",
  "refus-definitif": "SOS Miam n'a pas accès à ta position : tu peux l'autoriser dans les réglages du téléphone.",
  coupee: "Ta localisation est éteinte : allume-la dans les réglages du téléphone.",
  introuvable: "On ne te trouve pas pour l'instant : réessaie dans un instant.",
};

/**
 * Onglet « Explorer » : la carte des lieux et une liste qu'on remonte du bas, avec recherche, filtres,
 * les SOS du soir en tête, la roulette et « Autour de moi » (position demandée seulement au toucher).
 */
export default function Explorer() {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const hauteurBarreOnglets = useBottomTabBarHeight();
  const { profil } = utiliserProfil();
  const { position, recherche, chercher, oublier } = utiliserPositionActuelle();
  const [filtres, setFiltres] = useState<ChoixFiltres>(FILTRES_EXPLORER_PAR_DEFAUT);
  const [selection, setSelection] = useState<number | null>(null);
  const [roulette, setRoulette] = useState(false);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const [hauteurEcran, setHauteurEcran] = useState(0);
  const [hauteurEnTete, setHauteurEnTete] = useState(0);
  const [hauteurFeuille, setHauteurFeuille] = useState(0);

  // Les bars disparaissent sous 18 ans (ou âge inconnu), comme partout dans l'app
  const age = profil ? calculerAge(profil.dateNaissance) : null;
  const lieuxPermis = useMemo(() => filtrerLieuxSelonAge(lieuxExemples, age), [age]);
  const barsPermis = lieuxPermis.length === lieuxExemples.length;
  const villes = useMemo(() => [...new Set(lieuxPermis.map((l) => l.ville))].sort((a, b) => a.localeCompare(b, "fr")), [lieuxPermis]);
  const lieux = useMemo(() => trierLieuxExplorer(filtrerLieuxExplorer(lieuxPermis, filtres), profil, position), [lieuxPermis, filtres, profil, position]);
  // SOS d'abord, puis les alertes du soir
  const sos = useMemo(() => lieux.filter(({ lieu }) => lieu.sos || lieu.alerte).sort((a, b) => Number(!!b.lieu.sos) - Number(!!a.lieu.sos)), [lieux]);
  const centre = (filtres.ville && centresVilles[filtres.ville]) || (profil && centresVilles[profil.ville]) || centreHerault;

  // Un lieu sélectionné que les filtres ont retiré n'est plus sélectionné
  useEffect(() => {
    if (selection !== null && !lieux.some(({ lieu }) => lieu.id === selection)) setSelection(null);
  }, [lieux, selection]);

  const annoncer = (texte: string) => setAnnonce({ texte, numero: Date.now() });
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const ouvrir = useCallback((id: number) => router.push({ pathname: "/lieu/[id]", params: { id: String(id) } }), [router]);

  async function basculerAutourDeMoi() {
    if (position) return oublier();
    const resultat = await chercher();
    if (!("erreur" in resultat)) return;
    const message = messagesPosition[resultat.erreur];
    // Sur le téléphone, un accès refusé pour de bon ou une localisation éteinte se règlent dans les réglages : on y emmène
    if (Platform.OS !== "web" && (resultat.erreur === "refus-definitif" || resultat.erreur === "coupee")) {
      Alert.alert("Autour de moi", message, [
        { text: "Plus tard", style: "cancel" },
        { text: "Ouvrir les réglages", onPress: () => Linking.openSettings().catch(() => {}) },
      ]);
    } else annoncer(message);
  }

  const hauteurDisponible = Math.max(0, hauteurEcran - hauteurEnTete - hauteurBarreOnglets - 8);
  const resume = position ? "les plus proches d'abord" : profil ? "selon tes envies" : "";

  const outils = (
    <View className="flex-row items-center gap-2 px-4 pb-2">
      <View className="flex-1">
        <Text accessibilityRole="header" className="font-titre text-xl text-encre">
          {lieux.length} lieu{lieux.length > 1 ? "x" : ""}
        </Text>
        {resume ? <Text className="font-texte text-xs text-gris">{resume}</Text> : null}
      </View>
      <BoutonAutourDeMoi actif={position !== null} recherche={recherche} onPress={basculerAutourDeMoi} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Roulette"
        accessibilityHint="Tire un lieu au hasard parmi ceux qui correspondent à tes filtres"
        onPress={() => {
          vibrerLegerement();
          setRoulette(true);
        }}
        className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-jaune active:opacity-80"
      >
        <Text className="text-xl">🎲</Text>
      </Pressable>
    </View>
  );

  const vide = (
    <View className="items-center gap-3 px-6 py-6">
      <Mascotte expression="surprise" taille={96} />
      <Text className="text-center font-titre text-xl text-encre">Rien par ici…</Text>
      <Text className="text-center font-texte text-base leading-6 text-gris">
        {lierPonctuation("Aucun lieu avec ces filtres : élargis un peu, la bonne table n'est sûrement pas loin !")}
      </Text>
      <Bouton libelle="Effacer les filtres" variante="blanc" petit onPress={() => setFiltres(FILTRES_EXPLORER_PAR_DEFAUT)} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: couleurs.creme }} onLayout={(e) => setHauteurEcran(e.nativeEvent.layout.height)}>
      {avecCarte ? (
        <CarteLieux
          lieux={lieux}
          centre={centre}
          position={position}
          selection={selection}
          onSelection={setSelection}
          margeHaut={hauteurEnTete}
          margeBas={hauteurFeuille}
        />
      ) : null}

      {/* Recherche et filtres, posés sur la carte */}
      <View
        pointerEvents="box-none"
        onLayout={(e) => setHauteurEnTete(e.nativeEvent.layout.height)}
        style={{ paddingTop: marges.top + 8 }}
        className="absolute inset-x-0 top-0 gap-2 pb-2"
      >
        <View className="px-4">
          <BarreRechercheExplorer valeur={filtres.texte} onChange={(texte) => setFiltres((f) => ({ ...f, texte }))} />
        </View>
        <FiltresExplorer filtres={filtres} onChange={setFiltres} villes={villes} barsPermis={barsPermis} />
      </View>

      {hauteurDisponible > 0 ? (
        <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom: hauteurBarreOnglets }}>
          <FeuilleLieux
            lieux={lieux}
            sos={sos}
            selection={selection}
            onSelection={setSelection}
            onOuvrir={ouvrir}
            hauteurDisponible={hauteurDisponible}
            pleinEcran={!avecCarte}
            enTete={outils}
            vide={vide}
            onChangerHauteur={setHauteurFeuille}
          />
        </View>
      ) : null}

      <RouletteLieux
        visible={roulette}
        lieux={lieux}
        onFermer={() => setRoulette(false)}
        onOuvrir={(id) => {
          setRoulette(false);
          ouvrir(id);
        }}
      />
      <Annonce annonce={annonce} haut={hauteurEnTete} onFin={finAnnonce} />
    </View>
  );
}
