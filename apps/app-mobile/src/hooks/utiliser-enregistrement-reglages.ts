import { useRef, useState } from "react";

import type { ReglagesReservationsLus, ReponseReglagesReservations } from "@sos-miam/commun/client-api/contrat-reglages-reservations";
import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { ReglagesServicesReservations } from "@sos-miam/commun/types/reglages-reservations";
import { validerReglagesReservations } from "@sos-miam/commun/validation/valider-reglages-reservations";
import { ERREURS_SERVICE, TEXTES_REGLAGES_RESERVATIONS as T } from "~/contenus/textes-reglages-reservations";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lireChampReglages } from "~/fonctions/reservations/lire-champ-reglages";
import { lireReglagesLus } from "~/fonctions/reservations/lire-reglages-lus";
import { listerAvertissementsReglages, type AvertissementReglages } from "~/fonctions/reservations/lister-avertissements-reglages";
import type { BrouillonReglagesReservations } from "~/hooks/utiliser-brouillon-reglages-reservations";
import { utiliserReservationsPro } from "~/hooks/utiliser-reservations-pro";

type Options = {
  brouillon: BrouillonReglagesReservations;
  lus: ReglagesReservationsLus | null;
  enregistrer: (reglages: ReglagesServicesReservations) => Promise<ReponseReglagesReservations>;
  annoncer: (texte: string) => void;
};

export function utiliserEnregistrementReglages({ brouillon, lus, enregistrer, annoncer }: Options) {
  const { lecture } = utiliserReservationsPro();
  const [enCours, setEnCours] = useState(false);
  const [avertissements, setAvertissements] = useState<AvertissementReglages[]>([]);
  const [avertissementsOuverts, setAvertissementsOuverts] = useState(false);
  const [erreurService, setErreurService] = useState<{ service: number; texte: string } | null>(null);
  const [aRevoir, setARevoir] = useState(0);
  const valides = useRef<ReglagesServicesReservations | null>(null);

  function signaler(champ: string) {
    const lu = lireChampReglages(champ);
    const texte = ERREURS_SERVICE[lu.champ as keyof typeof ERREURS_SERVICE] ?? ERREURS_SERVICE.autre;
    setErreurService(lu.service === null ? null : { service: lu.service, texte });
    vibrerLegerement();
    annoncer(remplirModele(T.aCorriger, { erreur: texte }));
  }

  async function envoyer(reglages: ReglagesServicesReservations) {
    setEnCours(true);
    const reponse = await enregistrer(reglages);
    setEnCours(false);
    if (!reponse.ok) {
      if (reponse.erreur === "reglages-invalides" && reponse.champ) return signaler(reponse.champ);
      const message = MESSAGES_SERVICE[reponse.erreur];
      return annoncer(reponse.erreur === "hors-ligne" ? T.echecEnregistrement : `${message.titre}. ${message.texte}`);
    }
    vibrerLegerement();
    const relus = lireReglagesLus(reponse);
    brouillon.repartirDe(relus.reglages);
    setARevoir(relus.aRevoir.length);
    annoncer(T.enregistre);
  }

  async function demander() {
    if (enCours || !brouillon.depart || !lus) return;
    const valide = validerReglagesReservations(brouillon.brouillon);
    if (!valide.ok) return signaler(valide.champ);
    setErreurService(null);
    const reglages = { avant: brouillon.depart, apres: valide.reglages, joursFermes: lus.reglages.joursFermes };
    const liste = lecture.etat === "lu" ? listerAvertissementsReglages(reglages, lecture.reservations, Date.now()) : [];
    if (liste.length === 0) return envoyer(valide.reglages);
    valides.current = valide.reglages;
    setAvertissements(liste);
    setAvertissementsOuverts(true);
  }

  async function confirmer() {
    const reglages = valides.current;
    valides.current = null;
    setAvertissementsOuverts(false);
    if (reglages) await envoyer(reglages);
  }

  return {
    enCours,
    avertissements,
    avertissementsOuverts,
    erreurService,
    aRevoir,
    demander,
    confirmer,
    renoncer: () => setAvertissementsOuverts(false),
    oublierErreur: () => setErreurService(null),
  };
}
