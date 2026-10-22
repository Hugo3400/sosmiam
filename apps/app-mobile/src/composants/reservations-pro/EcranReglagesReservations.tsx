import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { creerServicesDepuisHoraires } from "@sos-miam/commun/fonctions/reservations/creer-services-depuis-horaires";
import { calculerJourParis } from "@sos-miam/commun/fonctions/temps/calculer-jour-paris";
import type { ServiceReservation } from "@sos-miam/commun/types/reglages-reservations";
import type { LieuGere } from "@sos-miam/commun/types/roles";
import { Annonce } from "~/composants/interface/Annonce";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { CarteMessageReservations } from "~/composants/reservations/CarteMessageReservations";
import { EncadresReglagesReservations } from "~/composants/reservations-pro/EncadresReglagesReservations";
import { FeuilleAvertissementsReglages } from "~/composants/reservations-pro/FeuilleAvertissementsReglages";
import { FeuilleJoursFermes } from "~/composants/reservations-pro/FeuilleJoursFermes";
import { FeuilleServiceReservation } from "~/composants/reservations-pro/FeuilleServiceReservation";
import { PiedReglagesReservations } from "~/composants/reservations-pro/PiedReglagesReservations";
import { SectionDelaiReservation } from "~/composants/reservations-pro/SectionDelaiReservation";
import { SectionJoursFermes } from "~/composants/reservations-pro/SectionJoursFermes";
import { SectionModeAcceptation } from "~/composants/reservations-pro/SectionModeAcceptation";
import { SectionServicesReservation } from "~/composants/reservations-pro/SectionServicesReservation";
import { CONFIRMATIONS_REGLAGES_RESERVATIONS as C, TEXTES_FEUILLE_SERVICE, TEXTES_REGLAGES_RESERVATIONS as T } from "~/contenus/textes-reglages-reservations";
import { decrireServiceReservation } from "~/fonctions/reservations/decrire-service-reservation";
import { lireBrouillonService } from "~/fonctions/reservations/lire-brouillon-service";
import { proposerNouveauService } from "~/fonctions/reservations/proposer-nouveau-service";
import type { BrouillonService } from "~/fonctions/reservations/verifier-service-reservation";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserBrouillonReglagesReservations } from "~/hooks/utiliser-brouillon-reglages-reservations";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserEnregistrementReglages } from "~/hooks/utiliser-enregistrement-reglages";
import { utiliserFermerPile } from "~/hooks/utiliser-fermer-pile";
import { utiliserHorlogeMinute } from "~/hooks/utiliser-horloge-minute";
import { utiliserJoursFermesPro } from "~/hooks/utiliser-jours-fermes-pro";
import { utiliserReglagesReservations } from "~/hooks/utiliser-reglages-reservations";

type Props = { lieu: LieuGere };

type FeuilleService = { index: number | null; depart: BrouillonService; titre: string };

export function EcranReglagesReservations({ lieu }: Props) {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const navigation = useNavigation();
  const marges = useSafeAreaInsets();
  const fermer = utiliserFermerPile();
  const gerant = lieu.role === "gerant";
  const reglages = utiliserReglagesReservations(lieu.id);
  const brouillon = utiliserBrouillonReglagesReservations();
  const { repartirDe } = brouillon;
  const { maintenantMs } = utiliserHorlogeMinute();
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const annoncer = useCallback((texte: string) => setAnnonce({ texte, numero: Date.now() }), []);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const [feuille, setFeuille] = useState<FeuilleService>(() => ({ index: null, depart: proposerNouveauService([]), titre: TEXTES_FEUILLE_SERVICE.titreNouveau }));
  const [feuilleOuverte, setFeuilleOuverte] = useState(false);
  const [numeroFeuille, setNumeroFeuille] = useState(0);
  const [joursOuverts, setJoursOuverts] = useState(false);
  const [repliDemande, setRepliDemande] = useState(false);
  const [departDemande, setDepartDemande] = useState(false);
  const actionDepart = useRef<(() => void) | null>(null);
  const initialise = useRef(false);
  const defilement = useRef<ScrollView>(null);
  const aujourdhui = calculerJourParis(maintenantMs);
  const lus = reglages.lecture.etat === "lu" ? reglages.lecture.lus : null;
  const jours = utiliserJoursFermesPro({ fermerJour: reglages.fermerJour, joursFermes: lus?.reglages.joursFermes ?? [], aujourdhui, annoncer });
  const enregistrement = utiliserEnregistrementReglages({ brouillon, lus, enregistrer: reglages.enregistrer, annoncer });

  useEffect(() => {
    if (!lus || initialise.current) return;
    initialise.current = true;
    repartirDe(lus.reglages);
  }, [lus, repartirDe]);

  useEffect(() => {
    if (enregistrement.aRevoir > 0) defilement.current?.scrollTo({ y: 0, animated: true });
  }, [enregistrement.aRevoir]);

  usePreventRemove(brouillon.modifie, ({ data }) => {
    actionDepart.current = () => navigation.dispatch(data.action);
    setDepartDemande(true);
  });

  const { services } = brouillon.brouillon;
  const modifiable = gerant && lus !== null;

  function ouvrirFeuille(suivante: FeuilleService) {
    setFeuille(suivante);
    setNumeroFeuille((n) => n + 1);
    setFeuilleOuverte(true);
  }

  function ouvrirService(index: number) {
    const service = services[index];
    if (!service) return;
    ouvrirFeuille({ index, depart: lireBrouillonService(service), titre: decrireServiceReservation(service, services).titre });
  }

  function garderService(service: ServiceReservation) {
    brouillon.garderService(feuille.index, service);
    enregistrement.oublierErreur();
    setFeuilleOuverte(false);
  }

  function supprimerService() {
    if (feuille.index === null) return;
    const { repasseALaMain } = brouillon.supprimerService(feuille.index);
    enregistrement.oublierErreur();
    setFeuilleOuverte(false);
    if (repasseALaMain) annoncer(T.repasseALaMain);
  }

  function reglerDepuisHoraires(couverts: number) {
    const crees = creerServicesDepuisHoraires(lus?.ouverture ?? [], couverts);
    if (crees.length === 0) return ouvrirFeuille({ index: null, depart: { ...proposerNouveauService([]), couverts: String(couverts) }, titre: TEXTES_FEUILLE_SERVICE.titreNouveau });
    brouillon.remplacerServices(crees);
  }

  const contenu = () => {
    if (reglages.lecture.etat === "attente") {
      return (
        <View className="items-center py-10">
          <ActivityIndicator color={couleurs.encre} accessibilityLabel={T.chargement} />
        </View>
      );
    }
    if (reglages.lecture.etat === "erreur") {
      if (reglages.lecture.erreur === "service-indisponible") return <CarteMessageReservations emoji="🧪" titre={T.demoTitre} texte={T.demoTexte} />;
      if (reglages.lecture.erreur === "introuvable") return <CarteMessageReservations emoji="🛠️" titre={T.bientotTitre} texte={T.bientotTexte} />;
      const action = { libelle: T.reessayer, indice: T.indiceReessayer, onPress: () => void reglages.relire() };
      return <CarteMessageReservations emoji="📒" titre={T.lectureEchecTitre} texte={T.lectureEchecTexte} action={action} />;
    }
    const lu = reglages.lecture.lus;
    return (
      <>
        <EncadresReglagesReservations gerant={gerant} reservable={lu.reservable} aRevoir={enregistrement.aRevoir} onVoirReservations={() => router.push("/pro/reservations")} />
        <SectionModeAcceptation acceptation={brouillon.brouillon.acceptation} avecServices={services.length > 0} modifiable={modifiable} onChoisir={brouillon.changerMode} />
        <SectionServicesReservation
          services={services}
          avecHoraires={lu.ouverture.length > 0}
          modifiable={modifiable}
          erreur={enregistrement.erreurService}
          onOuvrir={ouvrirService}
          onAjouter={() => ouvrirFeuille({ index: null, depart: proposerNouveauService(services), titre: TEXTES_FEUILLE_SERVICE.titreNouveau })}
          onReglerDepuisHoraires={reglerDepuisHoraires}
          onRevenirRepli={() => setRepliDemande(true)}
        />
        <SectionDelaiReservation delai={brouillon.brouillon.delai} acceptation={brouillon.brouillon.acceptation} modifiable={modifiable} onChoisir={brouillon.changerDelai} />
        <SectionJoursFermes joursFermes={lu.reglages.joursFermes} aujourdhui={aujourdhui} enCours={jours.enCours} onBasculer={jours.basculer} onChoisir={() => setJoursOuverts(true)} />
      </>
    );
  };

  const autres = services.filter((_, i) => i !== feuille.index);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <View className="min-h-14 flex-row items-center gap-3 px-5 pb-2 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={8}
          onPress={fermer}
          className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
        <View className="flex-1">
          <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
            {T.titre}
          </Text>
          <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
            {`${lieu.emoji} ${lieu.nom}`}
          </Text>
        </View>
      </View>

      <ScrollView ref={defilement} contentContainerClassName="gap-7 px-5 pb-10 pt-2" keyboardShouldPersistTaps="handled">
        <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation(T.intro)}</Text>
        {contenu()}
      </ScrollView>

      {modifiable ? (
        <PiedReglagesReservations
          modifie={brouillon.modifie}
          enregistrement={enregistrement.enCours}
          onToutAnnuler={() => {
            brouillon.toutAnnuler();
            enregistrement.oublierErreur();
          }}
          onEnregistrer={() => void enregistrement.demander()}
        />
      ) : null}

      <FeuilleServiceReservation
        key={numeroFeuille}
        visible={feuilleOuverte}
        titre={feuille.titre}
        depart={feuille.depart}
        autres={autres}
        supprimable={feuille.index !== null}
        onGarder={garderService}
        onSupprimer={supprimerService}
        onFermer={() => setFeuilleOuverte(false)}
      />
      <FeuilleJoursFermes
        visible={joursOuverts}
        aujourdhui={aujourdhui}
        joursFermes={lus?.reglages.joursFermes ?? []}
        enCours={jours.enCours}
        erreur={jours.erreur}
        onBasculer={jours.basculer}
        onFermer={() => setJoursOuverts(false)}
      />
      <FeuilleAvertissementsReglages
        visible={enregistrement.avertissementsOuverts}
        avertissements={enregistrement.avertissements}
        onEnregistrer={() => void enregistrement.confirmer()}
        onFermer={enregistrement.renoncer}
      />
      <FeuilleConfirmation
        visible={repliDemande}
        emoji="🌿"
        titre={C.revenirRepli.titre}
        detail={C.revenirRepli.detail}
        libelleConfirmer={C.revenirRepli.confirmer}
        libelleRester={C.revenirRepli.rester}
        onConfirmer={() => brouillon.remplacerServices([])}
        onFermer={() => setRepliDemande(false)}
      />
      <FeuilleConfirmation
        visible={departDemande}
        emoji="📝"
        titre={C.partir.titre}
        detail={C.partir.detail}
        libelleConfirmer={C.partir.confirmer}
        libelleRester={C.partir.rester}
        indiceRester={C.partir.indiceRester}
        onConfirmer={brouillon.toutAnnuler}
        onRefermee={() => {
          const action = actionDepart.current;
          actionDepart.current = null;
          action?.();
        }}
        onFermer={() => setDepartDemande(false)}
      />
      <Annonce annonce={annonce} haut={marges.top + 12} onFin={finAnnonce} />
    </SafeAreaView>
  );
}

