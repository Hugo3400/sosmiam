import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { AccessibilityInfo } from "react-native";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { DemandeReservation, Reservation } from "@sos-miam/commun/types/reservation";
import { RefusLimitationEnPlace } from "~/composants/compte/RefusLimitationEnPlace";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { DemandeEnvoyeeReservation } from "~/composants/reservations/DemandeEnvoyeeReservation";
import { EncadreReservation, type ActionEncadreReservation } from "~/composants/reservations/EncadreReservation";
import { FormulaireReservation } from "~/composants/reservations/FormulaireReservation";
import { PanneauApercuDemandeReservation } from "~/composants/reservations/PanneauApercuDemandeReservation";
import { REFUS_LIMITATION } from "~/contenus/limitation-compte";
import { clientExempleReservations } from "~/contenus/reservations-exemples";
import {
  creerReservationExemple,
  lireJoursExemple,
  lireRefusExemple,
  REPONSES_EXEMPLE_RESERVATION,
  TEXTES_APERCU_RESERVER_TABLE,
  type RefusExempleReservation,
} from "~/contenus/reserver-table-exemples";
import { ACTIONS_REFUS_RESERVATION, TEXTES_DEMANDE_ENVOYEE, TEXTES_REFUS_RESERVATION, TEXTES_RESERVER_TABLE } from "~/contenus/textes-reserver-table";
import { appliquerGesteReservation } from "~/fonctions/reservations/appliquer-geste-reservation";
import { calculerGestesReservation } from "~/fonctions/reservations/calculer-gestes-reservation";
import { decrireAnnulationReservation } from "~/fonctions/reservations/decrire-annulation-reservation";
import { decrireCreneauReservation } from "~/fonctions/reservations/decrire-creneau-reservation";
import { ecrireCreneauIso } from "~/fonctions/reservations/ecrire-creneau-iso";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";
import { direDeLieu } from "~/fonctions/visites/dire-de-lieu";

type Props = {
  lieu: Lieu;
};

const PERSONNES_PAR_DEFAUT = 2;
const LIBELLES_APERCU = REPONSES_EXEMPLE_RESERVATION.map((reponse) => reponse.libelle);
const MESSAGE_PETIT_MOT_REFUSE = `${MESSAGES_SERVICE["message-refuse"].titre} ${MESSAGES_SERVICE["message-refuse"].texte}`;

export function EcranReserverTable({ lieu }: Props) {
  const router = useRouter();
  const [maintenant] = useState(() => new Date());
  const jours = useMemo(() => lireJoursExemple(lieu, maintenant), [lieu, maintenant]);
  const aujourdhui = jours[0].jour;
  const [jourChoisi, setJourChoisi] = useState(() => (jours.find((j) => j.creneaux.length > 0) ?? jours[0]).jour);
  const [heure, setHeure] = useState<string | null>(null);
  const [personnes, setPersonnes] = useState(PERSONNES_PAR_DEFAUT);
  const [petitMot, setPetitMot] = useState("");
  const [reponseApercu, setReponseApercu] = useState(0);
  const [refus, setRefus] = useState<RefusExempleReservation | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [annulationOuverte, setAnnulationOuverte] = useState(false);

  const jour = jours.find((j) => j.jour === jourChoisi) ?? jours[0];
  const prochainOuvert = jours.find((j) => j.jour > jour.jour && j.creneaux.length > 0) ?? null;
  const quand = heure ? decrireCreneauReservation(ecrireCreneauIso(jour.jour, heure), maintenant.getTime()).lu : null;
  const deLieu = direDeLieu(lieu.nom);

  const refusLimite = refus?.erreur === "compte-limite";
  const erreurPetitMot = refus?.erreur === "message-refuse" ? MESSAGE_PETIT_MOT_REFUSE : null;
  const encadreRefus = refus && !refusLimite && !erreurPetitMot ? decrireEchecVisite(refus.erreur, refus.details, lieu.nom, TEXTES_REFUS_RESERVATION[refus.erreur]) : null;

  function choisirJour(suivant: string) {
    const creneaux = jours.find((j) => j.jour === suivant)?.creneaux ?? [];
    setJourChoisi(suivant);
    if (heure && !creneaux.includes(heure)) setHeure(null);
    setRefus(null);
  }

  function envoyer(message: string) {
    if (!heure) return;
    const texte = message.trim();
    const demande: DemandeReservation = { lieuId: lieu.id, personnes, jour: jour.jour, heure, message: texte === "" ? null : texte };
    const refusExemple = lireRefusExemple(reponseApercu, demande, lieu);
    setRefus(refusExemple);
    if (!refusExemple) setReservation(creerReservationExemple(lieu, demande, maintenant));
  }

  function envoyerSansPetitMot() {
    setPetitMot("");
    envoyer("");
  }

  function lireActionRefus(erreur: ErreurService): ActionEncadreReservation | undefined {
    if (erreur === "lieu-non-reservable" || erreur === "introuvable") return { libelle: ACTIONS_REFUS_RESERVATION.retourFiche, onPress: () => router.back() };
    if (erreur === "reservation-en-cours" || erreur === "trop-de-reservations") {
      return { libelle: ACTIONS_REFUS_RESERVATION.voirReservations, onPress: () => router.push("/reservations") };
    }
    if (erreur === "email-non-verifie") return { libelle: ACTIONS_REFUS_RESERVATION.confirmerEmail, onPress: () => router.push("/reglages/compte") };
    return undefined;
  }

  const annulation = reservation
    ? decrireAnnulationReservation(reservation, calculerGestesReservation(reservation, maintenant.getTime()).annulationTardive, maintenant.getTime())
    : null;
  const enAttente = reservation?.statut === "demandee";

  return (
    <EcranReglage
      key={reservation ? "envoyee" : "formulaire"}
      titre={!reservation ? TEXTES_RESERVER_TABLE.titre : enAttente ? TEXTES_DEMANDE_ENVOYEE.titre : TEXTES_DEMANDE_ENVOYEE.titreAnnulee}
      sousTitre={
        !reservation
          ? TEXTES_RESERVER_TABLE.sousTitre
          : enAttente
            ? remplirModele(TEXTES_DEMANDE_ENVOYEE.sousTitre, { deLieu })
            : TEXTES_DEMANDE_ENVOYEE.sousTitreAnnulee
      }
      boutonPrincipal={
        reservation
          ? undefined
          : {
              libelle: refusLimite ? TEXTES_RESERVER_TABLE.envoyerSansPetitMot : TEXTES_RESERVER_TABLE.envoyer,
              onPress: refusLimite ? envoyerSansPetitMot : () => envoyer(petitMot),
              desactive: heure === null,
              indice: heure === null ? TEXTES_RESERVER_TABLE.indiceSansHeure : TEXTES_RESERVER_TABLE.indiceEnvoyer,
            }
      }
      auDessusDuBouton={
        refusLimite ? (
          <RefusLimitationEnPlace texte={REFUS_LIMITATION.petitMot} />
        ) : refus && encadreRefus ? (
          <EncadreReservation ton="refus" emoji={encadreRefus.emoji} titre={encadreRefus.titre} texte={encadreRefus.texte} action={lireActionRefus(refus.erreur)} />
        ) : null
      }
    >
      {reservation ? (
        <DemandeEnvoyeeReservation
          reservation={reservation}
          maintenantMs={maintenant.getTime()}
          client={clientExempleReservations}
          onAnnuler={() => setAnnulationOuverte(true)}
          onVoirReservations={() => router.push("/reservations")}
          onRetourFiche={() => router.back()}
          onAutreCreneau={() => setReservation(null)}
        />
      ) : (
        <FormulaireReservation
          lieu={lieu}
          jours={jours}
          aujourdhui={aujourdhui}
          jour={jour}
          heure={heure}
          personnes={personnes}
          petitMot={petitMot}
          erreurPetitMot={erreurPetitMot}
          quand={quand}
          onChoisirJour={choisirJour}
          onChoisirHeure={(suivante) => {
            setHeure(suivante);
            setRefus(null);
          }}
          onChangerPersonnes={(nombre) => {
            setPersonnes(nombre);
            setRefus(null);
          }}
          onChangerPetitMot={(texte) => {
            setPetitMot(texte);
            setRefus(null);
          }}
          onProchainJourOuvert={prochainOuvert ? () => choisirJour(prochainOuvert.jour) : null}
        >
          <PanneauApercuDemandeReservation
            titre={TEXTES_APERCU_RESERVER_TABLE.titre}
            texte={TEXTES_APERCU_RESERVER_TABLE.texte}
            libelles={LIBELLES_APERCU}
            choisi={reponseApercu}
            onChoisir={(index) => {
              setReponseApercu(index);
              setRefus(null);
            }}
          />
        </FormulaireReservation>
      )}

      <FeuilleConfirmation
        visible={annulationOuverte}
        emoji="🗓️"
        titre={annulation?.titre ?? ""}
        detail={annulation?.detail ?? ""}
        libelleConfirmer={annulation?.libelleConfirmer ?? ""}
        libelleRester={annulation?.libelleRester ?? ""}
        onConfirmer={() => setReservation((actuelle) => actuelle && appliquerGesteReservation(actuelle, { type: "annuler-client" }, Date.now()))}
        onRefermee={() => {
          if (annulation) AccessibilityInfo.announceForAccessibility(annulation.annonce);
        }}
        onFermer={() => setAnnulationOuverte(false)}
      />
    </EcranReglage>
  );
}
