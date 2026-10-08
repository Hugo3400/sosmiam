import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, ScrollView, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { Bouton } from "~/composants/interface/Bouton";
import { Interrupteur } from "~/composants/interface/Interrupteur";
import { ElementCarte } from "~/composants/lieux/ElementCarte";
import { LieuReserveAdultes } from "~/composants/lieux/LieuReserveAdultes";
import { PastillesSectionsCarte } from "~/composants/lieux/PastillesSectionsCarte";
import { Mascotte } from "~/composants/marque/Mascotte";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { cartesExemples } from "~/contenus/cartes-exemples";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { regimesCarte } from "~/contenus/regimes-carte";
import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { filtrerCarteSelonAge } from "~/fonctions/lieux/filtrer-carte-selon-age";
import { filtrerCarteSelonRegimes } from "~/fonctions/lieux/filtrer-carte-selon-regimes";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import couleurs from "~/theme/couleurs";

// Le temps qu'un défilement lancé par une pastille se termine : pendant ce temps, la pastille touchée reste en avant
const DUREE_DEFILEMENT_GUIDE = 700;

/**
 * La carte complète d'un lieu (« Les formules » pour une sortie) : pastilles pour sauter d'une section à l'autre,
 * sections et leurs éléments, filtre « Seulement ce qui me va » selon les régimes du profil. Sous 18 ans ou âge inconnu
 * (visite sans compte), pas d'alcool (et pas de bar du tout, comme sur la fiche).
 */
export default function CarteDuLieu() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profil } = utiliserProfil();
  const animationsReduites = useReducedMotion();
  const defilement = useRef<ScrollView>(null);
  const titresSections = useRef<(Text | null)[]>([]);
  // Haut de chaque section dans son bloc, et haut de ce bloc dans la page (pour y défiler)
  const positionsSections = useRef<number[]>([]);
  const hautDesSections = useRef(0);
  const finDefilementGuide = useRef(0);
  const [hauteurPastilles, setHauteurPastilles] = useState(0);
  const [active, setActive] = useState(0);
  const [seulementCeQuiMeVa, setSeulementCeQuiMeVa] = useState(false);

  const age = profil ? calculerAge(profil.dateNaissance) : null;
  const lieu = filtrerLieuxSelonAge(lieuxExemples, age).find((l) => String(l.id) === id);
  const carteDuLieu = lieu ? cartesExemples[lieu.id] : undefined;
  const carteAutorisee = carteDuLieu ? filtrerCarteSelonAge(carteDuLieu, age) : null;

  if (!lieu) {
    // Le lieu existe, mais c'est un bar : même mot gentil que sur la fiche
    if (lieuxExemples.some((l) => String(l.id) === id)) return <LieuReserveAdultes />;
    return (
      <EcranReglage titre="Ce lieu n'est pas disponible" sousTitre="Il s'est peut-être éclipsé. Plein d'autres adresses t'attendent dans Explorer !">
        <Bouton libelle="Retour" variante="blanc" onPress={() => router.back()} />
      </EcranReglage>
    );
  }

  const formules = lieu.type === "sortie";
  const titre = formules ? "Les formules" : "La carte";

  if (!carteAutorisee || carteAutorisee.sections.length === 0) {
    return (
      <EcranReglage
        titre={formules ? "Pas encore de formules par ici" : "Pas encore de carte par ici"}
        sousTitre={`${lieu.nom} n'a pas encore mis ${formules ? "ses formules" : "sa carte"} dans l'app. Demande sur place, on te dira tout !`}
      >
        <View className="items-center gap-6">
          <Mascotte expression="surprise" taille={120} />
          <Bouton libelle="Retour à la fiche" variante="blanc" onPress={() => router.back()} />
        </View>
      </EcranReglage>
    );
  }

  // Seuls les régimes que la carte sait reconnaître (végétarien, vegan, sans gluten) font apparaître le filtre
  const regimes = (profil?.envies.regimes ?? []).filter((regime) => regimesCarte[regime] !== undefined);
  const nomsRegimes = regimes.flatMap((regime) => regimesCarte[regime]?.libelle ?? []);
  const listeRegimes = nomsRegimes.length > 1 ? `${nomsRegimes.slice(0, -1).join(", ")} et ${nomsRegimes[nomsRegimes.length - 1]}` : (nomsRegimes[0] ?? "");
  const carte = seulementCeQuiMeVa ? filtrerCarteSelonRegimes(carteAutorisee, regimes) : carteAutorisee;
  const sections = carte.sections;
  const total = carteAutorisee.sections.reduce((somme, section) => somme + section.elements.length, 0);
  const gardes = sections.reduce((somme, section) => somme + section.elements.length, 0);
  const sectionActive = Math.min(active, Math.max(0, sections.length - 1));

  function allerALaSection(index: number) {
    setActive(index);
    const y = positionsSections.current[index];
    if (y === undefined) return;
    finDefilementGuide.current = Date.now() + (animationsReduites ? 100 : DUREE_DEFILEMENT_GUIDE);
    // Le titre de la section s'arrête juste sous les pastilles, qui restent collées en haut
    defilement.current?.scrollTo({ y: Math.max(0, hautDesSections.current + y - hauteurPastilles - 12), animated: !animationsReduites });
    // Le lecteur d'écran reprend au titre de la section, une fois le défilement fini
    setTimeout(() => deplacerFocusLecteurEcran(titresSections.current[index]), animationsReduites ? 100 : 450);
  }

  // Met en avant la pastille de la section qu'on est en train de lire
  function suivreDefilement(evenement: NativeSyntheticEvent<NativeScrollEvent>) {
    if (sections.length < 2 || Date.now() < finDefilementGuide.current) return;
    const { contentOffset, contentSize, layoutMeasurement } = evenement.nativeEvent;
    // Tout en bas, les dernières sections ne peuvent plus monter sous les pastilles : la dernière est celle qu'on lit
    const auBout = contentSize.height > layoutMeasurement.height && contentOffset.y + layoutMeasurement.height >= contentSize.height - 8;
    let lue = 0;
    if (auBout) lue = sections.length - 1;
    else
      sections.forEach((_, index) => {
        const y = positionsSections.current[index];
        if (y !== undefined && hautDesSections.current + y - hauteurPastilles - 24 <= contentOffset.y) lue = index;
      });
    if (lue !== sectionActive) setActive(lue);
  }

  function changerFiltre(valeur: boolean) {
    setSeulementCeQuiMeVa(valeur);
    setActive(0);
  }

  function toutAfficher() {
    changerFiltre(false);
    // « Tout afficher » disparaît : le lecteur d'écran reprend à la première section
    setTimeout(() => deplacerFocusLecteurEcran(titresSections.current[0]), 150);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <View className="min-h-14 flex-row items-center px-5 pb-3 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={12}
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
      </View>

      {/* Le 2e enfant (les pastilles) reste collé en haut pendant qu'on fait défiler la carte */}
      <ScrollView ref={defilement} className="flex-1" contentContainerClassName="pb-8" stickyHeaderIndices={[1]} onScroll={suivreDefilement} scrollEventThrottle={64}>
        <View className="px-5 pb-2">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="font-texte-semi text-base text-gris">
            {lieu.emoji} {lieu.nom}
          </Text>
          <Text accessibilityRole="header" accessibilityLabel={`${titre} de ${lieu.nom}`} className="mt-1 font-titre text-[32px] leading-[36px] text-encre">
            {formules ? "🎟️" : "🍽️"} {titre}
          </Text>
          {regimes.length > 0 ? (
            <View className="mt-3">
              <Interrupteur
                emoji="🥗"
                titre="Seulement ce qui me va"
                detail={
                  seulementCeQuiMeVa
                    ? `${gardes} sur ${total} ${gardes > 1 ? "te vont" : "te va"}, d'après les repères du lieu (${listeRegimes})`
                    : `D'après les repères indiqués par le lieu (${listeRegimes})`
                }
                valeur={seulementCeQuiMeVa}
                onChanger={changerFiltre}
              />
            </View>
          ) : null}
        </View>

        <View onLayout={(evenement) => setHauteurPastilles(evenement.nativeEvent.layout.height)} className={`bg-creme ${sections.length > 1 ? "border-b border-ligne" : ""}`}>
          {sections.length > 1 ? (
            <PastillesSectionsCarte titres={sections.map((section) => section.titre)} active={sectionActive} onChoisir={allerALaSection} />
          ) : null}
        </View>

        <View
          onLayout={(evenement) => {
            hautDesSections.current = evenement.nativeEvent.layout.y;
          }}
          className="gap-7 px-5 pt-4"
        >
          {sections.map((section, index) => (
            <View
              key={`${index}-${section.titre}`}
              onLayout={(evenement) => {
                positionsSections.current[index] = evenement.nativeEvent.layout.y;
              }}
              className="gap-2.5"
            >
              <Text
                ref={(texte) => {
                  titresSections.current[index] = texte;
                }}
                accessibilityRole="header"
                className="font-titre-gras text-[22px] leading-7 text-encre"
              >
                {lierPonctuation(section.titre)}
              </Text>
              <View className="rounded-carte border-2 border-encre bg-white px-5 py-1.5">
                {section.elements.map((element, rang) => (
                  <ElementCarte key={`${rang}-${element.nom}`} element={element} separe={rang > 0} />
                ))}
              </View>
            </View>
          ))}

          {sections.length === 0 ? (
            <View className="items-center gap-4 rounded-carte border-2 border-dashed border-ligne px-6 py-8">
              <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-4xl">🥕</Text>
              <Text className="text-center font-texte text-base leading-6 text-gris">
                {lierPonctuation(`Rien n'est indiqué ${listeRegimes} sur cette carte pour l'instant. Demande sur place : il y a parfois moyen d'adapter un plat !`)}
              </Text>
              <Bouton libelle="Tout afficher" variante="blanc" petit onPress={toutAfficher} />
            </View>
          ) : null}

          <View className="gap-1 pt-1">
            <Text className="text-center font-texte text-sm leading-5 text-gris">
              {lierPonctuation("Prix indicatifs : la carte peut changer, le lieu a toujours le dernier mot. Une allergie ? Signale-la toujours sur place.")}
            </Text>
            {carte.majLe ? <Text className="text-center font-texte text-sm leading-5 text-gris">Mise à jour par le lieu le {formaterDateLongue(carte.majLe)}</Text> : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
