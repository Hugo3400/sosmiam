import { useCallback, useState } from "react";

import { choisirHoraireParDefaut } from "@sos-miam/commun/fonctions/reservations/choisir-horaire-par-defaut";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { MotifRefusReservation, ReservationPro } from "@sos-miam/commun/types/reservation";
import { ANNONCES_COMPTOIR_RESERVATIONS as A } from "~/contenus/textes-comptoir-reservations";
import { TEXTES_RESERVATIONS_PRO } from "~/contenus/textes-reservations-pro";
import { ecrireHeureParis } from "~/fonctions/dates/ecrire-heure-paris";
import { nommerClientReservation } from "~/fonctions/reservations/nommer-client-reservation";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserReservationsPro, type ReponseGesteReservationPro } from "~/hooks/utiliser-reservations-pro";

export type QuandMemeReservation = { reservation: ReservationPro; creneau: string; places: number | null; jourFerme: boolean };

type Options = { lieuNom: string | undefined; annoncer: (texte: string) => void; recaler: () => void };

export function utiliserReponsesReservationsPro({ lieuNom, annoncer, recaler }: Options) {
  const { langue } = utiliserLangue();
  const reservations = utiliserReservationsPro();
  const [choix, setChoix] = useState<Readonly<Record<number, string>>>({});
  const [deplies, setDeplies] = useState<ReadonlySet<number>>(new Set());
  const [quandMeme, setQuandMeme] = useState<QuandMemeReservation | null>(null);
  const [quandMemeOuvert, setQuandMemeOuvert] = useState(false);
  const [aRefuser, setARefuser] = useState<ReservationPro | null>(null);
  const [refusOuvert, setRefusOuvert] = useState(false);
  const [aAnnuler, setAAnnuler] = useState<ReservationPro | null>(null);
  const [annulationOuverte, setAnnulationOuverte] = useState(false);

  const lireChoix = useCallback(
    (r: ReservationPro): string => {
      const voulu = choix[r.id];
      if (voulu && r.propositions.some((p) => p.creneau === voulu)) return voulu;
      return choisirHoraireParDefaut(r.propositions, r.personnes) ?? r.propositions[0]?.creneau ?? r.creneau;
    },
    [choix],
  );

  const suivre = async (r: ReservationPro, geste: Promise<ReponseGesteReservationPro>, modele: string) => {
    const reponse = await geste;
    recaler();
    if (reponse.ok) {
      const valeurs = { nom: nommerClientReservation(r), code: reponse.reservation.code ?? "", heure: ecrireHeureParis(reponse.reservation.creneau) };
      return annoncer(remplirModele(modele, valeurs));
    }
    const message = decrireEchecVisite(reponse.erreur, langue, reponse.details, lieuNom);
    annoncer(`${message.titre}. ${message.texte}`);
  };

  async function accepter(r: ReservationPro, creneau: string, depasser: boolean) {
    const reponse = await reservations.accepter(r.id, { creneau, depasser });
    recaler();
    if (reponse.ok) {
      return annoncer(remplirModele(A.acceptee, { nom: nommerClientReservation(r), heure: ecrireHeureParis(reponse.reservation.creneau), code: reponse.reservation.code ?? "" }));
    }
    if (!depasser && (reponse.erreur === "capacite-depassee" || reponse.erreur === "jour-ferme")) {
      return ouvrirQuandMeme({ reservation: r, creneau, places: reponse.details?.places ?? null, jourFerme: reponse.erreur === "jour-ferme" });
    }
    const message = decrireEchecVisite(reponse.erreur, langue, reponse.details, lieuNom);
    annoncer(`${message.titre}. ${message.texte}`);
  }

  function demanderAcceptation(r: ReservationPro, tient: boolean) {
    const creneau = lireChoix(r);
    if (tient) return void accepter(r, creneau, false);
    const proposition = r.propositions.find((p) => p.creneau === creneau);
    ouvrirQuandMeme({ reservation: r, creneau, places: proposition?.places ?? null, jourFerme: proposition?.jourFerme ?? false });
  }

  function ouvrirQuandMeme(cible: QuandMemeReservation) {
    setQuandMeme(cible);
    setQuandMemeOuvert(true);
  }

  return {
    ...reservations,
    lireChoix,
    choisir: (id: number, creneau: string) => setChoix((avant) => ({ ...avant, [id]: creneau })),
    deplies,
    basculer: (id: number) => setDeplies((avant) => (avant.has(id) ? new Set([...avant].filter((x) => x !== id)) : new Set(avant).add(id))),
    demanderAcceptation,
    quandMeme: { visible: quandMemeOuvert, cible: quandMeme },
    confirmerQuandMeme: () => {
      if (quandMeme) void accepter(quandMeme.reservation, quandMeme.creneau, true);
    },
    fermerQuandMeme: () => setQuandMemeOuvert(false),
    refus: { visible: refusOuvert, cible: aRefuser },
    demanderRefus: (r: ReservationPro) => {
      setARefuser(r);
      setRefusOuvert(true);
    },
    confirmerRefus: (motif: MotifRefusReservation) => {
      setRefusOuvert(false);
      if (aRefuser) void suivre(aRefuser, reservations.refuser(aRefuser.id, motif), TEXTES_RESERVATIONS_PRO.annonceRefusee);
    },
    fermerRefus: () => setRefusOuvert(false),
    annulation: { visible: annulationOuverte, cible: aAnnuler },
    demanderAnnulation: (r: ReservationPro) => {
      setAAnnuler(r);
      setAnnulationOuverte(true);
    },
    confirmerAnnulation: (motif: MotifRefusReservation) => {
      setAnnulationOuverte(false);
      if (aAnnuler) void suivre(aAnnuler, reservations.annuler(aAnnuler.id, motif), A.annulee);
    },
    fermerAnnulation: () => setAnnulationOuverte(false),
    noterArrivee: (r: ReservationPro, venu: boolean) =>
      void suivre(r, reservations.marquerArrivee(r.id, venu), venu ? TEXTES_RESERVATIONS_PRO.annonceVenu : TEXTES_RESERVATIONS_PRO.annonceAbsent),
  };
}
