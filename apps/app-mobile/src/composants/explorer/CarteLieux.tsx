import { memo, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Keyboard, Platform, StyleSheet, View } from "react-native";
import MapView, { type LatLng, type MapPressEvent, type Region } from "react-native-maps";
import { useReducedMotion } from "react-native-reanimated";

import type { ZoneGeo } from "@sos-miam/commun/contenus/regions-france";
import { estLieuVerifie } from "@sos-miam/commun/fonctions/lieux/est-lieu-verifie";
import type { Lieu, PositionLieu } from "@sos-miam/commun/types/lieu";
import { MarqueurGroupe } from "~/composants/explorer/MarqueurGroupe";
import { MarqueurLieu } from "~/composants/explorer/MarqueurLieu";
import { MarqueurPosition } from "~/composants/explorer/MarqueurPosition";
import { MARGE_CADRE_CARTE, METRES_PAR_DEGRE, type PointCarte } from "~/contenus/regroupement-carte";
import { calculerCoinsAutour } from "~/fonctions/geo/calculer-coins-autour";
import { calculerDemiCoteRue } from "~/fonctions/geo/calculer-demi-cote-rue";
import { estRegionAssezChangee } from "~/fonctions/geo/est-region-assez-changee";
import { regrouperLieuxCarte } from "~/fonctions/geo/regrouper-lieux-carte";
import { decrireLieuCarte } from "~/fonctions/lieux/decrire-lieu-carte";
import type { LieuExplorer } from "~/fonctions/lieux/trier-lieux-explorer";
import { utiliserGestesStables } from "~/hooks/utiliser-gestes-stables";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTheme } from "~/hooks/utiliser-theme";

type Props = {
  /** Lieux filtrés et triés */
  lieux: LieuExplorer[];
  /** Ville à montrer : celle choisie dans les filtres, sinon la tienne (partout en France) ; null si on ne la connaît pas (on montre alors nos lieux) */
  centre: PositionLieu | null;
  /**
   * La zone choisie (à quelques km, ta région, toute la France), cadrée dès qu'elle change ; sa clé dit quand elle change
   * vraiment. null si on ne sait pas quoi cadrer : la carte cadre alors ta position, ta ville ou nos lieux.
   */
  cadre: (ZoneGeo & { cle: string }) | null;
  /** « Autour de moi » (sinon null) */
  position: PositionLieu | null;
  /** Id du lieu sélectionné */
  selection: number | null;
  onSelection: (id: number | null) => void;
  /** Place prise en haut par la recherche et les filtres (pour cadrer) */
  margeHaut: number;
  /** Place prise en bas par la feuille de liste, la barre d'onglets (ou le clavier) sous elle (pour cadrer) */
  margeBas: number;
};

// Demi-côtés des zones à montrer, en degrés de latitude (0,01° ≈ 1,1 km)
/** Une ville entière (au moins, autour de nos lieux quand on ne connaît pas ta ville) */
const DEMI_VILLE = 0.03;
/** « Autour de moi » : ton quartier et ceux d'à côté */
const DEMI_AUTOUR = 0.012;
/** Jamais plus serré que ça autour des lieux (un seul lieu ne fait pas zoomer jusqu'au trottoir) */
const DEMI_MIN_LIEUX = 0.004;
/** Lieu sélectionné alors qu'on voit plus large que ça (hauteur visible, en degrés) : on s'approche au lieu de seulement centrer */
const ECART_MAX_SELECTION = 0.25;
const DEMI_SELECTION = 0.01;
/** Avec « Autour de moi », un changement de filtres cadre ta position et les lieux les plus proches */
const PLUS_PROCHES = 5;
/** Les marges ne prennent jamais plus que cette part de la hauteur de la carte */
const PART_MAX_MARGES = 0.7;
/** Sur iPhone, toucher un marqueur touche aussi la carte un peu après : ce toucher-là ne désélectionne pas */
const DELAI_APPUI_MARQUEUR = 700;
const DUREE_CENTRAGE = 450;
/** Toute la France, si on n'a ni ta ville ni aucun lieu à montrer */
const REGION_FRANCE = { latitude: 46.6, longitude: 2.4, latitudeDelta: 10, longitudeDelta: 12 };

/** Les deux coins opposés d'un rectangle (nord-ouest, sud-est) */
function coinsZone(z: ZoneGeo): LatLng[] {
  return [
    { latitude: z.nord, longitude: z.ouest },
    { latitude: z.sud, longitude: z.est },
  ];
}

/** Ce qu'on montre sans « Autour de moi » ni filtre qui vient de changer : la ville, sinon tous nos lieux (null s'il n'y a rien à montrer) */
function zoneVille(ville: PositionLieu | null, places: { position: PositionLieu }[]): LatLng[] | null {
  if (ville) return calculerCoinsAutour([ville], DEMI_VILLE);
  return places.length > 0 ? calculerCoinsAutour(places.map((p) => p.position), DEMI_VILLE) : null;
}

/**
 * La carte d'Explorer (iPhone et Android) : Apple Plans sur iPhone, Google Maps sur Android, sans clé à fournir dans Expo Go.
 * Elle remplit son parent ; l'écran pose par-dessus la recherche, les filtres (margeHaut) et la feuille de liste (margeBas).
 * Elle part de la zone choisie (sinon ta ville ou nos lieux), la recadre quand elle change (rayon, région, France, ta position
 * qui arrive), cadre les lieux trouvés quand les filtres changent, et va doucement vers le lieu sélectionné.
 */
export const CarteLieux = memo(function CarteLieux({ lieux, centre, cadre, position, selection, onSelection, margeHaut, margeBas }: Props) {
  const { schema } = utiliserTheme();
  const { langue } = utiliserLangue();
  const carte = useRef<MapView>(null);
  const animationsReduites = useReducedMotion();
  const [chargee, setChargee] = useState(false);
  const [hauteur, setHauteur] = useState(0);
  const [largeur, setLargeur] = useState(0);
  const [lecteurEcran, setLecteurEcran] = useState(false);
  // Les gestes natifs ne sont pas prêts tant que la carte n'est ni chargée ni mesurée (Android plante en cadrant une carte de taille 0)
  const prete = chargee && hauteur > 0;
  const dernierAppuiMarqueur = useRef(0);
  const numeroCentrage = useRef(0);

  // Petit écran ou feuille dépliée : on garde toujours un bout de carte où cadrer
  const reduction = Math.min(1, (hauteur * PART_MAX_MARGES) / Math.max(1, margeHaut + margeBas));
  const haut = Math.round(margeHaut * reduction);
  const bas = Math.round(margeBas * reduction);

  const places = useMemo(() => lieux.flatMap(({ lieu }) => (lieu.position ? [{ lieu, position: lieu.position }] : [])), [lieux]);
  // Clés indépendantes de l'ordre et des objets : trier par distance (« Autour de moi ») ne recadre pas la carte
  const cleLieux = useMemo(
    () =>
      places
        .map((p) => p.lieu.id)
        .sort((a, b) => a - b)
        .join(","),
    [places],
  );
  const parId = useMemo(() => new Map<number, Lieu>(places.map((p) => [p.lieu.id, p.lieu])), [places]);
  const points = useMemo(
    (): PointCarte[] =>
      places.map((p) => ({ id: p.lieu.id, latitude: p.position.latitude, longitude: p.position.longitude, prioritaire: !!p.lieu.sos || !!p.lieu.alerte })),
    [places],
  );
  const clePosition = position ? `${position.latitude.toFixed(5)},${position.longitude.toFixed(5)}` : null;
  const cleCentre = centre ? `${centre.latitude},${centre.longitude}` : null;
  const cleCadre = cadre?.cle ?? null;

  // Région de départ (avant le premier cadrage) : la zone choisie, sinon ta ville, sinon nos lieux
  const [regionDepart] = useState(() => {
    const coins = cadre ? coinsZone(cadre) : zoneVille(centre, places);
    if (!coins) return REGION_FRANCE;
    const [nordOuest, sudEst] = coins;
    return {
      latitude: (nordOuest.latitude + sudEst.latitude) / 2,
      longitude: (nordOuest.longitude + sudEst.longitude) / 2,
      latitudeDelta: nordOuest.latitude - sudEst.latitude,
      longitudeDelta: sudEst.longitude - nordOuest.longitude,
    };
  });

  // Ce que lisent les cadrages (lancés par les effets, parfois après une attente) : toujours les dernières valeurs.
  // Déclaré avant les autres effets, pour être à jour quand ils passent.
  const etat = useRef({ places, centre, cadre, position, haut, bas, hauteur, largeur, animationsReduites });
  useEffect(() => {
    etat.current = { places, centre, cadre, position, haut, bas, hauteur, largeur, animationsReduites };
  });

  const [regionVue, setRegionVue] = useState<Region>(regionDepart);
  const regroupement = useMemo(
    () => regrouperLieuxCarte(points, regionVue, { largeur, hauteur }, selection),
    [points, regionVue, largeur, hauteur, selection],
  );

  function suivreRegion(region: Region) {
    if (estRegionAssezChangee(regionVue, region, regroupement.marge)) setRegionVue(region);
  }

  // VoiceOver ou TalkBack : la carte leur est cachée (voir plus bas)
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isScreenReaderEnabled()
      .then((oui) => {
        if (active) setLecteurEcran(oui);
      })
      .catch(() => {});
    const abonnement = AccessibilityInfo.addEventListener("screenReaderChanged", setLecteurEcran);
    return () => {
      active = false;
      abonnement.remove();
    };
  }, []);

  /** Montre ces coins dans la partie visible de la carte (entre les filtres et la feuille) */
  function cadrer(coins: LatLng[], anime = true) {
    const { haut: h, bas: b, animationsReduites: reduites } = etat.current;
    // Android décale déjà le cadrage de mapPadding ; Apple Plans non : on lui donne les marges en plus
    const bords =
      Platform.OS === "android"
        ? { top: MARGE_CADRE_CARTE, right: MARGE_CADRE_CARTE, bottom: MARGE_CADRE_CARTE, left: MARGE_CADRE_CARTE }
        : { top: h + MARGE_CADRE_CARTE, right: MARGE_CADRE_CARTE, bottom: b + MARGE_CADRE_CARTE, left: MARGE_CADRE_CARTE };
    carte.current?.fitToCoordinates(coins, { edgePadding: bords, animated: anime && !reduites });
  }

  /** Amène un lieu au milieu de la partie visible, sans changer le zoom (sauf si on voit toute une région) */
  async function centrerSur(point: LatLng) {
    const numero = ++numeroCentrage.current;
    let ecart: number | null = null;
    try {
      const bornes = await carte.current?.getMapBoundaries();
      if (bornes) ecart = Math.abs(bornes.northEast.latitude - bornes.southWest.latitude);
    } catch {
      ecart = null;
    }
    // Un autre lieu a été choisi entre-temps, ou l'écran est parti
    if (numero !== numeroCentrage.current || !carte.current) return;
    if (ecart === null || ecart > ECART_MAX_SELECTION) {
      cadrer(calculerCoinsAutour([point], DEMI_SELECTION));
      return;
    }
    const { haut: h, bas: b, hauteur: hauteurCarte, animationsReduites: reduites } = etat.current;
    // Sur iPhone, mapPadding ne déplace pas le centre : on décale nous-mêmes vers le milieu de la partie visible
    const decalage = Platform.OS === "ios" && hauteurCarte > 0 ? ((b - h) / 2 / hauteurCarte) * ecart : 0;
    const camera = { center: { latitude: point.latitude - decalage, longitude: point.longitude } };
    if (reduites) carte.current.setCamera(camera);
    else carte.current.animateCamera(camera, { duration: DUREE_CENTRAGE });
  }

  // Ce qu'on a déjà cadré (null avant le premier cadrage) : on ne recadre que quand ça change vraiment
  const vus = useRef<{ lieux: string; position: string | null; centre: string | null; cadre: string | null } | null>(null);

  // Un seul cadrage par changement, le plus utile : la zone choisie quand elle change (rayon, région, France, ou son centre :
  // ta position qui arrive, ta ville) ; sinon ta position quand elle arrive ; sinon les lieux trouvés quand les filtres
  // changent (on montre les résultats, jamais une autre ville par-dessus) ; sinon la ville, quand elle change toute seule.
  useEffect(() => {
    if (!prete) return;
    const avant = vus.current;
    vus.current = { lieux: cleLieux, position: clePosition, centre: cleCentre, cadre: cleCadre };
    const { places: trouves, position: ici, centre: ville, cadre: zone } = etat.current;
    // Premier cadrage, sans animation : la zone choisie, sinon ta position si on l'a déjà, sinon ta ville (ou nos lieux)
    if (!avant) {
      const coins = zone ? coinsZone(zone) : ici ? calculerCoinsAutour([ici], DEMI_AUTOUR) : zoneVille(ville, trouves);
      if (coins) cadrer(coins, false);
      return;
    }
    if (zone && avant.cadre !== cleCadre) {
      cadrer(coinsZone(zone));
    } else if (ici && avant.position !== clePosition) {
      cadrer(calculerCoinsAutour([ici], DEMI_AUTOUR));
    } else if (avant.lieux !== cleLieux && trouves.length > 0) {
      const points = ici ? [ici, ...trouves.slice(0, PLUS_PROCHES).map((p) => p.position)] : trouves.map((p) => p.position);
      cadrer(calculerCoinsAutour(points, DEMI_MIN_LIEUX));
    } else if (avant.centre !== cleCentre && !ici) {
      // Sauf si on suit ta position (« Autour de moi »)
      const coins = zoneVille(ville, trouves);
      if (coins) cadrer(coins);
    }
  }, [prete, cleLieux, clePosition, cleCentre, cleCadre]);

  // Un lieu sélectionné (sur la carte ou dans la liste) : la carte va doucement vers lui
  useEffect(() => {
    if (!prete || selection === null) return;
    const choisi = etat.current.places.find((p) => p.lieu.id === selection);
    if (choisi) void centrerSur(choisi.position);
  }, [prete, selection]);

  // Les mêmes fonctions d'un rendu à l'autre : les marqueurs mémorisés ne se redessinent pas pour rien
  const gestes = utiliserGestesStables({
    choisir: (id: number) => {
      Keyboard.dismiss();
      dernierAppuiMarqueur.current = Date.now();
      onSelection(id);
    },
    ouvrirGroupe: (cle: string) => {
      Keyboard.dismiss();
      dernierAppuiMarqueur.current = Date.now();
      const groupe = regroupement.groupes.find((g) => g.cle === cle);
      const membres = groupe ? groupe.ids.flatMap((id) => parId.get(id)?.position ?? []) : [];
      if (membres.length === 0) return;
      const { haut: h, bas: b, hauteur: hauteurCarte, largeur: largeurCarte } = etat.current;
      const cote = Math.min(largeurCarte - MARGE_CADRE_CARTE * 2, hauteurCarte - h - b - MARGE_CADRE_CARTE * 2);
      const metresParPoint = (regionVue.longitudeDelta / Math.max(1, largeurCarte)) * METRES_PAR_DEGRE * Math.cos((regionVue.latitude * Math.PI) / 180);
      cadrer(calculerCoinsAutour(membres, calculerDemiCoteRue(cote, metresParPoint)));
    },
  });

  const marqueurs = useMemo(
    () => [
      ...regroupement.seuls.flatMap((seul) => {
        const lieu = parId.get(seul.id);
        if (!lieu) return [];
        return [
          <MarqueurLieu
            key={seul.id}
            id={seul.id}
            emoji={lieu.emoji}
            latitude={seul.latitude}
            longitude={seul.longitude}
            sos={!!lieu.sos}
            alerte={!!lieu.alerte}
            verifie={estLieuVerifie(lieu)}
            libelle={decrireLieuCarte(lieu, langue)}
            selectionne={seul.id === selection}
            onPress={gestes.choisir}
          />,
        ];
      }),
      ...regroupement.groupes.map((groupe) => (
        <MarqueurGroupe
          key={groupe.cle}
          cle={groupe.cle}
          nombre={groupe.nombre}
          latitude={groupe.latitude}
          longitude={groupe.longitude}
          devant={!!groupe.devant}
          onPress={gestes.ouvrirGroupe}
        />
      )),
    ],
    [regroupement, parId, selection, gestes, langue],
  );

  function toucherCarte(evenement: MapPressEvent) {
    // Toucher la carte referme le clavier de la recherche
    Keyboard.dismiss();
    // Le toucher d'un marqueur remonte parfois jusqu'à la carte (tout de suite, ou un peu après sur iPhone)
    if (evenement.nativeEvent.action === "marker-press") return;
    if (Date.now() - dernierAppuiMarqueur.current < DELAI_APPUI_MARQUEUR) return;
    if (selection !== null) onSelection(null);
  }

  return (
    // Avec VoiceOver ou TalkBack, la carte est cachée : ses marqueurs restaient lus sous la feuille et la barre d'onglets,
    // et la liste donne déjà chaque lieu (le toucher ouvre sa fiche)
    <View
      style={StyleSheet.absoluteFill}
      accessibilityElementsHidden={lecteurEcran}
      importantForAccessibility={lecteurEcran ? "no-hide-descendants" : "auto"}
    >
      <MapView
        ref={carte}
        style={StyleSheet.absoluteFill}
        initialRegion={regionDepart}
        mapPadding={{ top: haut, right: 0, bottom: bas, left: 0 }}
        userInterfaceStyle={schema === "sombre" ? "dark" : "light"}
        // Pas de point bleu natif : il suivrait ta position en continu ; on pose la position lue une fois (MarqueurPosition)
        showsUserLocation={false}
        showsMyLocationButton={false}
        // Les autres restos du fond de carte embrouilleraient les nôtres
        showsPointsOfInterests={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        // Android centrerait la carte à chaque toucher : on le fait déjà, plus doucement
        moveOnMarkerPress={false}
        onMapReady={() => setChargee(true)}
        onLayout={(evenement) => {
          setHauteur(evenement.nativeEvent.layout.height);
          setLargeur(evenement.nativeEvent.layout.width);
        }}
        onRegionChangeComplete={suivreRegion}
        onPress={toucherCarte}
      >
        {position ? <MarqueurPosition position={position} /> : null}
        {marqueurs}
      </MapView>
    </View>
  );
});
