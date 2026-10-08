import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Platform, StyleSheet } from "react-native";
import MapView, { type LatLng, type MapPressEvent } from "react-native-maps";
import { useReducedMotion } from "react-native-reanimated";

import type { PositionLieu } from "@sos-miam/commun/types/lieu";
import { MarqueurLieu } from "~/composants/explorer/MarqueurLieu";
import { centreHerault } from "~/contenus/centres-villes";
import type { LieuExplorer } from "~/fonctions/lieux/trier-lieux-explorer";
import { utiliserGestesStables } from "~/hooks/utiliser-gestes-stables";

type Props = {
  /** Lieux filtrés et triés (seuls ceux qui ont une position s'affichent) */
  lieux: LieuExplorer[];
  /** Ville de la personne, ou centre de l'Hérault */
  centre: PositionLieu;
  /** « Autour de moi » (sinon null) */
  position: PositionLieu | null;
  /** Id du lieu sélectionné */
  selection: number | null;
  onSelection: (id: number | null) => void;
  /** Place prise en haut par la recherche et les filtres (pour cadrer) */
  margeHaut: number;
  /** Place prise en bas par la feuille de liste (pour cadrer) */
  margeBas: number;
};

// Demi-côtés des zones à montrer, en degrés de latitude (0,01° ≈ 1,1 km)
/** Une ville entière */
const DEMI_VILLE = 0.03;
/** Tout l'Hérault de nos lieux, quand ta ville n'est pas une ville de lancement */
const DEMI_HERAULT = 0.4;
/** « Autour de moi » : ton quartier et ceux d'à côté */
const DEMI_AUTOUR = 0.012;
/** Jamais plus serré que ça autour des lieux (un seul lieu ne fait pas zoomer jusqu'au trottoir) */
const DEMI_MIN_LIEUX = 0.004;
/** Lieu sélectionné alors qu'on voit plus large que ça (hauteur visible, en degrés) : on s'approche au lieu de seulement centrer */
const ECART_MAX_SELECTION = 0.25;
const DEMI_SELECTION = 0.01;
/** Avec « Autour de moi », un changement de filtres cadre ta position et les lieux les plus proches */
const PLUS_PROCHES = 5;
/** Espace laissé autour des marqueurs en cadrant (ils font ~60 points de large) */
const MARGE_CADRE = 40;
/** Les marges ne prennent jamais plus que cette part de la hauteur de la carte */
const PART_MAX_MARGES = 0.7;
/** Sur iPhone, toucher un marqueur touche aussi la carte un peu après : ce toucher-là ne désélectionne pas */
const DELAI_APPUI_MARQUEUR = 700;
const DUREE_CENTRAGE = 450;

/** Deux coins opposés d'une zone qui contient tous les points, jamais plus petite qu'un carré de demi-côté « demiMin » */
function coinsAutour(points: LatLng[], demiMin: number): LatLng[] {
  const latitudes = points.map((p) => p.latitude);
  const longitudes = points.map((p) => p.longitude);
  const centre = {
    latitude: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
    longitude: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
  };
  // Un degré de longitude rétrécit loin de l'équateur : on corrige pour garder un carré
  const demiLatitude = Math.max((Math.max(...latitudes) - Math.min(...latitudes)) / 2, demiMin);
  const demiLongitude = Math.max((Math.max(...longitudes) - Math.min(...longitudes)) / 2, demiMin / Math.cos((centre.latitude * Math.PI) / 180));
  return [
    { latitude: centre.latitude + demiLatitude, longitude: centre.longitude - demiLongitude },
    { latitude: centre.latitude - demiLatitude, longitude: centre.longitude + demiLongitude },
  ];
}

function estHerault(point: PositionLieu): boolean {
  return point.latitude === centreHerault.latitude && point.longitude === centreHerault.longitude;
}

/**
 * La carte d'Explorer (iPhone et Android) : Apple Plans sur iPhone, Google Maps sur Android, sans clé à fournir dans Expo Go.
 * Elle remplit son parent ; l'écran pose par-dessus la recherche, les filtres (margeHaut) et la feuille de liste (margeBas).
 * Elle part de ta ville, cadre les lieux quand les filtres changent, ta position quand elle arrive, et va doucement vers le lieu sélectionné.
 */
export function CarteLieux({ lieux, centre, position, selection, onSelection, margeHaut, margeBas }: Props) {
  const carte = useRef<MapView>(null);
  const animationsReduites = useReducedMotion();
  const [chargee, setChargee] = useState(false);
  const [hauteur, setHauteur] = useState(0);
  const [lecteurEcran, setLecteurEcran] = useState(false);
  // Région de départ (avant le premier cadrage) : ta ville, ou tout l'Hérault
  const [regionDepart] = useState(() => {
    const demi = estHerault(centre) ? DEMI_HERAULT : DEMI_VILLE;
    return { ...centre, latitudeDelta: demi * 2, longitudeDelta: (demi * 2) / Math.cos((centre.latitude * Math.PI) / 180) };
  });
  // Les gestes natifs ne sont pas prêts tant que la carte n'est ni chargée ni mesurée (Android plante en cadrant une carte de taille 0)
  const prete = chargee && hauteur > 0;
  const dernierAppuiMarqueur = useRef(0);
  const numeroCentrage = useRef(0);

  // Petit écran ou feuille dépliée : on garde toujours un bout de carte où cadrer
  const reduction = Math.min(1, (hauteur * PART_MAX_MARGES) / Math.max(1, margeHaut + margeBas));
  const haut = Math.round(margeHaut * reduction);
  const bas = Math.round(margeBas * reduction);

  const places = lieux.flatMap(({ lieu }) => (lieu.position ? [{ lieu, position: lieu.position }] : []));
  // Clés indépendantes de l'ordre et des objets : trier par distance (« Autour de moi ») ne recadre pas la carte
  const cleLieux = places
    .map((p) => p.lieu.id)
    .sort((a, b) => a - b)
    .join(",");
  const clePosition = position ? `${position.latitude.toFixed(5)},${position.longitude.toFixed(5)}` : null;
  const cleCentre = `${centre.latitude},${centre.longitude}`;

  // Ce que lisent les cadrages (lancés par les effets, parfois après une attente) : toujours les dernières valeurs.
  // Déclaré avant les autres effets, pour être à jour quand ils passent.
  const etat = useRef({ places, centre, position, haut, bas, hauteur, animationsReduites });
  useEffect(() => {
    etat.current = { places, centre, position, haut, bas, hauteur, animationsReduites };
  });

  // VoiceOver ou TalkBack : les marqueurs reçoivent alors un titre natif, que ces lecteurs savent lire
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
        ? { top: MARGE_CADRE, right: MARGE_CADRE, bottom: MARGE_CADRE, left: MARGE_CADRE }
        : { top: h + MARGE_CADRE, right: MARGE_CADRE, bottom: b + MARGE_CADRE, left: MARGE_CADRE };
    carte.current?.fitToCoordinates(coins, { edgePadding: bords, animated: anime && !reduites });
  }

  /** Amène un lieu au milieu de la partie visible, sans changer le zoom (sauf si on voit tout le département) */
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
      cadrer(coinsAutour([point], DEMI_SELECTION));
      return;
    }
    const { haut: h, bas: b, hauteur: hauteurCarte, animationsReduites: reduites } = etat.current;
    // Sur iPhone, mapPadding ne déplace pas le centre : on décale nous-mêmes vers le milieu de la partie visible
    const decalage = Platform.OS === "ios" && hauteurCarte > 0 ? ((b - h) / 2 / hauteurCarte) * ecart : 0;
    const camera = { center: { latitude: point.latitude - decalage, longitude: point.longitude } };
    if (reduites) carte.current.setCamera(camera);
    else carte.current.animateCamera(camera, { duration: DUREE_CENTRAGE });
  }

  // Ce qu'on a déjà cadré : on ne recadre que quand ça change vraiment
  const vus = useRef({ lieux: cleLieux, position: clePosition, centre: cleCentre });
  const dejaCadree = useRef(false);

  // Premier cadrage, sans animation : ta position si on l'a déjà, sinon ta ville (ou tout l'Hérault)
  useEffect(() => {
    if (!prete || dejaCadree.current) return;
    dejaCadree.current = true;
    const { position: ici, centre: ville } = etat.current;
    cadrer(ici ? coinsAutour([ici], DEMI_AUTOUR) : coinsAutour([ville], estHerault(ville) ? DEMI_HERAULT : DEMI_VILLE), false);
  }, [prete]);

  // Les filtres ont changé : on montre les lieux trouvés (avec « Autour de moi » : toi et les plus proches)
  useEffect(() => {
    const avant = vus.current.lieux;
    vus.current.lieux = cleLieux;
    const { places: trouves, position: ici } = etat.current;
    if (!prete || avant === cleLieux || trouves.length === 0) return;
    const points = ici ? [ici, ...trouves.slice(0, PLUS_PROCHES).map((p) => p.position)] : trouves.map((p) => p.position);
    cadrer(coinsAutour(points, DEMI_MIN_LIEUX));
  }, [prete, cleLieux]);

  // Ta position vient d'arriver (« Autour de moi ») : on la centre, avec ton quartier autour
  useEffect(() => {
    const avant = vus.current.position;
    vus.current.position = clePosition;
    const ici = etat.current.position;
    if (!prete || !ici || avant === clePosition) return;
    cadrer(coinsAutour([ici], DEMI_AUTOUR));
  }, [prete, clePosition]);

  // Ta ville a changé (profil chargé, ville modifiée) : on y retourne, sauf si on suit ta position
  useEffect(() => {
    const avant = vus.current.centre;
    vus.current.centre = cleCentre;
    const { centre: ville, position: ici } = etat.current;
    if (!prete || ici || avant === cleCentre) return;
    cadrer(coinsAutour([ville], estHerault(ville) ? DEMI_HERAULT : DEMI_VILLE));
  }, [prete, cleCentre]);

  // Un lieu sélectionné (sur la carte ou dans la liste) : la carte va doucement vers lui
  useEffect(() => {
    if (!prete || selection === null) return;
    const choisi = etat.current.places.find((p) => p.lieu.id === selection);
    if (choisi) void centrerSur(choisi.position);
  }, [prete, selection]);

  // Les mêmes fonctions d'un rendu à l'autre : les marqueurs mémorisés ne se redessinent pas pour rien
  const gestes = utiliserGestesStables({
    choisir: (id: number) => {
      dernierAppuiMarqueur.current = Date.now();
      onSelection(id);
    },
  });

  function toucherCarte(evenement: MapPressEvent) {
    // Le toucher d'un marqueur remonte parfois jusqu'à la carte (tout de suite, ou un peu après sur iPhone)
    if (evenement.nativeEvent.action === "marker-press") return;
    if (Date.now() - dernierAppuiMarqueur.current < DELAI_APPUI_MARQUEUR) return;
    if (selection !== null) onSelection(null);
  }

  return (
    <MapView
      ref={carte}
      style={StyleSheet.absoluteFill}
      initialRegion={regionDepart}
      mapPadding={{ top: haut, right: 0, bottom: bas, left: 0 }}
      userInterfaceStyle="light"
      showsUserLocation={position !== null}
      userLocationAnnotationTitle="Ta position"
      showsMyLocationButton={false}
      // Les autres restos du fond de carte embrouilleraient les nôtres
      showsPointsOfInterests={false}
      pitchEnabled={false}
      toolbarEnabled={false}
      // Android centrerait la carte à chaque toucher : on le fait déjà, plus doucement
      moveOnMarkerPress={false}
      onMapReady={() => setChargee(true)}
      onLayout={(evenement) => setHauteur(evenement.nativeEvent.layout.height)}
      onPress={toucherCarte}
    >
      {places.map(({ lieu, position: positionLieu }) => (
        <MarqueurLieu
          key={lieu.id}
          lieu={lieu}
          position={positionLieu}
          selectionne={lieu.id === selection}
          lecteurEcran={lecteurEcran}
          onPress={gestes.choisir}
        />
      ))}
    </MapView>
  );
}
