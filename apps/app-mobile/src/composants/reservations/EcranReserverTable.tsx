import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";

import { ERREURS_RESERVATION_A_RELIRE } from "@sos-miam/commun/regles/reglages-reservations";
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
import { REFUS_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { TEXTES_ECHEC_GESTE_RESERVATION_PAR_LANGUE } from "~/contenus/textes-mes-reservations";
import {
  ACTIONS_REFUS_RESERVATION_PAR_LANGUE,
  PETIT_MOT_REFUSE_PAR_LANGUE,
  TEXTES_REFUS_RESERVATION_PAR_LANGUE,
  TEXTES_RESERVER_TABLE_PAR_LANGUE,
} from "~/contenus/textes-reserver-table";
import { calculerGestesReservation } from "~/fonctions/reservations/calculer-gestes-reservation";
import { decrireAnnulationReservation } from "~/fonctions/reservations/decrire-annulation-reservation";
import { decrireEtapeReserver } from "~/fonctions/reservations/decrire-etape-reserver";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";
import { utiliserClientReservation } from "~/hooks/utiliser-client-reservation";
import { utiliserEnvoiReservation, type RefusReservation } from "~/hooks/utiliser-envoi-reservation";
import { utiliserFormulaireReservation } from "~/hooks/utiliser-formulaire-reservation";
import { utiliserGestesReservation } from "~/hooks/utiliser-gestes-reservation";
import { utiliserHorlogeMinute } from "~/hooks/utiliser-horloge-minute";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  lieu: Lieu;
};

const REFUS_BLOQUANTS: readonly ErreurService[] = ["lieu-non-reservable", "membre-du-lieu", "introuvable"];

export function EcranReserverTable({ lieu }: Props) {
  const router = useRouter();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_RESERVER_TABLE_PAR_LANGUE);
  const actionsRefus = utiliserTextes(ACTIONS_REFUS_RESERVATION_PAR_LANGUE);
  const petitMotRefuseTextes = utiliserTextes(PETIT_MOT_REFUSE_PAR_LANGUE);
  const textesRefus = utiliserTextes(TEXTES_REFUS_RESERVATION_PAR_LANGUE);
  const echecs = utiliserTextes(TEXTES_ECHEC_GESTE_RESERVATION_PAR_LANGUE);
  const refusLimitation = utiliserTextes(REFUS_LIMITATION_PAR_LANGUE);
  const client = utiliserClientReservation();
  const horloge = utiliserHorlogeMinute();
  const formulaire = utiliserFormulaireReservation(lieu, horloge.maintenantMs);
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
  const { reservation } = envoi;
  const { relire } = formulaire;

  const refusLieu = formulaire.jours.refusLieu ?? formulaire.creneaux.refusLieu;
  const refus: RefusReservation | null = envoi.refus ?? (refusLieu ? { ...refusLieu, numero: 0 } : null);
  const refusLimite = refus?.erreur === "compte-limite";
  const petitMotRefuse = refus?.erreur === "message-refuse";
  const aRelire = refus !== null && ERREURS_RESERVATION_A_RELIRE.includes(refus.erreur);
  const encadreRefus =
    refus && !refusLimite && !petitMotRefuse ? decrireEchecVisite(aRelire ? "creneau-complet" : refus.erreur, langue, refus.details, lieu.nom, textesRefus[refus.erreur]) : null;
  const bloque = refusLieu !== null && REFUS_BLOQUANTS.includes(refusLieu.erreur);
  const automatique = formulaire.acceptation === "automatique";
  const etape = decrireEtapeReserver(reservation, lieu, automatique, langue);
  const numeroRelu = useRef(0);

  useEffect(() => {
    if (!envoi.refus || !ERREURS_RESERVATION_A_RELIRE.includes(envoi.refus.erreur) || numeroRelu.current === envoi.refus.numero) return;
    numeroRelu.current = envoi.refus.numero;
    relire();
  }, [envoi.refus, relire]);

  const revenirFiche = () => (router.canGoBack() ? router.back() : router.replace({ pathname: "/lieu/[id]", params: { id: String(lieu.id) } }));

  function envoyer(message: string) {
    const heure = formulaire.choix.principal;
    if (!heure) return;
    const texte = message.trim();
    const demande: DemandeReservation = {
      lieuId: lieu.id,
      personnes: formulaire.personnes,
      jour: formulaire.jour,
      heure,
      ...(formulaire.choix.secours.length > 0 ? { autresHeures: formulaire.choix.secours } : {}),
      message: texte === "" ? null : texte,
    };
    void envoi.envoyer(demande);
  }

  function envoyerSansPetitMot() {
    setPetitMot("");
    envoyer("");
  }

  function lireActionRefus(erreur: ErreurService): ActionEncadreReservation | undefined {
    if (erreur === "lieu-non-reservable") return { libelle: actionsRefus.retourFiche, onPress: revenirFiche };
    if (erreur === "introuvable") return { libelle: actionsRefus.voirExplorer, onPress: () => router.navigate("/explorer") };
    if (erreur === "reservation-en-cours" || erreur === "trop-de-reservations" || erreur === "reservation-en-double") {
      return { libelle: actionsRefus.voirReservations, onPress: () => router.push("/reservations") };
    }
    if (erreur === "email-non-verifie") return { libelle: actionsRefus.confirmerEmail, onPress: () => router.push("/reglages/compte") };
    return undefined;
  }

  function dessinerAuDessusDuBouton() {
    if (refusLimite) return <RefusLimitationEnPlace key={refus?.numero} texte={refusLimitation.petitMot} />;
    if (petitMotRefuse) {
      return (
        <EncadreReservation
          key={refus?.numero}
          ton="refus"
          emoji={petitMotRefuseTextes.emoji}
          titre={petitMotRefuseTextes.titre}
          texte={petitMotRefuseTextes.texte}
          action={{ libelle: T.envoyerSansPetitMot, onPress: envoyerSansPetitMot }}
        />
      );
    }
    if (!refus || !encadreRefus) return null;
    return <EncadreReservation key={refus.numero} ton="refus" emoji={encadreRefus.emoji} titre={encadreRefus.titre} texte={encadreRefus.texte} action={lireActionRefus(refus.erreur)} />;
  }

  const annulation = reservation
    ? decrireAnnulationReservation(reservation, calculerGestesReservation(reservation, horloge.maintenantMs).annulationTardive, horloge.maintenantMs, langue)
    : null;
  const libelleAuto = lieu.type === "sortie" ? T.envoyerAutoPlace : T.envoyerAutoTable;
  const libelleEnvoi = automatique ? T.envoiAuto : T.envoi;
  const libelleEnvoyer = envoi.envoi ? libelleEnvoi : refusLimite ? T.envoyerSansPetitMot : automatique ? libelleAuto : T.envoyer;
  const pret = formulaire.choix.principal !== null;

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
              desactive: !pret || envoi.envoi || bloque,
              indice: !pret ? T.indiceSansHeure : automatique ? T.indiceEnvoyerAuto : T.indiceEnvoyer,
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
          onAutreCreneau={() => {
            envoi.recommencer();
            relire();
          }}
        />
      ) : (
        <FormulaireReservation
          lieu={lieu}
          formulaire={{
            ...formulaire,
            changerPersonnes: (nombre: number) => {
              envoi.effacerRefus();
              formulaire.changerPersonnes(nombre);
            },
            choisirJour: (jour: string) => {
              envoi.effacerRefus();
              formulaire.choisirJour(jour);
            },
            choisirHeure: (heure: string) => {
              envoi.effacerRefus();
              formulaire.choisirHeure(heure);
            },
          }}
          maintenantMs={horloge.maintenantMs}
          petitMot={petitMot}
          erreurPetitMot={petitMotRefuse ? petitMotRefuseTextes.sousLeChamp : null}
          onChangerPetitMot={(texte) => {
            envoi.effacerRefus();
            setPetitMot(texte);
          }}
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
      <FeuilleEchecVisite echec={gestes.echec} lieuNom={lieu.nom} textes={echecs} actions={gestes.actionsEchec} onFermer={gestes.fermerEchec} />
    </EcranReglage>
  );
}
