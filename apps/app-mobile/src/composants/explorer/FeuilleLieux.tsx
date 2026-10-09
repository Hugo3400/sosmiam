import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, FlatList, PanResponder, Pressable, Text, View, type ImageSourcePropType } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

import { CarrouselSos } from "~/composants/explorer/CarrouselSos";
import { LigneLieu } from "~/composants/explorer/LigneLieu";
import { VignetteLieu } from "~/composants/explorer/VignetteLieu";
import { publicationsExemples } from "~/contenus/publications-exemples";
import { formaterDistance } from "~/fonctions/geo/formater-distance";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { estOuvertMaintenant } from "~/fonctions/lieux/est-ouvert-maintenant";
import type { LieuExplorer } from "~/fonctions/lieux/trier-lieux-explorer";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Lieux filtrés et triés */
  lieux: LieuExplorer[];
  /** Parmi eux, ceux en SOS ou en alerte (affichés en carrousel tout en haut) */
  sos: LieuExplorer[];
  /** Lieu sélectionné sur la carte */
  selection: number | null;
  onSelection: (id: number | null) => void;
  /** Ouvre la fiche du lieu */
  onOuvrir: (id: number) => void;
  /** Hauteur maximale de la feuille (de sous les filtres jusqu'au-dessus de la barre d'onglets) */
  hauteurDisponible: number;
  /** Aperçu web, sans carte : la feuille prend toute la hauteur et ne se replie pas */
  pleinEcran: boolean;
  /** Barre d'outils fournie par l'écran (compteur, « Autour de moi », roulette), sous la poignée */
  enTete: ReactNode;
  /** Affiché quand lieux est vide */
  vide: ReactNode;
  /** Hauteur visible actuelle (pour cadrer la carte) */
  onChangerHauteur?: (hauteur: number) => void;
};

type Cran = "carte" | "repliee" | "moitie" | "depliee";

const HAUTEUR_POIGNEE = 44;
/** Carte seule : la feuille n'est plus qu'une barre « 12 lieux · Voir la liste » tout en bas */
const HAUTEUR_CARTE_SEULE = 56;
/** Ce qu'on voit de la liste quand la feuille est repliée : à peu près une ligne */
const HAUTEUR_APERCU = 84;
/** Hauteur de la carte « Sélection » avant qu'on ait pu la mesurer */
const HAUTEUR_SELECTION_ESTIMEE = 96;
/** Déplacement (en points) à partir duquel un toucher devient un glissement de la feuille */
const SEUIL_GLISSEMENT = 6;
/** Élan d'un lancer : on projette la feuille de vitesse × ce temps (ms) avant de choisir où elle s'arrête */
const ELAN = 180;
const DUREE = 280;

const CRAN_SUIVANT: Record<Cran, Cran> = { carte: "repliee", repliee: "moitie", moitie: "depliee", depliee: "repliee" };

/**
 * La feuille de liste d'Explorer, posée en bas sur la carte : quatre hauteurs (carte seule, repliée, moitié, dépliée),
 * qu'on fait glisser par la poignée et l'en-tête (toucher la poignée passe à la suivante ; le bouton ⌄ ne laisse que la
 * carte, avec une barre « Voir la liste » pour revenir). Avec un lecteur d'écran, pas de « carte seule » (la carte lui est cachée).
 * Dedans : le lieu sélectionné sur la carte, « 🛟 SOS ce soir », puis tous les lieux.
 * À poser par l'écran en bas (position absolue, au-dessus de la barre d'onglets) : elle gère elle-même sa hauteur.
 */
export function FeuilleLieux(props: Props) {
  const { lieux, sos, selection, onSelection, onOuvrir, hauteurDisponible, pleinEcran, enTete, vide, onChangerHauteur } = props;
  const animationsReduites = useReducedMotion();
  const { estMasquee } = utiliserActivite();
  const [cran, setCran] = useState<Cran>("moitie");
  const [hauteurEnTete, setHauteurEnTete] = useState(56);
  const [hauteurSelection, setHauteurSelection] = useState(HAUTEUR_SELECTION_ESTIMEE);
  const [lecteurEcran, setLecteurEcran] = useState(false);
  const refListe = useRef<FlatList<LieuExplorer>>(null);
  const refCarteSelection = useRef<View>(null);
  const refPoignee = useRef<View>(null);

  // Une publication signalée ou « Pas intéressé » ne sert pas de vignette (comme dans le profil)
  const vignettes = useMemo(() => {
    const publications = publicationsExemples.filter((p) => !estMasquee(p.id));
    return new Map<number, ImageSourcePropType | null>(lieux.map(({ lieu }) => [lieu.id, trouverVignetteLieu(lieu.id, publications)]));
  }, [lieux, estMasquee]);

  const lieuSelectionne = selection === null ? null : (lieux.find((l) => l.lieu.id === selection) ?? null);

  // Les trois hauteurs : repliée = poignée + en-tête + une ligne (ou la carte « Sélection »), dépliée = toute la place.
  // Avec un lecteur d'écran, la ligne reste visible même sous la carte « Sélection » : il ne parcourt jamais une liste cachée
  const depliee = Math.max(0, hauteurDisponible);
  const repliee = Math.min(
    depliee,
    HAUTEUR_POIGNEE + hauteurEnTete + (lieuSelectionne ? hauteurSelection : 0) + (lecteurEcran || !lieuSelectionne ? HAUTEUR_APERCU : 0),
  );
  const moitie = Math.min(depliee, Math.max(repliee + 80, Math.round(depliee * 0.5)));
  // Avec un lecteur d'écran, « carte seule » vaut « repliée » : il ne reste jamais devant une carte qu'il ne lit pas
  const carte = lecteurEcran ? repliee : Math.min(repliee, HAUTEUR_CARTE_SEULE);
  const hauteurs: Record<Cran, number> = { carte, repliee, moitie, depliee };
  const cible = pleinEcran ? depliee : hauteurs[cran];

  const hauteur = useSharedValue(cible);
  const styleHauteur = useAnimatedStyle(() => ({ height: hauteur.value }));

  // Ce que lisent les gestes (créés une seule fois) : toujours les dernières valeurs
  const etat = useRef({ hauteurs, cran, pleinEcran, lecteurEcran, animationsReduites });
  useEffect(() => {
    etat.current = { hauteurs, cran, pleinEcran, lecteurEcran, animationsReduites };
  });
  const rappelHauteur = useRef(onChangerHauteur);
  useEffect(() => {
    rappelHauteur.current = onChangerHauteur;
  });

  // VoiceOver ou TalkBack allumé : la liste reste défilable même repliée (le lecteur d'écran y fait défiler les lieux qu'il lit)
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setLecteurEcran).catch(() => {});
    const abonnement = AccessibilityInfo.addEventListener("screenReaderChanged", setLecteurEcran);
    return () => abonnement.remove();
  }, []);

  // Dernière hauteur vers laquelle on a lancé la feuille (pour ne pas relancer deux fois la même animation)
  const derniereCible = useRef(cible);
  function animerVers(valeur: number) {
    derniereCible.current = valeur;
    hauteur.value = etat.current.animationsReduites ? valeur : withTiming(valeur, { duration: DUREE, easing: Easing.out(Easing.cubic) });
  }

  // Nouvelle hauteur à atteindre (cran choisi, en-tête mesuré, sélection, rotation…) : la feuille y va, et l'écran le sait
  const enGlissement = useRef(false);
  // (animerVers ne lit que des références et la valeur partagée : seule « cible » compte)
  useEffect(() => {
    if (!enGlissement.current && derniereCible.current !== cible) animerVers(cible);
    rappelHauteur.current?.(cible);
  }, [cible]);

  // Repliée (ou carte seule), on revoit le haut de la liste (le carrousel SOS ou le premier lieu)
  useEffect(() => {
    if (cran === "repliee" || cran === "carte") refListe.current?.scrollToOffset({ offset: 0, animated: false });
  }, [cran]);

  // Un lieu touché sur la carte seule : la feuille remonte juste assez pour montrer sa carte « Sélection »
  useEffect(() => {
    if (selection !== null && etat.current.cran === "carte") {
      animerVers(etat.current.hauteurs.repliee);
      setCran("repliee");
    }
  }, [selection]);

  // Un lieu touché sur la carte : le lecteur d'écran passe sur sa carte « Sélection »
  useEffect(() => {
    if (selection === null) return;
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(refCarteSelection.current), 200);
    return () => clearTimeout(minuterie);
  }, [selection]);

  function choisirCran(suivant: Cran) {
    if (suivant !== etat.current.cran) vibrerLegerement();
    // Toujours relancée d'ici : après un glissement, la feuille revient au cran même s'il n'a pas changé
    animerVers(etat.current.hauteurs[suivant]);
    setCran(suivant);
  }

  // Glisser la feuille : la poignée et l'en-tête toujours, la liste seulement quand elle est repliée (elle ne défile pas alors)
  const glissement = useRef<{ depart: number; actuelle: number } | null>(null);
  // Créés une seule fois : ils lisent l'état du moment dans « etat »
  const [[glissementEnTete, glissementApercu]] = useState(() => {
    const vertical = (dx: number, dy: number) => Math.abs(dy) > SEUIL_GLISSEMENT && Math.abs(dy) > Math.abs(dx);
    const reglages = {
      onPanResponderGrant: () => {
        enGlissement.current = true;
        // Repart de la hauteur affichée, même si la feuille était encore en train de bouger
        const depart = hauteur.value;
        glissement.current = { depart, actuelle: depart };
      },
      onPanResponderMove: (_: unknown, g: { dy: number }) => {
        if (!glissement.current) return;
        const { carte: min, depliee: max } = etat.current.hauteurs;
        const actuelle = Math.min(max, Math.max(min, glissement.current.depart - g.dy));
        glissement.current.actuelle = actuelle;
        hauteur.value = actuelle;
      },
      onPanResponderRelease: (_: unknown, g: { vy: number }) => terminer(g.vy),
      onPanResponderTerminate: (_: unknown, g: { vy: number }) => terminer(g.vy),
    };
    function terminer(vitesse: number) {
      enGlissement.current = false;
      const actuelle = glissement.current?.actuelle ?? etat.current.hauteurs[etat.current.cran];
      glissement.current = null;
      // Vers le bas, la vitesse est positive et la feuille rétrécit
      const projetee = actuelle - vitesse * ELAN;
      const { hauteurs: h } = etat.current;
      const crans: Cran[] = ["carte", "repliee", "moitie", "depliee"];
      const proche = crans.reduce((a, b) => (Math.abs(h[b] - projetee) < Math.abs(h[a] - projetee) ? b : a));
      choisirCran(proche);
    }
    return [
      PanResponder.create({
        ...reglages,
        onMoveShouldSetPanResponder: (_, g) => !etat.current.pleinEcran && vertical(g.dx, g.dy),
        onPanResponderTerminationRequest: () => false,
      }),
      PanResponder.create({
        ...reglages,
        // Capture : un glissement vertical sur l'aperçu replié tire la feuille au lieu d'appuyer sur une ligne
        onMoveShouldSetPanResponderCapture: (_, g) =>
          !etat.current.pleinEcran && !etat.current.lecteurEcran && (etat.current.cran === "repliee" || etat.current.cran === "carte") && vertical(g.dx, g.dy),
        onPanResponderTerminationRequest: () => false,
      }),
    ];
  });

  const deplie = cran === "depliee";
  const carteSeule = cran === "carte" && !lecteurEcran;
  const ouvertSelection = lieuSelectionne ? estOuvertMaintenant(lieuSelectionne.lieu) : false;
  const luSelection = lieuSelectionne
    ? [
        `Sélectionné sur la carte : ${lieuSelectionne.lieu.nom}, ${lieuSelectionne.lieu.info}`,
        `À ${formaterDistance(lieuSelectionne.km)}, ${ouvertSelection ? "ouvert en ce moment" : "fermé en ce moment"}`,
        lieuSelectionne.lieu.sos ? `SOS : ${lieuSelectionne.lieu.sos.places} place${lieuSelectionne.lieu.sos.places > 1 ? "s" : ""} ce soir` : null,
        "Voir la fiche",
      ]
        .filter(Boolean)
        .join(". ")
    : "";

  return (
    <Animated.View style={styleHauteur}>
      <View className={`flex-1 overflow-hidden bg-creme ${pleinEcran ? "" : "rounded-t-3xl border-t-2 border-encre"}`}>
        <View {...(pleinEcran ? {} : glissementEnTete.panHandlers)}>
          {pleinEcran ? (
            <View className="h-2" />
          ) : carteSeule ? (
            <Pressable
              ref={refPoignee}
              accessibilityRole="button"
              accessibilityLabel={`${lieux.length} lieu${lieux.length > 1 ? "x" : ""}, voir la liste`}
              onPress={() => choisirCran("repliee")}
              style={{ height: HAUTEUR_CARTE_SEULE }}
              className="items-center justify-center gap-1.5 active:opacity-60"
            >
              <View className="h-1.5 w-12 rounded-full bg-gris/40" />
              <View className="flex-row items-center gap-1">
                <Ionicons name="chevron-up" size={16} color={couleurs.encre} />
                <Text className="font-texte-gras text-[15px] text-encre">
                  {lieux.length} lieu{lieux.length > 1 ? "x" : ""} · Voir la liste
                </Text>
              </View>
            </Pressable>
          ) : (
            <View>
              <Pressable
                ref={refPoignee}
                accessibilityRole="button"
                accessibilityLabel={deplie ? "Réduire la liste" : "Afficher plus de lieux"}
                accessibilityHint={cran === "repliee" ? "Déplie la liste à moitié" : deplie ? "Replie la liste en bas de l'écran" : "Déplie la liste sur tout l'écran"}
                onPress={() => choisirCran(CRAN_SUIVANT[etat.current.cran])}
                style={{ height: HAUTEUR_POIGNEE }}
                className="items-center justify-center active:opacity-60"
              >
                <View className="h-1.5 w-12 rounded-full bg-gris/40" />
              </Pressable>
              {/* Pas de « carte seule » pour un lecteur d'écran : la carte lui est cachée */}
              {lecteurEcran ? null : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Masquer la liste et ne garder que la carte"
                  hitSlop={4}
                  onPress={() => choisirCran("carte")}
                  className="absolute right-3 top-0 h-11 w-11 items-center justify-center active:opacity-60"
                >
                  <Ionicons name="chevron-down" size={22} color={couleurs.gris} />
                </Pressable>
              )}
            </View>
          )}

          <View onLayout={(e) => setHauteurEnTete(Math.round(e.nativeEvent.layout.height))}>{enTete}</View>

          {lieuSelectionne ? (
            <View onLayout={(e) => setHauteurSelection(Math.round(e.nativeEvent.layout.height))} className="px-4 pb-2">
              <View className="flex-row items-center rounded-carte border-2 border-encre bg-jaune-clair">
                <Pressable
                  ref={refCarteSelection}
                  accessibilityRole="button"
                  accessibilityLabel={luSelection}
                  accessibilityHint="Ouvre la fiche du lieu"
                  onPress={() => {
                    vibrerLegerement();
                    onOuvrir(lieuSelectionne.lieu.id);
                  }}
                  className="min-h-16 flex-1 flex-row items-center gap-3 py-2.5 pl-2.5 active:opacity-70"
                >
                  <VignetteLieu lieu={lieuSelectionne.lieu} image={vignettes.get(lieuSelectionne.lieu.id) ?? null} hauteur={52} arrondi={12} />
                  <View className="flex-1">
                    <Text className="font-texte-semi text-xs text-gris">📍 Sélection · {formaterDistance(lieuSelectionne.km)}</Text>
                    <Text numberOfLines={1} className="font-texte-gras text-base text-encre">{lieuSelectionne.lieu.nom}</Text>
                    <Text className="font-texte-gras text-[13px] text-encre underline">Voir la fiche →</Text>
                  </View>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Retirer la sélection"
                  onPress={() => {
                    onSelection(null);
                    // Le bouton part avec la carte « Sélection » : le lecteur d'écran reprend sur la poignée, juste au-dessus
                    setTimeout(() => deplacerFocusLecteurEcran(refPoignee.current), 150);
                  }}
                  className="h-11 w-11 items-center justify-center active:opacity-60"
                >
                  <Ionicons name="close" size={20} color={couleurs.encre} />
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>

        <View className="flex-1" {...(pleinEcran ? {} : glissementApercu.panHandlers)}>
          <FlatList
            ref={refListe}
            data={lieux}
            keyExtractor={(l) => String(l.lieu.id)}
            extraData={selection}
            scrollEnabled={pleinEcran || lecteurEcran || cran !== "repliee"}
            keyboardShouldPersistTaps="handled"
            // Faire défiler la liste range le clavier de la recherche (sinon il la cache presque entière)
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
            ListHeaderComponent={
              sos.length > 0 ? (
                <View>
                  <CarrouselSos sos={sos} vignettes={vignettes} onOuvrir={onOuvrir} />
                  <Text accessibilityRole="header" className="px-4 pb-1 font-titre-gras text-lg text-encre">Tous les lieux</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={<View className="px-4 py-2">{vide}</View>}
            renderItem={({ item }) => (
              <LigneLieu
                lieu={item.lieu}
                km={item.km}
                image={vignettes.get(item.lieu.id) ?? null}
                selectionne={item.lieu.id === selection}
                onOuvrir={onOuvrir}
              />
            )}
          />
        </View>
      </View>
    </Animated.View>
  );
}
