// Les services quand rien ne peut valider une visite (version publiée sans API) : les listes répondent vides, la lecture
// d'un lieu, du comptoir ou d'une ressource et toutes les actions répondent « service-indisponible » (« Ça arrive avec
// les comptes »). Aucune fausse visite « vérifiée ». Sert aussi, au lot 0, pour ce que la démo ne fait pas encore.
import type { Services } from "@sos-miam/commun/client-api/services";
import type { ResumeAvis } from "@sos-miam/commun/types/avis";

const indisponible = async () => ({ ok: false as const, erreur: "service-indisponible" as const });
const rienAEcouter = () => () => {};
const resumeVide = (): ResumeAvis => ({ moyenne: null, nombre: 0, partRetour: null });

/** Les services « indisponibles ». */
export function creerServicesIndisponibles(): Services {
  return {
    source: "indisponible",
    visites: {
      lireLieu: indisponible,
      listerLieuxQuiValident: async () => ({ ok: true, lieux: [] }),
      demanderAddition: indisponible,
      validerComptoir: indisponible,
      lireVisite: indisponible,
      annulerDemande: indisponible,
      contesterRefus: indisponible,
      listerVisites: async () => ({ ok: true, visites: [], enCours: null, points: 0 }),
      ecouter: rienAEcouter,
    },
    fidelite: {
      listerCartes: async () => ({ ok: true, cartes: [] }),
      demanderRecompense: indisponible,
      annulerDemandeRecompense: indisponible,
    },
    reservations: {
      listerCreneaux: async () => ({ ok: true, creneaux: [] }),
      reserver: indisponible,
      listerReservations: async () => ({ ok: true, reservations: [] }),
      lireReservation: indisponible,
      annulerReservation: indisponible,
      signalerPresence: indisponible,
    },
    avis: {
      listerAvisAEcrire: async () => ({ ok: true, visites: [] }),
      envoyerAvis: indisponible,
      listerAvisLieu: async () => ({ ok: true, resume: resumeVide(), avis: [] }),
    },
    comptoir: {
      listerLieux: async () => ({ ok: true, lieux: [] }),
      lireComptoir: indisponible,
      montrerQr: indisponible,
      cacherQr: indisponible,
      marquerReglee: indisponible,
      refuser: indisponible,
      annulerValidation: indisponible,
      offrirRecompense: indisponible,
      listerReservations: async () => ({ ok: true, reservations: [] }),
      repondreReservation: indisponible,
      marquerArrivee: indisponible,
      lireProgramme: indisponible,
      reglerProgramme: indisponible,
      lireInfosPratiques: indisponible,
      reglerInfosPratiques: indisponible,
      lireCarteDuLieu: indisponible,
      reglerCarteDuLieu: indisponible,
      listerAvis: async () => ({ ok: true, resume: resumeVide(), avis: [] }),
      repondreAvis: indisponible,
      ecouter: rienAEcouter,
    },
    suggestions: {
      proposer: indisponible,
    },
    miamSafe: {
      lireLieu: indisponible,
      envoyerAlerte: indisponible,
      suivreAlerte: indisponible,
      signaler: indisponible,
      repondreSentiBien: indisponible,
      listerAlertesComptoir: async () => ({ ok: true, alertes: [] }),
      direOnArrive: indisponible,
      lireCharte: indisponible,
      signerCharte: indisponible,
      quitterCharte: indisponible,
    },
    ambassadeur: {
      lireEspace: indisponible,
      listerMissions: async () => ({ ok: true, missions: [] }),
      signalerPresence: indisponible,
      terminerMission: indisponible,
      listerAvisARelire: async () => ({ ok: true, avis: [] }),
      donnerVerdict: indisponible,
      listerMessages: async () => ({ ok: true, messages: [] }),
      marquerLu: indisponible,
      ecouter: rienAEcouter,
    },
  };
}
