import { useEffect, useRef } from "react";

import { MESSAGES_SERVICE_PAR_LANGUE } from "@sos-miam/commun/contenus/messages-services";
import { POINTS_AMBASSADEUR } from "@sos-miam/commun/regles/ambassadeurs";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { TEXTES_GESTE_RESCOUSSE_PAR_LANGUE } from "~/contenus/textes-geste-rescousse";
import { utiliserActivite, type FinRescousse, type ResultatRescousse } from "~/hooks/utiliser-activite";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type TextesGesteRescousse = (typeof TEXTES_GESTE_RESCOUSSE_PAR_LANGUE)["fr"];
type MessagesService = (typeof MESSAGES_SERVICE_PAR_LANGUE)["fr"];

/** Un lieu tout juste arrivé peut faire de toi son premier sauveteur : on attend la réponse de l'API, au plus ce temps-là */
const ATTENTE_CONFIRMATION_MS = 3000;

/** Ce qu'on dit quand la rescousse n'a pas pu partir (ou être reprise) : elle est défaite, rien n'est compté */
function decrireEchec(fin: Extract<FinRescousse, { ok: false }>, donnee: boolean, T: TextesGesteRescousse, messages: MessagesService): string {
  if (fin.erreur === "plus-de-rescousse") return T.epuisee;
  if (fin.erreur === "lieu-non-verifie") return T.nonVerifie;
  if (fin.erreur === "connexion-requise") return T.sansSession;
  // Le texte « hors-ligne » des services parle de la porte et du wifi du lieu : une rescousse se donne de partout
  if (fin.erreur === "hors-ligne") {
    return donnee ? T.horsLignePasPartie : T.horsLigneToujoursLa;
  }
  const message = messages[fin.erreur];
  return T.echecService(message.emoji, message.titre.replace(/[\s!.]+$/, ""), donnee);
}

/**
 * L'appui sur « rescousse », avec les mêmes règles et les mêmes mots dans le fil et sur la fiche d'un lieu : donnée,
 * reprise, plus de rescousse, lieu pas encore vérifié. La réponse est immédiate ; la confirmation de l'API dit si tu es le
 * premier sauveteur, ou défait la rescousse si elle n'a pas pu partir. Pour un lieu tout juste arrivé, l'annonce attend cette
 * confirmation (3 s au plus, sinon « Merci »). À appeler une fois le compte vérifié (exiger « rescousse »). `surDonnee` : la
 * bouée qui s'envole, dans le fil.
 */
export function utiliserGesteRescousse(annoncer: (texte: string) => void) {
  const activite = utiliserActivite();
  const T = utiliserTextes(TEXTES_GESTE_RESCOUSSE_PAR_LANGUE);
  const messages = utiliserTextes(MESSAGES_SERVICE_PAR_LANGUE);
  // Dernier appui sur chaque lieu : la confirmation d'un appui plus ancien sur le même lieu ne dit plus rien
  const appuis = useRef(new Map<number, number>());
  const numero = useRef(0);
  const minuteries = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const enCours = minuteries.current;
    return () => {
      for (const m of enCours) clearTimeout(m);
      enCours.clear();
    };
  }, []);

  return function donnerOuReprendre(lieu: Lieu, surDonnee?: () => void) {
    const appui = ++numero.current;
    appuis.current.set(lieu.id, appui);
    const dernier = () => appuis.current.get(lieu.id) === appui;
    // activite est l'état d'avant l'appui
    const reste = activite.restantes - 1;
    const merci = reste > 0 ? T.merci(reste) : T.derniere;
    const premier = T.premierSauveteur(lieu.nom, POINTS_AMBASSADEUR.premierSauveteur);
    let annonce: "attendue" | "faite" = lieu.nouveau ? "attendue" : "faite";
    let attente: ReturnType<typeof setTimeout> | null = null;
    let resultat: ResultatRescousse | undefined;

    const surFin = (fin: FinRescousse) => {
      // Les deux sources confirment toujours après la réponse immédiate ; par prudence, on la laisse passer d'abord
      if (resultat === undefined) return void Promise.resolve().then(() => surFin(fin));
      if (attente) {
        clearTimeout(attente);
        minuteries.current.delete(attente);
        attente = null;
      }
      if (!dernier()) return;
      const etaitAttendue = annonce === "attendue";
      annonce = "faite";
      if (!fin.ok) return annoncer(decrireEchec(fin, resultat !== "annulee", T, messages));
      if (resultat !== "donnee") return;
      if (fin.premierSauveteur) annoncer(premier);
      else if (etaitAttendue) annoncer(merci);
    };

    resultat = activite.basculerRescousse(lieu, surFin);
    if (resultat === "non-verifie") return annoncer(T.nonVerifie);
    if (resultat === "epuisee") return annoncer(T.epuisee);
    if (resultat === "sans-session") return annoncer(T.sansSession);
    if (resultat === "annulee") return annoncer(T.reprise);
    surDonnee?.();
    if (annonce === "faite") return annoncer(merci);
    attente = setTimeout(() => {
      if (attente) minuteries.current.delete(attente);
      attente = null;
      if (annonce !== "attendue" || !dernier()) return;
      annonce = "faite";
      annoncer(merci);
    }, ATTENTE_CONFIRMATION_MS);
    minuteries.current.add(attente);
  };
}
