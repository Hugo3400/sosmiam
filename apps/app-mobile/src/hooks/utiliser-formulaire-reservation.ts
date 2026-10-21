import { useCallback, useEffect, useMemo, useState } from "react";

import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { PERSONNES_RESERVATION_MIN } from "@sos-miam/commun/regles/reservations";
import type { CreneauDisponible } from "@sos-miam/commun/types/reglages-reservations";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { TEXTES_PLAN_B } from "~/contenus/textes-reserver-table";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { annoncerLecteurEcran } from "~/fonctions/interaction/annoncer-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { ajusterChoixHoraires, type ChoixHoraires } from "~/fonctions/reservations/ajuster-choix-horaires";
import { basculerHoraireSecours } from "~/fonctions/reservations/basculer-horaire-secours";
import { ecrireNombrePersonnes } from "~/fonctions/reservations/ecrire-nombre-personnes";
import { garderCreneauxATemps } from "~/fonctions/reservations/garder-creneaux-a-temps";
import { utiliserCreneauxReservation } from "~/hooks/utiliser-creneaux-reservation";
import { utiliserJoursReservation } from "~/hooks/utiliser-jours-reservation";
import { utiliserValeurTemporisee } from "~/hooks/utiliser-valeur-temporisee";

const PERSONNES_PAR_DEFAUT = 2;
const ATTENTE_PERSONNES_MS = 450;
const AUCUN_CHOIX: ChoixHoraires = { principal: null, secours: [] };

export function utiliserFormulaireReservation(lieu: Lieu, maintenantMs: number) {
  const [personnes, setPersonnes] = useState(PERSONNES_PAR_DEFAUT);
  const personnesLues = utiliserValeurTemporisee(personnes, ATTENTE_PERSONNES_MS);
  const [relecture, setRelecture] = useState(0);
  const jours = utiliserJoursReservation(lieu, personnesLues, maintenantMs, relecture);
  const [jourVoulu, setJourVoulu] = useState<string | null>(null);
  const premierOuvert = jours.jours.find((j) => j.etat === "ouvert")?.jour ?? jours.jours[0]?.jour ?? "";
  const jour = jourVoulu && jours.jours.some((j) => j.jour === jourVoulu) ? jourVoulu : premierOuvert;
  const creneaux = utiliserCreneauxReservation(lieu.id, jour, personnesLues, relecture);
  const [choix, setChoix] = useState<ChoixHoraires>(AUCUN_CHOIX);
  const [planBOuvert, setPlanBOuvert] = useState(false);
  const [ajustement, setAjustement] = useState<string | null>(null);
  const [planBPlein, setPlanBPlein] = useState(false);
  const relire = useCallback(() => setRelecture((n) => n + 1), []);

  const acceptation = jours.acceptation ?? creneaux.lus?.acceptation ?? "manuelle";
  const disponibles = useMemo<CreneauDisponible[]>(
    () => (creneaux.lus ? garderCreneauxATemps(jour, creneaux.lus.disponibles, jours.delai, maintenantMs) : []),
    [creneaux.lus, jour, jours.delai, maintenantMs],
  );
  const cleDisponibles = disponibles.map((c) => c.heure).join(",");

  useEffect(() => {
    if (personnes > jours.personnesMax) setPersonnes(Math.max(PERSONNES_RESERVATION_MIN, jours.personnesMax));
  }, [personnes, jours.personnesMax]);

  useEffect(() => {
    if (!creneaux.frais) return;
    const ajuste = ajusterChoixHoraires(choix, cleDisponibles === "" ? [] : cleDisponibles.split(","));
    if (ajuste.principalParti === null && ajuste.secoursPartis.length === 0) return;
    setChoix({ principal: ajuste.principal, secours: ajuste.secours });
    const texte = ajuste.principalParti
      ? remplirModele(TEXTES_PLAN_B.principalParti, { heure: formaterHeure(ajuste.principalParti), personnes: ecrireNombrePersonnes(personnesLues) })
      : remplirModele(ajuste.secoursPartis.length > 1 ? TEXTES_PLAN_B.secoursPartis : TEXTES_PLAN_B.secoursParti, { heures: ajuste.secoursPartis.map(formaterHeure).join(", ") });
    setAjustement(texte);
    annoncerLecteurEcran(texte);
  }, [creneaux.frais, cleDisponibles, choix, personnesLues]);

  const oublierAjustement = () => {
    setAjustement(null);
    setPlanBPlein(false);
  };

  const choisirJour = useCallback((suivant: string) => {
    setJourVoulu(suivant);
    setChoix(AUCUN_CHOIX);
    setPlanBOuvert(false);
    setAjustement(null);
    setPlanBPlein(false);
  }, []);

  function choisirHeure(heure: string) {
    setChoix((avant) => ({ principal: heure, secours: avant.secours.filter((h) => h !== heure) }));
    oublierAjustement();
  }

  function basculerSecours(heure: string) {
    const bascule = basculerHoraireSecours(choix.secours, heure);
    setPlanBPlein(bascule.refuse);
    if (bascule.refuse) {
      vibrerLegerement();
      return annoncerLecteurEcran(TEXTES_PLAN_B.max);
    }
    setChoix({ ...choix, secours: bascule.secours });
    setAjustement(null);
  }

  function fermerPlanB() {
    setChoix((avant) => ({ ...avant, secours: [] }));
    setPlanBOuvert(false);
    oublierAjustement();
  }

  return {
    personnes,
    changerPersonnes: (nombre: number) => {
      setPersonnes(nombre);
      oublierAjustement();
    },
    jours,
    jour,
    choisirJour,
    creneaux,
    disponibles,
    acceptation,
    choix,
    choisirHeure,
    basculerSecours,
    planBOuvert,
    ouvrirPlanB: () => setPlanBOuvert(true),
    fermerPlanB,
    planBPlein,
    ajustement,
    relire,
  };
}
