import { useEffect, useRef } from "react";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { POINTS_AMBASSADEUR } from "@sos-miam/commun/regles/ambassadeurs";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { utiliserActivite, type FinRescousse, type ResultatRescousse } from "~/hooks/utiliser-activite";

/** Un lieu tout juste arrivé peut faire de toi son premier sauveteur : on attend la réponse de l'API, au plus ce temps-là */
const ATTENTE_CONFIRMATION_MS = 3000;

const NON_VERIFIE = "Ce lieu n'a pas encore de compte SOS Miam : invite-le ! 📣";
const EPUISEE = "Plus de rescousse cette semaine, reviens lundi ! 🛟";
const SANS_SESSION = "🔑 Reconnecte-toi à ton compte pour donner tes rescousses";

/** Ce qu'on dit quand la rescousse n'a pas pu partir (ou être reprise) : elle est défaite, rien n'est compté */
function decrireEchec(fin: Extract<FinRescousse, { ok: false }>, donnee: boolean): string {
  if (fin.erreur === "plus-de-rescousse") return EPUISEE;
  if (fin.erreur === "lieu-non-verifie") return NON_VERIFIE;
  if (fin.erreur === "connexion-requise") return SANS_SESSION;
  // Le texte « hors-ligne » des services parle de la porte et du wifi du lieu : une rescousse se donne de partout
  if (fin.erreur === "hors-ligne") {
    return donnee ? "📶 Pas de réseau : ta rescousse n'est pas partie, réessaie dans un instant" : "📶 Pas de réseau : ta rescousse est toujours là, réessaie dans un instant";
  }
  const message = MESSAGES_SERVICE[fin.erreur];
  return `${message.emoji} ${message.titre.replace(/[\s!.]+$/, "")}, ${donnee ? "ta rescousse n'est pas partie" : "ta rescousse est toujours là"}`;
}

/**
 * L'appui sur « rescousse », avec les mêmes règles et les mêmes mots dans le fil et sur la fiche d'un lieu : donnée,
 * reprise, plus de rescousse, lieu pas encore vérifié. La réponse est immédiate ; la confirmation (de l'API avec un compte,
 * tout de suite en démo) dit si tu es le premier sauveteur, ou défait la rescousse si elle n'a pas pu partir. Pour un lieu
 * tout juste arrivé, l'annonce attend cette confirmation (3 s au plus, sinon « Merci »). À appeler une fois le compte vérifié
 * (exiger « rescousse »). `surDonnee` : la bouée qui s'envole, dans le fil.
 */
export function utiliserGesteRescousse(annoncer: (texte: string) => void) {
  const activite = utiliserActivite();
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
    const merci = reste > 0 ? `🛟 Merci ! Encore ${reste} rescousse${reste > 1 ? "s" : ""} cette semaine` : "Dernière rescousse donnée, merci pour eux ! 🦸";
    const premier = `🚀 Premier sauveteur ! ${lieu.nom} vient d'arriver et tu es déjà là : +${POINTS_AMBASSADEUR.premierSauveteur} points`;
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
      if (!fin.ok) return annoncer(decrireEchec(fin, resultat !== "annulee"));
      if (resultat !== "donnee") return;
      if (fin.premierSauveteur) annoncer(premier);
      else if (etaitAttendue) annoncer(merci);
    };

    resultat = activite.basculerRescousse(lieu, surFin);
    if (resultat === "non-verifie") return annoncer(NON_VERIFIE);
    if (resultat === "epuisee") return annoncer(EPUISEE);
    if (resultat === "sans-session") return annoncer(SANS_SESSION);
    if (resultat === "annulee") return annoncer("Rescousse reprise");
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
