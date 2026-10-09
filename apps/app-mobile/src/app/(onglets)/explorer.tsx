import { useBottomTabBarHeight } from "expo-router/tabs";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Alert, AppState, Keyboard, Linking, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Lieu, PositionLieu } from "@sos-miam/commun/types/lieu";
import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { BarreRechercheExplorer } from "~/composants/explorer/BarreRechercheExplorer";
import { BoutonAutourDeMoi } from "~/composants/explorer/BoutonAutourDeMoi";
import { CarteLieux } from "~/composants/explorer/CarteLieux";
import { FeuilleLieux } from "~/composants/explorer/FeuilleLieux";
import type { ChoixZone } from "~/composants/explorer/FeuilleZoneExplorer";
import { FiltresExplorer } from "~/composants/explorer/FiltresExplorer";
import { RouletteLieux } from "~/composants/explorer/RouletteLieux";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import type { PorteeExplorer, ZonePortee } from "~/contenus/portee-explorer";
import { FILTRES_EXPLORER_PAR_DEFAUT, type FiltresExplorer as ChoixFiltres } from "~/contenus/type-filtres-explorer";
import { calculerCadrePortee } from "~/fonctions/geo/calculer-cadre-portee";
import { direDansRegion } from "~/fonctions/geo/dire-dans-region";
import { trouverRegionFrance } from "~/fonctions/geo/trouver-region-france";
import { trouverVilleFrance } from "~/fonctions/geo/trouver-ville-france";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { estDansPortee } from "~/fonctions/lieux/est-dans-portee";
import { estSosEnCours } from "~/fonctions/lieux/est-sos-en-cours";
import { filtrerLieuxExplorer } from "~/fonctions/lieux/filtrer-lieux-explorer";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { trierLieuxExplorer } from "~/fonctions/lieux/trier-lieux-explorer";
import { eliderDe } from "~/fonctions/texte/elider-de";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserPointDeDepart } from "~/hooks/utiliser-point-de-depart";
import { utiliserPositionActuelle, type ErreurPosition } from "~/hooks/utiliser-position-actuelle";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserRayonExplorer } from "~/hooks/utiliser-rayon-explorer";
import couleurs from "~/theme/couleurs";

// Sur l'aperçu web, pas de carte : la liste prend toute la place
const avecCarte = Platform.OS !== "web";

const messagesPosition: Record<ErreurPosition, string> = {
  refus: "Pas de souci : la liste suit tes envies 💛",
  "refus-definitif": "SOS Miam n'a pas accès à ta position : tu peux l'autoriser dans les réglages du téléphone.",
  // Aucun lien ne mène à cet interrupteur-là : on donne le chemin
  coupee:
    Platform.OS === "ios"
      ? "Ta localisation est éteinte : allume-la dans Réglages > Confidentialité et sécurité > Service de localisation."
      : "Ta localisation est éteinte : allume-la dans les réglages du téléphone (Localisation).",
  introuvable: "On ne te trouve pas pour l'instant : réessaie dans un instant.",
};

/** Après un filtre ou une recherche, le lecteur d'écran dit combien de lieux restent, une fois la frappe calmée (ms) */
const DELAI_ANNONCE_NOMBRE = 700;
const MINUTE = 60_000;

/**
 * Les lieux tels qu'ils sont à cet instant : un SOS dont l'heure de fin est passée disparaît partout (liste, carte, roulette, tri).
 * Toujours de nouveaux objets : les lignes et marqueurs mémorisés se redessinent, et recalculent « Ouvert » / « Fermé ».
 */
function lieuxDuMoment(lieux: Lieu[], maintenant: Date): Lieu[] {
  return lieux.map((lieu) => ({ ...lieu, sos: estSosEnCours(lieu, maintenant) ? lieu.sos : undefined }));
}

/**
 * Onglet « Explorer » : la carte des lieux et une liste qu'on remonte du bas, avec recherche, filtres,
 * les SOS du soir en tête, la roulette et « Autour de moi » (position demandée seulement au toucher).
 * Partout en France : la carte s'ouvre sur ta ville et les distances partent d'elle (ou de ta position avec « Autour de moi »).
 * Jusqu'où on regarde (carte et liste) : à quelques km (5 au départ, réglable de 1 à 50 et gardé), ta région, ou toute la France.
 */
export default function Explorer() {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const hauteurBarreOnglets = useBottomTabBarHeight();
  const { profil } = utiliserProfil();
  const pointDeDepart = utiliserPointDeDepart();
  const { position, recherche, chercher, oublier } = utiliserPositionActuelle();
  const [filtres, setFiltres] = useState<ChoixFiltres>(FILTRES_EXPLORER_PAR_DEFAUT);
  const [portee, setPortee] = useState<PorteeExplorer>("proche");
  const [rayon, changerRayon] = utiliserRayonExplorer();
  const [selection, setSelection] = useState<number | null>(null);
  const [roulette, setRoulette] = useState(false);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const [hauteurEcran, setHauteurEcran] = useState(0);
  const [hauteurEnTete, setHauteurEnTete] = useState(0);
  const [hauteurFeuille, setHauteurFeuille] = useState(0);
  const [hauteurClavier, setHauteurClavier] = useState(0);
  const [maintenant, setMaintenant] = useState(() => new Date());
  const refCompteur = useRef<Text>(null);

  // L'heure avance : « Ouvert maintenant », Ouvert / Fermé et les SOS du soir se recalculent à chaque minute
  // tant que l'onglet est affiché, et dès qu'on revient dans l'app
  useFocusEffect(
    useCallback(() => {
      let minuterie: ReturnType<typeof setTimeout> | undefined;
      const avancer = () => {
        setMaintenant(new Date());
        minuterie = setTimeout(avancer, MINUTE - (Date.now() % MINUTE) + 50);
      };
      avancer();
      const abonnement = AppState.addEventListener("change", (etat) => {
        if (etat === "active") setMaintenant(new Date());
      });
      return () => {
        clearTimeout(minuterie);
        abonnement.remove();
      };
    }, []),
  );

  // Sur iPhone, le clavier ne pousse rien tout seul : la feuille et le cadrage de la carte se posent au-dessus de lui
  useEffect(() => {
    if (Platform.OS !== "ios") return;
    const ouvert = Keyboard.addListener("keyboardWillShow", (e) => setHauteurClavier(e.endCoordinates.height));
    const ferme = Keyboard.addListener("keyboardWillHide", () => setHauteurClavier(0));
    return () => {
      ouvert.remove();
      ferme.remove();
    };
  }, []);

  // Les bars disparaissent sous 18 ans (ou âge inconnu), comme partout dans l'app
  const age = profil ? calculerAge(profil.dateNaissance) : null;
  const lieuxPermis = useMemo(() => filtrerLieuxSelonAge(lieuxExemples, age), [age]);
  const barsPermis = lieuxPermis.length === lieuxExemples.length;
  const villes = useMemo(() => [...new Set(lieuxPermis.map((l) => l.ville))].sort((a, b) => a.localeCompare(b, "fr")), [lieuxPermis]);
  const lieuxActuels = useMemo(() => lieuxDuMoment(lieuxPermis, maintenant), [lieuxPermis, maintenant]);
  // La ville choisie (son centre, sinon l'un de ses lieux), sinon la tienne, où qu'elle soit en France ; null : la carte montre nos lieux
  const centre = useMemo((): PositionLieu | null => {
    if (!filtres.ville) return pointDeDepart;
    const ville = trouverVilleFrance(filtres.ville);
    if (ville) return { latitude: ville.latitude, longitude: ville.longitude };
    return lieuxPermis.find((l) => l.ville === filtres.ville && l.position)?.position ?? null;
  }, [filtres.ville, lieuxPermis, pointDeDepart]);

  // Ta région : celle où tu es (« Autour de moi »), sinon celle de ta ville
  const region = useMemo(() => trouverRegionFrance(position ? null : (profil?.ville ?? null), position ?? pointDeDepart), [position, profil?.ville, pointDeDepart]);
  // Jusqu'où on regarde (carte et liste) ; une ville choisie dans les filtres passe avant (la liste ne garde que ses lieux)
  const zone = useMemo((): ZonePortee | null => {
    if (filtres.ville) return null;
    if (portee === "proche") return { portee, centre: position ?? pointDeDepart, rayonKm: rayon };
    if (portee === "region") return { portee, region };
    return { portee };
  }, [filtres.ville, portee, position, pointDeDepart, rayon, region]);
  const cadre = useMemo(() => (zone ? calculerCadrePortee(zone) : null), [zone]);
  const lieux = useMemo(
    () =>
      trierLieuxExplorer(
        filtrerLieuxExplorer(zone ? lieuxActuels.filter((l) => estDansPortee(l, zone)) : lieuxActuels, filtres, maintenant),
        profil,
        position,
        pointDeDepart,
      ),
    [lieuxActuels, zone, filtres, maintenant, profil, position, pointDeDepart],
  );
  const choixZone = useMemo(
    (): ChoixZone => (filtres.ville ? { portee: null, rayonKm: rayon, ville: filtres.ville } : { portee, rayonKm: rayon, ville: null }),
    [filtres.ville, portee, rayon],
  );
  // SOS d'abord, puis les alertes du soir
  const sos = useMemo(() => lieux.filter(({ lieu }) => lieu.sos || lieu.alerte).sort((a, b) => Number(!!b.lieu.sos) - Number(!!a.lieu.sos)), [lieux]);

  // Un lieu sélectionné que les filtres ont retiré n'est plus sélectionné
  useEffect(() => {
    if (selection !== null && !lieux.some(({ lieu }) => lieu.id === selection)) setSelection(null);
  }, [lieux, selection]);

  // Ce que dira l'annonce du nombre de lieux (lu quand elle part, après l'attente)
  const nombre = useRef({ lieux: lieux.length, recherche: false, sauter: false });
  useEffect(() => {
    nombre.current.lieux = lieux.length;
    nombre.current.recherche = filtres.texte.trim() !== "";
  });
  // Les filtres, la recherche ou la zone ont changé : le lecteur d'écran dit combien de lieux restent (rien au premier affichage)
  const choixAnnonces = useMemo(() => ({ filtres, zone }), [filtres, zone]);
  const filtresAnnonces = useRef(choixAnnonces);
  useEffect(() => {
    if (filtresAnnonces.current === choixAnnonces) return;
    filtresAnnonces.current = choixAnnonces;
    // Effacés depuis la liste vide : le focus passe sur le compteur, qui le dit déjà
    const sauter = nombre.current.sauter;
    nombre.current.sauter = false;
    if (sauter) return;
    const minuterie = setTimeout(() => {
      const { lieux: n, recherche: avecRecherche } = nombre.current;
      const texte = n === 0 ? (avecRecherche ? "Aucun lieu pour cette recherche" : "Aucun lieu avec ces filtres") : `${n} lieu${n > 1 ? "x" : ""}`;
      if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibilityWithOptions(texte, { queue: true });
      else AccessibilityInfo.announceForAccessibility(texte);
    }, DELAI_ANNONCE_NOMBRE);
    return () => clearTimeout(minuterie);
  }, [choixAnnonces]);

  const annoncer = (texte: string) => setAnnonce({ texte, numero: Date.now() });
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const ouvrir = useCallback((id: number) => router.push({ pathname: "/lieu/[id]", params: { id: String(id) } }), [router]);

  async function basculerAutourDeMoi() {
    if (position) return oublier();
    // « Autour de moi » regarde autour de toi, dans le rayon réglé (plus dans une autre ville)
    setPortee("proche");
    setFiltres((f) => (f.ville ? { ...f, ville: null } : f));
    const resultat = await chercher();
    if (!("erreur" in resultat)) return;
    const message = messagesPosition[resultat.erreur];
    if (Platform.OS === "web") return annoncer(message);
    // Un accès refusé pour de bon se règle dans les réglages de l'app : on y emmène
    if (resultat.erreur === "refus-definitif") {
      Alert.alert("Autour de moi", message, [
        { text: "Plus tard", style: "cancel" },
        { text: "Ouvrir les réglages", onPress: () => Linking.openSettings().catch(() => {}) },
      ]);
    } else if (resultat.erreur === "coupee") {
      // La localisation se rallume ailleurs que dans les réglages de l'app : on donne seulement le chemin
      Alert.alert("Autour de moi", message, [{ text: "Compris" }]);
    } else annoncer(message);
  }

  /** Remet les filtres à zéro depuis la liste vide (la recherche aussi si demandé) ; le lecteur d'écran passe sur le compteur */
  function effacer(aussiLaRecherche: boolean) {
    nombre.current.sauter = true;
    setFiltres((f) => ({ ...FILTRES_EXPLORER_PAR_DEFAUT, texte: aussiLaRecherche ? "" : f.texte }));
    setTimeout(() => deplacerFocusLecteurEcran(refCompteur.current), 150);
  }

  // Ce qui est sous la feuille : la barre d'onglets, ou le clavier quand il est ouvert (il la recouvre)
  const bas = Math.max(hauteurBarreOnglets, hauteurClavier);
  const hauteurDisponible = Math.max(0, hauteurEcran - hauteurEnTete - bas - 8);
  const ouOnRegarde = !zone ? null : zone.portee === "proche" ? `à moins de ${rayon} km` : zone.portee === "region" && region ? direDansRegion(region) : "dans toute la France";
  const resume = [ouOnRegarde, position ? "les plus proches d'abord" : profil ? "selon tes envies" : null].filter(Boolean).join(" · ");
  const autourDe = position ? "de toi" : profil?.ville ? eliderDe(profil.ville) : "de ta ville";
  // Liste vide alors qu'on regarde près : on propose de regarder plus loin
  const elargir: { portee: PorteeExplorer; libelle: string } | null = !zone
    ? null
    : zone.portee === "proche"
      ? region
        ? { portee: "region", libelle: "Voir toute ta région" }
        : { portee: "france", libelle: "Voir toute la France" }
      : zone.portee === "region"
        ? { portee: "france", libelle: "Voir toute la France" }
        : null;

  function changerZone(choix: ChoixZone) {
    changerRayon(choix.rayonKm);
    if (choix.ville !== null) {
      setFiltres((f) => ({ ...f, ville: choix.ville }));
      return;
    }
    setPortee(choix.portee);
    setFiltres((f) => (f.ville ? { ...f, ville: null } : f));
  }

  const outils = (
    <View className="flex-row items-center gap-2 px-4 pb-2">
      <View className="flex-1">
        <Text ref={refCompteur} accessibilityRole="header" className="font-titre text-xl text-encre">
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

  // Liste vide : on dit si c'est la recherche ou les filtres qui bloquent. « Effacer les filtres » garde toujours la recherche (comme la pastille).
  const motRecherche = filtres.texte.trim();
  const avecFiltres = filtres.type !== "tous" || filtres.ville !== null || filtres.budgets.length > 0 || filtres.ouvertMaintenant;
  const vide = (
    <View className="items-center gap-3 px-6 py-6">
      <Mascotte expression="surprise" taille={96} />
      <Text className="text-center font-titre text-xl text-encre">Rien par ici…</Text>
      {elargir ? (
        <Text className="text-center font-texte text-base leading-6 text-gris">
          {lierPonctuation(zone?.portee === "proche" ? `Tu regardes à moins de ${rayon} km ${autourDe}.` : `Tu regardes ${ouOnRegarde}.`)}
        </Text>
      ) : null}
      {elargir ? <Bouton libelle={elargir.libelle} petit onPress={() => setPortee(elargir.portee)} /> : null}
      <Text className="text-center font-texte text-base leading-6 text-gris">
        {lierPonctuation(
          !motRecherche
            ? "Aucun lieu avec ces filtres : élargis un peu, la bonne table n'est sûrement pas loin !"
            : avecFiltres
              ? `Rien pour « ${motRecherche} » avec ces filtres : essaie un autre mot ou élargis un peu !`
              : `Rien pour « ${motRecherche} » : essaie un autre mot, la bonne table n'est sûrement pas loin !`,
        )}
      </Text>
      {!motRecherche ? (
        <Bouton libelle="Effacer les filtres" variante="blanc" petit onPress={() => effacer(false)} />
      ) : avecFiltres ? (
        <Bouton libelle="Tout effacer" indice="Efface la recherche et les filtres" variante="blanc" petit onPress={() => effacer(true)} />
      ) : (
        <Bouton libelle="Effacer la recherche" variante="blanc" petit onPress={() => effacer(true)} />
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: couleurs.creme }} onLayout={(e) => setHauteurEcran(e.nativeEvent.layout.height)}>
      {avecCarte ? (
        <CarteLieux
          lieux={lieux}
          centre={centre}
          cadre={cadre}
          position={position}
          selection={selection}
          onSelection={setSelection}
          margeHaut={hauteurEnTete}
          margeBas={hauteurFeuille + bas}
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
        <FiltresExplorer
          filtres={filtres}
          onChange={setFiltres}
          villes={villes}
          barsPermis={barsPermis}
          zone={choixZone}
          region={region}
          autourDe={autourDe}
          onChangerZone={changerZone}
        />
      </View>

      {hauteurDisponible > 0 ? (
        <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom: bas }}>
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
