import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";

import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { DemandeReservation } from "@sos-miam/commun/types/reservation";
import { RefusLimitationEnPlace } from "~/composants/compte/RefusLimitationEnPlace";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { DemandeEnvoyeeReservation } from "~/composants/reservations/DemandeEnvoyeeReservation";
import { EncadreReservation, type ActionEncadreReservation } from "~/composants/reservations/EncadreReservation";
import { FormulaireReservation } from "~/composants/reservations/FormulaireReservation";
import { FeuilleEchecVisite } from "~/composants/visites/FeuilleEchecVisite";
import { FeuillePositionVisite } from "~/composants/visites/FeuillePositionVisite";
import { REFUS_LIMITATION } from "~/contenus/limitation-compte";
import { TEXTES_ECHEC_GESTE_RESERVATION } from "~/contenus/textes-mes-reservations";
import { ACTIONS_REFUS_RESERVATION, PETIT_MOT_REFUSE, TEXTES_REFUS_RESERVATION, TEXTES_RESERVER_TABLE } from "~/contenus/textes-reserver-table";
import { calculerGestesReservation } from "~/fonctions/reservations/calculer-gestes-reservation";
import { calculerJoursReservation } from "~/fonctions/reservations/calculer-jours-reservation";
import { decrireAnnulationReservation } from "~/fonctions/reservations/decrire-annulation-reservation";
import { decrireCreneauReservation } from "~/fonctions/reservations/decrire-creneau-reservation";
import { decrireEtapeReserver } from "~/fonctions/reservations/decrire-etape-reserver";
import { ecrireCreneauIso } from "~/fonctions/reservations/ecrire-creneau-iso";
import { garderCreneauxATemps } from "~/fonctions/reservations/garder-creneaux-a-temps";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";
import { utiliserClientReservation } from "~/hooks/utiliser-client-reservation";
import { utiliserCreneauxReservation } from "~/hooks/utiliser-creneaux-reservation";
import { utiliserEnvoiReservation, type RefusReservation } from "~/hooks/utiliser-envoi-reservation";
import { utiliserGestesReservation } from "~/hooks/utiliser-gestes-reservation";
import { utiliserHorlogeMinute } from "~/hooks/utiliser-horloge-minute";

type Props = {
  lieu: Lieu;
};

const PERSONNES_PAR_DEFAUT = 2;
const REFUS_BLOQUANTS: readonly ErreurService[] = ["lieu-non-reservable", "membre-du-lieu", "introuvable"];

export function EcranReserverTable({ lieu }: Props) {
  const router = useRouter();
  const client = utiliserClientReservation();
  const horloge = utiliserHorlogeMinute();
  const jours = useMemo(() => calculerJoursReservation(lieu.ouverture, new Date(horloge.maintenantMs)), [lieu.ouverture, horloge.maintenantMs]);
  const aujourdhui = jours[0].jour;
  const [jourChoisi, setJourChoisi] = useState(() => (jours.find((j) => j.creneaux.length > 0) ?? jours[0]).jour);
  const [heureChoisie, setHeure] = useState<string | null>(null);
  const [personnes, setPersonnes] = useState(PERSONNES_PAR_DEFAUT);
  const [petitMot, setPetitMot] = useState("");
  const [annulationOuverte, setAnnulationOuverte] = useState(false);
  const resultatAnnulation = useRef<Promise<boolean> | null>(null);
  const envoi = utiliserEnvoiReservation();
  const gestes = utiliserGestesReservation({
    remplacer: (reservation) => {
      horloge.recaler();
      envoi.remplacer(reservation);
    },
    actualiser: envoi.relire,
  });
  const { creneauxLus, refusLieu } = utiliserCreneauxReservation(lieu.id, jourChoisi);

  const jourLocal = jours.find((j) => j.jour === jourChoisi) ?? jours[0];
  const lus = creneauxLus[jourLocal.jour];
  const jour = { ...jourLocal, creneaux: lus ? garderCreneauxATemps(jourLocal.jour, lus, horloge.maintenantMs) : jourLocal.creneaux };
  const heure = heureChoisie && jour.creneaux.includes(heureChoisie) ? heureChoisie : null;
  const prochainOuvert = jours.find((j) => j.jour > jour.jour && j.creneaux.length > 0) ?? null;
  const quand = heure ? decrireCreneauReservation(ecrireCreneauIso(jour.jour, heure), horloge.maintenantMs).lu : null;
  const { reservation } = envoi;

  const refus: RefusReservation | null = envoi.refus ?? (refusLieu ? { ...refusLieu, numero: 0 } : null);
  const refusLimite = refus?.erreur === "compte-limite";
  const petitMotRefuse = refus?.erreur === "message-refuse";
  const encadreRefus = refus && !refusLimite && !petitMotRefuse ? decrireEchecVisite(refus.erreur, refus.details, lieu.nom, TEXTES_REFUS_RESERVATION[refus.erreur]) : null;
  const bloque = refusLieu !== null && REFUS_BLOQUANTS.includes(refusLieu.erreur);
  const etape = decrireEtapeReserver(reservation, lieu);

  const revenirFiche = () => (router.canGoBack() ? router.back() : router.replace({ pathname: "/lieu/[id]", params: { id: String(lieu.id) } }));

  function changer(action: () => void) {
    action();
    envoi.effacerRefus();
  }

  function choisirJour(suivant: string) {
    changer(() => setJourChoisi(suivant));
  }

  function envoyer(message: string) {
    if (!heure) return;
    const texte = message.trim();
    const demande: DemandeReservation = { lieuId: lieu.id, personnes, jour: jour.jour, heure, message: texte === "" ? null : texte };
    void envoi.envoyer(demande);
  }

  function envoyerSansPetitMot() {
    setPetitMot("");
    envoyer("");
  }

  function lireActionRefus(erreur: ErreurService): ActionEncadreReservation | undefined {
    if (erreur === "lieu-non-reservable") return { libelle: ACTIONS_REFUS_RESERVATION.retourFiche, onPress: revenirFiche };
    if (erreur === "introuvable") return { libelle: ACTIONS_REFUS_RESERVATION.voirExplorer, onPress: () => router.navigate("/explorer") };
    if (erreur === "reservation-en-cours" || erreur === "trop-de-reservations") {
      return { libelle: ACTIONS_REFUS_RESERVATION.voirReservations, onPress: () => router.push("/reservations") };
    }
    if (erreur === "email-non-verifie") return { libelle: ACTIONS_REFUS_RESERVATION.confirmerEmail, onPress: () => router.push("/reglages/compte") };
    return undefined;
  }

  function dessinerAuDessusDuBouton() {
    if (refusLimite) return <RefusLimitationEnPlace key={refus?.numero} texte={REFUS_LIMITATION.petitMot} />;
    if (petitMotRefuse) {
      return (
        <EncadreReservation
          key={refus?.numero}
          ton="refus"
          emoji={PETIT_MOT_REFUSE.emoji}
          titre={PETIT_MOT_REFUSE.titre}
          texte={PETIT_MOT_REFUSE.texte}
          action={{ libelle: TEXTES_RESERVER_TABLE.envoyerSansPetitMot, onPress: envoyerSansPetitMot }}
        />
      );
    }
    if (!refus || !encadreRefus) return null;
    return <EncadreReservation key={refus.numero} ton="refus" emoji={encadreRefus.emoji} titre={encadreRefus.titre} texte={encadreRefus.texte} action={lireActionRefus(refus.erreur)} />;
  }

  const annulation = reservation
    ? decrireAnnulationReservation(reservation, calculerGestesReservation(reservation, horloge.maintenantMs).annulationTardive, horloge.maintenantMs)
    : null;
  const libelleEnvoyer = envoi.envoi ? TEXTES_RESERVER_TABLE.envoi : refusLimite ? TEXTES_RESERVER_TABLE.envoyerSansPetitMot : TEXTES_RESERVER_TABLE.envoyer;

  return (
    <EcranReglage
      key={reservation ? "envoyee" : "formulaire"}
      titre={etape.titre}
      sousTitre={etape.sousTitre}
      onRetour={revenirFiche}
      boutonPrincipal={
        reservation
          ? undefined
          : {
              libelle: libelleEnvoyer,
              onPress: refusLimite ? envoyerSansPetitMot : () => envoyer(petitMot),
              desactive: heure === null || envoi.envoi || bloque,
              indice: heure === null ? TEXTES_RESERVER_TABLE.indiceSansHeure : TEXTES_RESERVER_TABLE.indiceEnvoyer,
            }
      }
      auDessusDuBouton={reservation ? null : dessinerAuDessusDuBouton()}
    >
      {reservation ? (
        <DemandeEnvoyeeReservation
          reservation={reservation}
          maintenantMs={horloge.maintenantMs}
          client={client}
          presenceEnCours={gestes.presence?.reservationId === reservation.id ? gestes.presence.texte : null}
          onAnnuler={() => {
            horloge.recaler();
            setAnnulationOuverte(true);
          }}
          onSignalerPresence={(r) => void gestes.signalerPresence(r)}
          onVoirReservations={() => router.push("/reservations")}
          onRetourFiche={revenirFiche}
          onAutreCreneau={envoi.recommencer}
        />
      ) : (
        <FormulaireReservation
          lieu={lieu}
          jours={jours}
          aujourdhui={aujourdhui}
          jour={jour}
          heure={heure}
          maintenantMs={horloge.maintenantMs}
          personnes={personnes}
          petitMot={petitMot}
          erreurPetitMot={petitMotRefuse ? PETIT_MOT_REFUSE.sousLeChamp : null}
          quand={quand}
          onChoisirJour={choisirJour}
          onChoisirHeure={(suivante) => changer(() => setHeure(suivante))}
          onChangerPersonnes={(nombre) => changer(() => setPersonnes(nombre))}
          onChangerPetitMot={(texte) => changer(() => setPetitMot(texte))}
          onProchainJourOuvert={prochainOuvert ? () => choisirJour(prochainOuvert.jour) : null}
        />
      )}

      <FeuilleConfirmation
        visible={annulationOuverte}
        emoji="🗓️"
        titre={annulation?.titre ?? ""}
        detail={annulation?.detail ?? ""}
        libelleConfirmer={annulation?.libelleConfirmer ?? ""}
        libelleRester={annulation?.libelleRester ?? ""}
        onConfirmer={() => {
          resultatAnnulation.current = reservation ? gestes.annuler(reservation) : null;
        }}
        onRefermee={() => {
          const annonce = annulation?.annonce;
          void resultatAnnulation.current?.then((ok) => {
            if (ok && annonce) AccessibilityInfo.announceForAccessibility(annonce);
          });
        }}
        onFermer={() => setAnnulationOuverte(false)}
      />
      <FeuillePositionVisite {...gestes.propsFeuillePosition} />
      <FeuilleEchecVisite echec={gestes.echec} lieuNom={lieu.nom} textes={TEXTES_ECHEC_GESTE_RESERVATION} actions={gestes.actionsEchec} onFermer={gestes.fermerEchec} />
    </EcranReglage>
  );
}
