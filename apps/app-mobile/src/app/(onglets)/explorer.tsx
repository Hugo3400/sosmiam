import { useBottomTabBarHeight } from "expo-router/tabs";
import { useFocusEffect, useIsFocused, useRouter } from "expo-router";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, AppState, Keyboard, Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { PositionLieu } from "@sos-miam/commun/types/lieu";
import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { BarreRechercheExplorer } from "~/composants/explorer/BarreRechercheExplorer";
import { CarteLieux } from "~/composants/explorer/CarteLieux";
import { FeuilleLieux } from "~/composants/explorer/FeuilleLieux";
import type { ChoixZone } from "~/composants/explorer/FeuilleZoneExplorer";
import { FiltresExplorer } from "~/composants/explorer/FiltresExplorer";
import { OutilsListeExplorer } from "~/composants/explorer/OutilsListeExplorer";
import { RouletteLieux } from "~/composants/explorer/RouletteLieux";
import { VideExplorer } from "~/composants/explorer/VideExplorer";
import { Annonce } from "~/composants/interface/Annonce";
import { RAYON_PROCHE_KM, type PorteeExplorer, type ZonePortee } from "~/contenus/portee-explorer";
import { FILTRES_EXPLORER_PAR_DEFAUT, type FiltresExplorer as ChoixFiltres } from "~/contenus/type-filtres-explorer";
import { alerterErreurPosition } from "~/fonctions/geo/alerter-erreur-position";
import { calculerCadrePortee } from "~/fonctions/geo/calculer-cadre-portee";
import { calculerZoneAutour } from "~/fonctions/geo/calculer-zone-autour";
import { decrireZoneRegardee } from "~/fonctions/geo/decrire-zone-regardee";
import { ecrireDepuisVille } from "~/fonctions/geo/ecrire-depuis-ville";
import { ecrireErreurPosition } from "~/fonctions/geo/ecrire-erreur-position";
import { ecrireRepliDistances } from "~/fonctions/geo/ecrire-repli-distances";
import { trouverRegionFrance } from "~/fonctions/geo/trouver-region-france";
import { trouverVilleFrance } from "~/fonctions/geo/trouver-ville-france";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { calculerKmLieu } from "~/fonctions/lieux/calculer-km-lieu";
import { ecrireCleSosFinis } from "~/fonctions/lieux/ecrire-cle-sos-finis";
import { estDansPortee } from "~/fonctions/lieux/est-dans-portee";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { filtrerLieuxTriesExplorer } from "~/fonctions/lieux/filtrer-lieux-tries-explorer";
import { retirerSosFinis } from "~/fonctions/lieux/retirer-sos-finis";
import { trierLieuxExplorer } from "~/fonctions/lieux/trier-lieux-explorer";
import { eliderDe } from "~/fonctions/texte/elider-de";
import { utiliserEvenementsExplorer } from "~/hooks/utiliser-evenements-explorer";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { DEPUIS_TOI } from "~/hooks/utiliser-origine-distances";
import { utiliserPointDeDepart } from "~/hooks/utiliser-point-de-depart";
import { utiliserPositionActuelle } from "~/hooks/utiliser-position-actuelle";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserRayonExplorer } from "~/hooks/utiliser-rayon-explorer";
import couleurs from "~/theme/couleurs";

// Sur l'aperçu web, pas de carte : la liste prend toute la place
const avecCarte = Platform.OS !== "web";

/** Après un filtre ou une recherche, le lecteur d'écran dit combien de lieux restent, une fois la frappe calmée (ms) */
const DELAI_ANNONCE_NOMBRE = 700;
const MINUTE = 60_000;
const comparerVilles = new Intl.Collator("fr").compare;

function lireMinute(): Date {
  const instant = Date.now();
  return new Date(instant - (instant % MINUTE));
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
  const focus = useIsFocused();
  const { profil } = utiliserProfil();
  const pointDeDepart = utiliserPointDeDepart();
  const { position, approximative, recherche, chercher, oublier, oublisApresAbsence } = utiliserPositionActuelle();
  const [filtres, setFiltres] = useState<ChoixFiltres>(FILTRES_EXPLORER_PAR_DEFAUT);
  const [porteeChoisie, setPorteeChoisie] = useState<PorteeExplorer | null>(null);
  const [porteeAvantAutour, setPorteeAvantAutour] = useState<{ portee: PorteeExplorer | null } | null>(null);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const [oublisDits, setOublisDits] = useState(oublisApresAbsence);
  const [avisApproximativeVu, setAvisApproximativeVu] = useState(false);
  const [rayon, changerRayon] = utiliserRayonExplorer();
  const [selection, setSelection] = useState<number | null>(null);
  const [roulette, setRoulette] = useState(false);
  const [hauteurEcran, setHauteurEcran] = useState(0);
  const [hauteurEnTete, setHauteurEnTete] = useState(0);
  const [hauteurFeuille, setHauteurFeuille] = useState(0);
  const [hauteurClavier, setHauteurClavier] = useState(0);
  const [maintenant, setMaintenant] = useState(lireMinute);
  const refCompteur = useRef<Text>(null);

  // L'heure avance : « Ouvert maintenant », Ouvert / Fermé et les SOS du soir se recalculent à chaque minute
  // tant que l'onglet est affiché, et dès qu'on revient dans l'app
  useFocusEffect(
    useCallback(() => {
      let minuterie: ReturnType<typeof setTimeout> | undefined;
      const relire = () => {
        const minute = lireMinute();
        setMaintenant((avant) => (avant.getTime() === minute.getTime() ? avant : minute));
      };
      const avancer = () => {
        relire();
        minuterie = setTimeout(avancer, MINUTE - (Date.now() % MINUTE) + 50);
      };
      avancer();
      const abonnement = AppState.addEventListener("change", (etat) => {
        if (etat === "active") relire();
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

  const age = useMemo(() => (profil ? calculerAge(profil.dateNaissance) : null), [profil]);
  const depuisVille = useMemo(() => (pointDeDepart ? ecrireDepuisVille(profil?.ville ?? "") : null), [pointDeDepart, profil?.ville]);
  const { lieux: tousLesLieux, chargerZone } = utiliserLieux();
  const lieuxPermis = useMemo(() => filtrerLieuxSelonAge(tousLesLieux, age), [tousLesLieux, age]);
  const barsPermis = age !== null;
  const villes = useMemo(() => [...new Set(lieuxPermis.map((l) => l.ville))].sort(comparerVilles), [lieuxPermis]);
  const cleSosFinis = useMemo(() => ecrireCleSosFinis(lieuxPermis, maintenant), [lieuxPermis, maintenant]);
  const lieuxActuels = useMemo(() => retirerSosFinis(lieuxPermis, cleSosFinis), [lieuxPermis, cleSosFinis]);
  const distancesInconnues = useMemo(() => !lieuxActuels.some((l) => calculerKmLieu(l, null) !== null), [lieuxActuels]);
  const portee: PorteeExplorer = porteeChoisie ?? (pointDeDepart === null && distancesInconnues ? "france" : "proche");
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
  // Sans zone, le serveur ne rend que 1 000 lieux : on lit aussi ceux de l'endroit regardé (autour de toi ou de la ville
  // choisie jusqu'au bout du curseur, sinon ta région). Toute la France : la liste seule. Ce qui part au serveur : les
  // cases de 0,5 degré autour de la case où tu es (calculerZoneAutour), jamais ta position exacte.
  const zoneALire = useMemo(() => {
    if (zone?.portee === "region") return cadre;
    const autourDe = zone?.portee === "proche" ? zone.centre : filtres.ville ? centre : null;
    return autourDe ? calculerZoneAutour(autourDe, RAYON_PROCHE_KM.max) : null;
  }, [zone, cadre, filtres.ville, centre]);
  useEffect(() => {
    if (zoneALire) chargerZone(zoneALire);
  }, [zoneALire, chargerZone]);
  // Filtre « Événements » : seulement les lieux qui en ont un sur la période (null tant que c'est coupé ou pas encore lu)
  const evenementsParLieu = utiliserEvenementsExplorer(filtres.evenement, age);
  const lieuxTries = useMemo(() => {
    const dansLaZone = zone ? lieuxActuels.filter((l) => estDansPortee(l, zone)) : lieuxActuels;
    const avecEvenement = filtres.evenement ? dansLaZone.filter((l) => evenementsParLieu?.has(l.id) ?? false) : dansLaZone;
    return trierLieuxExplorer(avecEvenement, profil, position, pointDeDepart);
  }, [lieuxActuels, zone, filtres.evenement, evenementsParLieu, profil, position, pointDeDepart]);
  const texteRecherche = useDeferredValue(filtres.texte);
  const ouvertA = filtres.ouvertMaintenant ? maintenant : null;
  const lieux = useMemo(
    () => filtrerLieuxTriesExplorer(lieuxTries, { texte: texteRecherche, type: filtres.type, ville: filtres.ville, budgets: filtres.budgets, ouvertA }),
    [lieuxTries, texteRecherche, filtres.type, filtres.ville, filtres.budgets, ouvertA],
  );
  // « À quelques km » sans savoir d'où (ni position, ni ville connue) : aucun lieu n'est près de toi, et ce ne sont pas les
  // filtres (en démo, les lieux gardent leurs km d'exemple : la liste n'est pas vide pour ça)
  const fauteDeDepart = zone?.portee === "proche" && zone.centre === null && distancesInconnues;
  const choixZone = useMemo(
    (): ChoixZone => (filtres.ville ? { portee: null, rayonKm: rayon, ville: filtres.ville } : { portee, rayonKm: rayon, ville: null }),
    [filtres.ville, portee, rayon],
  );
  // SOS d'abord, puis les alertes du soir
  const sos = useMemo(() => lieux.filter(({ lieu }) => lieu.sos || lieu.alerte).sort((a, b) => Number(!!b.lieu.sos) - Number(!!a.lieu.sos)), [lieux]);

  const selectionRetiree = useMemo(() => selection !== null && !lieux.some(({ lieu }) => lieu.id === selection), [lieux, selection]);
  if (selectionRetiree) setSelection(null);
  if (position === null && porteeAvantAutour !== null) {
    setPorteeAvantAutour(null);
    if (porteeChoisie === "proche") setPorteeChoisie(porteeAvantAutour.portee);
  }
  if (focus && oublisDits !== oublisApresAbsence) {
    setOublisDits(oublisApresAbsence);
    setAnnonce({ texte: "Plus de 5 min hors de l'app : ta position est oubliée 📍", numero: oublisApresAbsence });
  }

  const motRecherche = texteRecherche.trim();
  const avecFiltres = filtres.type !== "tous" || filtres.ville !== null || filtres.budgets.length > 0 || filtres.ouvertMaintenant || filtres.evenement !== null;
  // Ce que dira l'annonce du nombre de lieux (lu quand elle part, après l'attente)
  const nombre = useRef({ lieux: lieux.length, recherche: false, filtres: false, fauteDeDepart: false, sauter: false });
  useEffect(() => {
    nombre.current.lieux = lieux.length;
    nombre.current.recherche = motRecherche !== "";
    nombre.current.filtres = avecFiltres;
    nombre.current.fauteDeDepart = fauteDeDepart;
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
      const { lieux: n, recherche: avecRecherche, filtres: filtresActifs, fauteDeDepart: sansDepart } = nombre.current;
      const texte =
        n > 0
          ? `${n} lieu${n > 1 ? "x" : ""}`
          : sansDepart
            ? "Aucun lieu : on ne sait pas où tu es"
            : avecRecherche
              ? "Aucun lieu pour cette recherche"
              : filtresActifs
                ? "Aucun lieu avec ces filtres"
                : "Aucun lieu par ici pour l'instant";
      if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibilityWithOptions(texte, { queue: true });
      else AccessibilityInfo.announceForAccessibility(texte);
    }, DELAI_ANNONCE_NOMBRE);
    return () => clearTimeout(minuterie);
  }, [choixAnnonces]);

  const annoncer = (texte: string) => setAnnonce({ texte, numero: Date.now() });
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const ouvrir = useCallback((id: number) => router.push({ pathname: "/lieu/[id]", params: { id: String(id) } }), [router]);

  async function toucherAutourDeMoi() {
    const actualisation = position !== null;
    const porteeAvant = porteeChoisie;
    const resultat = await chercher();
    if (!resultat) return;
    if ("erreur" in resultat) {
      const message = ecrireErreurPosition(resultat.erreur, actualisation, depuisVille);
      if (!alerterErreurPosition(resultat.erreur, message)) annoncer(message);
      return;
    }
    if (actualisation) return annoncer("Ta position est à jour 📍");
    setPorteeAvantAutour({ portee: porteeAvant });
    setPorteeChoisie("proche");
    setFiltres((f) => (f.ville ? { ...f, ville: null } : f));
  }

  function arreterAutourDeMoi() {
    oublier();
    const repli = ecrireRepliDistances(depuisVille);
    annoncer(repli ? `Autour de moi arrêté : ${repli}` : "Autour de moi arrêté : ta position est oubliée");
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
  const depuis = position ? DEPUIS_TOI : depuisVille;
  const autourDe = depuis ?? (profil?.ville ? eliderDe(profil.ville) : "de ta ville");
  const ouOnRegarde = decrireZoneRegardee(zone, region, autourDe);
  const tri = position ? "les plus proches d'abord" : profil ? "selon tes envies" : null;
  const origine = zone?.portee !== "proche" && depuis ? `distances à partir ${depuis}` : null;
  const resume = [ouOnRegarde, tri, origine].filter(Boolean).join(" · ");

  function choisirPortee(portee: PorteeExplorer | null) {
    setPorteeAvantAutour(null);
    setPorteeChoisie(portee);
  }

  function changerZone(choix: ChoixZone) {
    changerRayon(choix.rayonKm);
    if (choix.ville !== null) {
      setFiltres((f) => ({ ...f, ville: choix.ville }));
      return;
    }
    choisirPortee(choix.portee);
    setFiltres((f) => (f.ville ? { ...f, ville: null } : f));
  }

  const outils = (
    <OutilsListeExplorer
      nombre={lieux.length}
      resume={resume}
      refCompteur={refCompteur}
      autourDeMoiActif={position !== null}
      recherche={recherche}
      avisApproximative={position !== null && approximative && !avisApproximativeVu}
      onToucherAutourDeMoi={() => void toucherAutourDeMoi()}
      onArreterAutourDeMoi={arreterAutourDeMoi}
      onFermerAvisApproximative={() => setAvisApproximativeVu(true)}
      onRoulette={() => setRoulette(true)}
    />
  );
  const vide = (
    <VideExplorer
      fauteDeDepart={fauteDeDepart}
      portee={zone?.portee ?? null}
      region={region}
      ouOnRegarde={ouOnRegarde}
      motRecherche={motRecherche}
      avecFiltres={avecFiltres}
      onAutourDeMoi={() => void toucherAutourDeMoi()}
      onChoisirPortee={choisirPortee}
      onEffacer={effacer}
    />
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
            evenements={evenementsParLieu}
            depuis={depuis}
            maintenant={maintenant}
          />
        </View>
      ) : null}

      <RouletteLieux
        visible={roulette}
        lieux={lieux}
        depuis={depuis}
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
