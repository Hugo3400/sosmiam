import { useFocusEffect, useIsFocused, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { calculerJourParis } from "@sos-miam/commun/fonctions/temps/calculer-jour-paris";
import type { ReservationPro } from "@sos-miam/commun/types/reservation";
import { Annonce } from "~/composants/interface/Annonce";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { EnTeteMode } from "~/composants/modes/EnTeteMode";
import { BandeauDemoPro } from "~/composants/pro/BandeauDemoPro";
import { CarteReservationPro } from "~/composants/pro/CarteReservationPro";
import { FeuilleRefusReservation } from "~/composants/pro/FeuilleRefusReservation";
import { CarteMessageReservations } from "~/composants/reservations/CarteMessageReservations";
import { SectionReservations } from "~/composants/reservations/SectionReservations";
import { BoutonFermerJour } from "~/composants/reservations-pro/BoutonFermerJour";
import { CarteDemandeReservation } from "~/composants/reservations-pro/CarteDemandeReservation";
import { CarteRemplissageJour } from "~/composants/reservations-pro/CarteRemplissageJour";
import { EnTeteReservationsPro } from "~/composants/reservations-pro/EnTeteReservationsPro";
import { InvitationReglagesReservations } from "~/composants/reservations-pro/InvitationReglagesReservations";
import { CONFIRMATIONS_COMPTOIR_RESERVATIONS as C, TEXTES_COMPTOIR_RESERVATIONS } from "~/contenus/textes-comptoir-reservations";
import { TEXTES_RESERVATIONS_PRO as T } from "~/contenus/textes-reservations-pro";
import { ecrireHeureParis } from "~/fonctions/dates/ecrire-heure-paris";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { decrireDepassement } from "~/fonctions/reservations/decrire-depassement";
import { decrireNouvellesTables } from "~/fonctions/reservations/decrire-nouvelles-tables";
import { nommerClientReservation } from "~/fonctions/reservations/nommer-client-reservation";
import { rangerReservationsPro } from "~/fonctions/reservations/ranger-reservations-pro";
import { repererNouvellesTables } from "~/fonctions/reservations/reperer-nouvelles-tables";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserHorlogeMinute } from "~/hooks/utiliser-horloge-minute";
import { utiliserJoursFermesPro } from "~/hooks/utiliser-jours-fermes-pro";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserReglagesReservations } from "~/hooks/utiliser-reglages-reservations";
import { utiliserReponsesReservationsPro } from "~/hooks/utiliser-reponses-reservations-pro";
import { utiliserOutilsDemo, utiliserServices } from "~/hooks/utiliser-services";
import couleurs from "~/theme/couleurs";

export default function EcranReservationsPro() {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const focus = useIsFocused();
  const { lieuPro } = utiliserModes();
  const { comptoir } = utiliserServices();
  const demo = utiliserOutilsDemo() !== null;
  const { maintenantMs, recaler } = utiliserHorlogeMinute();
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const annoncer = useCallback((texte: string) => setAnnonce({ texte, numero: Date.now() }), []);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const reponses = utiliserReponsesReservationsPro({ lieuNom: lieuPro?.nom, annoncer, recaler });
  const { lecture, relire } = reponses;
  const reglages = utiliserReglagesReservations(lieuPro?.id ?? null);
  const lus = reglages.lecture.etat === "lu" ? reglages.lecture.lus : null;
  const aujourdhui = calculerJourParis(maintenantMs);
  const jours = utiliserJoursFermesPro({ fermerJour: reglages.fermerJour, joursFermes: lus?.reglages.joursFermes ?? [], aujourdhui, annoncer });
  const vues = useRef<Set<number> | null>(null);
  const gerant = lieuPro?.role === "gerant";

  useFocusEffect(
    useCallback(() => {
      void relire();
      return comptoir.ecouter(() => void relire());
    }, [comptoir, relire]),
  );

  useEffect(() => {
    if (lecture.etat !== "lu") return;
    const nouvelles = repererNouvellesTables(vues.current, lecture.reservations);
    vues.current = new Set(lecture.reservations.map((r) => r.id));
    const texte = focus ? decrireNouvellesTables(nouvelles, maintenantMs) : null;
    if (!texte) return;
    vibrerLegerement();
    annoncer(texte);
  }, [lecture, focus, annoncer, maintenantMs]);

  if (!lieuPro) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
        <View className="gap-6 px-5 pt-3">
          <EnTeteMode mode="pro" titre={T.titre} />
          <CarteMessageReservations emoji="🧑‍🍳" titre={T.sansLieuTitre} texte={T.sansLieuTexte} />
        </View>
      </SafeAreaView>
    );
  }

  const dessinerArrivee = (reservation: ReservationPro) => (
    <CarteReservationPro
      key={reservation.id}
      reservation={reservation}
      maintenantMs={maintenantMs}
      enCours={reponses.enCours === reservation.id}
      onMarquerArrivee={(venu) => reponses.noterArrivee(reservation, venu)}
      onAnnuler={() => reponses.demanderAnnulation(reservation)}
    />
  );

  const contenu = () => {
    if (lecture.etat === "attente") {
      return (
        <View className="items-center py-10">
          <ActivityIndicator color={couleurs.encre} accessibilityLabel={T.chargement} />
        </View>
      );
    }
    if (lecture.etat === "erreur") {
      const message = decrireEchecVisite(lecture.erreur, undefined, lieuPro.nom);
      const action = { libelle: T.reessayer, indice: T.indiceReessayer, onPress: () => void relire() };
      return <CarteMessageReservations emoji={MESSAGES_SERVICE[lecture.erreur].emoji} titre={message.titre} texte={message.texte} action={action} />;
    }
    const { aRepondre, aujourdhui: duJour, aVenir } = rangerReservationsPro(lecture.reservations, maintenantMs);
    const auto = lus?.reglages.acceptation === "automatique";
    const avecServices = (lus?.reglages.services.length ?? 0) > 0;
    return (
      <>
        {aRepondre.length > 0 ? (
          <SectionReservations titre={T.aRepondre} nombre={aRepondre.length}>
            {aRepondre.map((r) => (
              <CarteDemandeReservation
                key={r.id}
                reservation={r}
                choisi={reponses.lireChoix(r)}
                deplie={reponses.deplies.has(r.id)}
                enCours={reponses.enCours === r.id}
                maintenantMs={maintenantMs}
                onChoisir={(creneau) => reponses.choisir(r.id, creneau)}
                onBasculer={() => reponses.basculer(r.id)}
                onAccepter={(tient) => reponses.demanderAcceptation(r, tient)}
                onRefuser={() => reponses.demanderRefus(r)}
              />
            ))}
          </SectionReservations>
        ) : auto ? (
          <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(TEXTES_COMPTOIR_RESERVATIONS.aRepondreVideAuto)}</Text>
        ) : null}
        {lus && avecServices ? <CarteRemplissageJour reglages={lus.reglages} reservations={lecture.reservations} maintenantMs={maintenantMs} /> : null}
        {lus && !avecServices && gerant ? <InvitationReglagesReservations onRegler={() => router.push("/pro/reglages-reservations")} /> : null}
        {duJour.length > 0 ? (
          <SectionReservations titre={T.aujourdhui} nombre={duJour.length}>
            {duJour.map(dessinerArrivee)}
          </SectionReservations>
        ) : null}
        {aVenir.length > 0 ? (
          <SectionReservations titre={T.aVenir} nombre={aVenir.length}>
            {aVenir.map(dessinerArrivee)}
          </SectionReservations>
        ) : null}
        {aRepondre.length + duJour.length + aVenir.length === 0 ? <CarteMessageReservations emoji="📅" titre={T.videTitre} texte={T.videTexte} /> : null}
      </>
    );
  };

  const cibleQuandMeme = reponses.quandMeme.cible;
  const nomRefus = reponses.refus.cible ? nommerClientReservation(reponses.refus.cible) : "ce client";
  const nomAnnulation = reponses.annulation.cible ? nommerClientReservation(reponses.annulation.cible) : "ce client";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 px-5 pb-10 pt-3">
        <EnTeteMode mode="pro" titre={T.titre} sousTitre={`${lieuPro.emoji} ${lieuPro.nom}`} />
        {demo ? <BandeauDemoPro nomLieu={lieuPro.nom} /> : null}
        <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(T.sousTitre)}</Text>
        {lus ? <EnTeteReservationsPro acceptation={lus.reglages.acceptation} gerant={gerant} onReglages={() => router.push("/pro/reglages-reservations")} /> : null}
        {lus ? (
          <BoutonFermerJour ferme={lus.reglages.joursFermes.includes(aujourdhui)} enCours={jours.enCours.has(aujourdhui)} onBasculer={(ferme) => void jours.basculer(aujourdhui, ferme)} />
        ) : null}
        {contenu()}
      </ScrollView>

      <FeuilleRefusReservation
        visible={reponses.refus.visible}
        titre={remplirModele(T.refusTitre, { nom: nomRefus })}
        onConfirmer={reponses.confirmerRefus}
        onFermer={reponses.fermerRefus}
      />
      <FeuilleRefusReservation
        visible={reponses.annulation.visible}
        titre={remplirModele(C.annuler.titre, { nom: nomAnnulation })}
        sousTitre={remplirModele(C.annuler.detail, { nom: nomAnnulation })}
        libelleConfirmer={C.annuler.confirmer}
        onConfirmer={reponses.confirmerAnnulation}
        onFermer={reponses.fermerAnnulation}
      />
      <FeuilleConfirmation
        visible={reponses.quandMeme.visible}
        emoji="🧑‍✈️"
        titre={C.depasser.titre}
        detail={
          cibleQuandMeme
            ? decrireDepassement({
                nom: nommerClientReservation(cibleQuandMeme.reservation),
                heure: ecrireHeureParis(cibleQuandMeme.creneau),
                personnes: cibleQuandMeme.reservation.personnes,
                places: cibleQuandMeme.places,
                jourFerme: cibleQuandMeme.jourFerme,
              })
            : ""
        }
        libelleConfirmer={C.depasser.confirmer}
        libelleRester={C.depasser.rester}
        onConfirmer={reponses.confirmerQuandMeme}
        onFermer={reponses.fermerQuandMeme}
      />
      <Annonce annonce={annonce} haut={marges.top + 12} onFin={finAnnonce} />
    </SafeAreaView>
  );
}
