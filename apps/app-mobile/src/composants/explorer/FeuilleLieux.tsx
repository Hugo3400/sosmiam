import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, FlatList, PanResponder, Pressable, Text, View, type ListRenderItem } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

import { CarrouselSos } from "~/composants/explorer/CarrouselSos";
import { LigneLieu } from "~/composants/explorer/LigneLieu";
import { VignetteLieu } from "~/composants/explorer/VignetteLieu";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import { ecrireDistanceDepuis } from "~/fonctions/geo/ecrire-distance-depuis";
import { choisirCranFeuille } from "~/fonctions/interaction/choisir-cran-feuille";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { calculerFenetreListeLieux } from "~/fonctions/lieux/calculer-fenetre-liste-lieux";
import { estOuvertMaintenant } from "~/fonctions/lieux/est-ouvert-maintenant";
import { lireAlcoolLieu } from "~/fonctions/lieux/lire-alcool-lieu";
import type { EtiquetteLieu } from "@sos-miam/commun/types/etiquette";
import type { EvenementLieuPublic } from "@sos-miam/commun/types/evenement";
import type { LieuExplorer } from "~/fonctions/lieux/trier-lieux-explorer";
import { indexerVignettesLieux } from "~/fonctions/publications/indexer-vignettes-lieux";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserPublications } from "~/hooks/utiliser-publications";

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
  /** Filtre « Événements » : l'événement de chaque lieu sur la période, montré dans sa ligne */
  evenements?: Map<number, EvenementLieuPublic> | null;
  depuis: string | null;
  maintenant: Date;
  etiquettesLigne?: (lieuId: number) => readonly EtiquetteLieu[];
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
const DUREE = 280;

const CRAN_SUIVANT: Record<Cran, Cran> = { carte: "repliee", repliee: "moitie", moitie: "depliee", depliee: "repliee" };
const ORDRE_CRANS: readonly Cran[] = ["carte", "repliee", "moitie", "depliee"];
const BORDURE_HAUT = 2;
const MARGE_BAS_LISTE = 24;
const HAUTEUR_EN_TETE_LISTE_ESTIMEE = 300;

const lireCleLieu = (element: LieuExplorer) => String(element.lieu.id);

/**
 * La feuille de liste d'Explorer, posée en bas sur la carte : quatre hauteurs (carte seule, repliée, moitié, dépliée),
 * qu'on fait glisser par la poignée et l'en-tête (toucher la poignée passe à la suivante ; le bouton ⌄ ne laisse que la
 * carte, avec une barre « Voir la liste » pour revenir). Avec un lecteur d'écran, pas de « carte seule » (la carte lui est cachée).
 * Dedans : le lieu sélectionné sur la carte, « 🛟 SOS ce soir », puis tous les lieux.
 * À poser par l'écran en bas (position absolue, au-dessus de la barre d'onglets) : elle gère elle-même sa hauteur.
 */
export function FeuilleLieux(props: Props) {
  const { lieux, sos, selection, onSelection, onOuvrir, hauteurDisponible, pleinEcran, enTete, vide, onChangerHauteur, evenements, depuis, maintenant, etiquettesLigne } = props;
  const couleurs = utiliserCouleurs();
  const animationsReduites = useReducedMotion();
  const { estMasquee } = utiliserActivite();
  const { publications: toutesLesPublications } = utiliserPublications();
  const [cran, setCran] = useState<Cran>("moitie");
  const [hauteurEnTete, setHauteurEnTete] = useState(56);
  const [hauteurSelection, setHauteurSelection] = useState(HAUTEUR_SELECTION_ESTIMEE);
  const [hauteurHaut, setHauteurHaut] = useState(HAUTEUR_POIGNEE + 56);
  const [hauteurEnTeteListe, setHauteurEnTeteListe] = useState(HAUTEUR_EN_TETE_LISTE_ESTIMEE);
  const [lecteurEcran, setLecteurEcran] = useState(false);
  const refListe = useRef<FlatList<LieuExplorer>>(null);
  const refCarteSelection = useRef<View>(null);
  const refPoignee = useRef<View>(null);

  // Une publication signalée ou « Pas intéressé » ne sert pas de vignette (comme dans le profil)
  const vignettes = useMemo(() => indexerVignettesLieux(toutesLesPublications, estMasquee), [toutesLesPublications, estMasquee]);

  const lieuSelectionne = useMemo(() => (selection === null ? null : (lieux.find((l) => l.lieu.id === selection) ?? null)), [lieux, selection]);
  // Un bar ou une offre qui parle d'alcool dans la liste (happy hour…) : le message sanitaire en bas
  const alcool = useMemo(() => lieux.some(({ lieu }) => lireAlcoolLieu(lieu)), [lieux]);

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
  const listeFixe = !pleinEcran && !lecteurEcran;
  const hauteurListe = Math.max(0, depliee - BORDURE_HAUT - hauteurHaut);
  const partieCachee = listeFixe ? Math.max(0, depliee - cible) : 0;
  const margeBasListe = MARGE_BAS_LISTE + partieCachee;
  const hauteurVisibleListe = listeFixe ? hauteurListe : cible - (pleinEcran ? 0 : BORDURE_HAUT) - hauteurHaut;
  const fenetreListe = calculerFenetreListeLieux(hauteurVisibleListe, sos.length > 0 ? hauteurEnTeteListe : 0);

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
  const glissement = useRef<{ depart: number; actuelle: number; cran: Cran } | null>(null);
  // Créés une seule fois : ils lisent l'état du moment dans « etat »
  const [[glissementEnTete, glissementApercu]] = useState(() => {
    const vertical = (dx: number, dy: number) => Math.abs(dy) > SEUIL_GLISSEMENT && Math.abs(dy) > Math.abs(dx);
    const reglages = {
      onPanResponderGrant: () => {
        enGlissement.current = true;
        // Repart de la hauteur affichée, même si la feuille était encore en train de bouger
        const depart = hauteur.value;
        glissement.current = { depart, actuelle: depart, cran: etat.current.cran };
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
      const enCours = glissement.current;
      glissement.current = null;
      const depuis = enCours?.cran ?? etat.current.cran;
      const actuelle = enCours?.actuelle ?? etat.current.hauteurs[depuis];
      choisirCran(choisirCranFeuille(etat.current.hauteurs, ORDRE_CRANS, depuis, actuelle, vitesse));
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

  const renderItem = useCallback<ListRenderItem<LieuExplorer>>(
    ({ item }) => (
      <LigneLieu
        lieu={item.lieu}
        km={item.km}
        depuis={depuis}
        image={vignettes.get(item.lieu.id) ?? null}
        selectionne={item.lieu.id === selection}
        onOuvrir={onOuvrir}
        evenement={evenements?.get(item.lieu.id) ?? null}
        maintenant={maintenant}
        etiquettes={etiquettesLigne?.(item.lieu.id)}
      />
    ),
    [vignettes, selection, onOuvrir, evenements, depuis, maintenant, etiquettesLigne],
  );
  const enTeteListe = useMemo(
    () =>
      sos.length > 0 ? (
        <View onLayout={(e) => setHauteurEnTeteListe(Math.round(e.nativeEvent.layout.height))}>
          <CarrouselSos sos={sos} vignettes={vignettes} onOuvrir={onOuvrir} depuis={depuis} />
          <Text accessibilityRole="header" className="px-4 pb-1 font-titre-gras text-lg text-encre">Tous les lieux</Text>
        </View>
      ) : null,
    [sos, vignettes, onOuvrir, depuis],
  );
  const piedListe = useMemo(() => (alcool ? <View className="px-4 pt-3"><MentionPrevention /></View> : null), [alcool]);
  const styleContenuListe = useMemo(() => ({ paddingBottom: margeBasListe, flexGrow: 1 }), [margeBasListe]);
  const styleListe = useMemo(() => (listeFixe ? { height: hauteurListe } : { flex: 1 }), [listeFixe, hauteurListe]);
  const indicateurListe = useMemo(() => ({ bottom: partieCachee }), [partieCachee]);

  const deplie = cran === "depliee";
  const carteSeule = cran === "carte" && !lecteurEcran;
  const ouvertSelection = lieuSelectionne ? estOuvertMaintenant(lieuSelectionne.lieu, maintenant) : false;
  const distanceSelection = lieuSelectionne && lieuSelectionne.km !== null ? ecrireDistanceDepuis(lieuSelectionne.km, depuis) : null;
  const luSelection = lieuSelectionne
    ? [
        `Sélectionné sur la carte : ${lieuSelectionne.lieu.nom}, ${lieuSelectionne.lieu.info}`,
        `${distanceSelection ? `À ${distanceSelection}, ` : ""}${ouvertSelection ? "ouvert en ce moment" : "fermé en ce moment"}`,
        lieuSelectionne.lieu.sos ? `SOS : ${lieuSelectionne.lieu.sos.places} place${lieuSelectionne.lieu.sos.places > 1 ? "s" : ""} ce soir` : null,
        "Voir la fiche",
      ]
        .filter(Boolean)
        .join(". ")
    : "";

  return (
    <Animated.View style={styleHauteur}>
      <View className={`flex-1 overflow-hidden bg-creme ${pleinEcran ? "" : "rounded-t-3xl border-t-2 border-encre"}`}>
        <View collapsable={false} onLayout={(e) => setHauteurHaut(Math.round(e.nativeEvent.layout.height))} {...(pleinEcran ? {} : glissementEnTete.panHandlers)}>
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
                    <Text className="font-texte-semi text-xs text-gris">📍 Sélection{distanceSelection ? ` · ${distanceSelection}` : ""}</Text>
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

        <View collapsable={false} style={styleListe} {...(pleinEcran ? {} : glissementApercu.panHandlers)}>
          <FlatList
            ref={refListe}
            data={lieux}
            keyExtractor={lireCleLieu}
            extraData={selection}
            scrollEnabled={pleinEcran || lecteurEcran || cran !== "repliee"}
            keyboardShouldPersistTaps="handled"
            // Faire défiler la liste range le clavier de la recherche (sinon il la cache presque entière)
            keyboardDismissMode="on-drag"
            initialNumToRender={8}
            maxToRenderPerBatch={6}
            updateCellsBatchingPeriod={80}
            windowSize={fenetreListe}
            contentContainerStyle={styleContenuListe}
            scrollIndicatorInsets={indicateurListe}
            ListHeaderComponent={enTeteListe}
            ListEmptyComponent={lieux.length === 0 ? <View className="px-4 py-2">{vide}</View> : null}
            ListFooterComponent={piedListe}
            renderItem={renderItem}
          />
        </View>
      </View>
    </Animated.View>
  );
}
