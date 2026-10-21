import { useCallback, useState } from "react";

import type { ReponseReglagesReservations } from "@sos-miam/commun/client-api/contrat-reglages-reservations";
import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { JOURS_FERMES_MAX } from "@sos-miam/commun/regles/reglages-reservations";
import { TEXTES_FERMER_JOUR } from "~/contenus/textes-comptoir-reservations";
import { TEXTES_FEUILLE_JOURS_FERMES, TEXTES_REGLAGES_RESERVATIONS as T } from "~/contenus/textes-reglages-reservations";
import { ecrireJourEnLettres } from "~/fonctions/reservations/ecrire-jour-en-lettres";

type Options = {
  fermerJour: (jour: string, ferme: boolean) => Promise<ReponseReglagesReservations>;
  joursFermes: readonly string[];
  aujourdhui: string;
  annoncer: (texte: string) => void;
};

export function utiliserJoursFermesPro({ fermerJour, joursFermes, aujourdhui, annoncer }: Options) {
  const [enCours, setEnCours] = useState<ReadonlySet<string>>(new Set());
  const [erreur, setErreur] = useState<string | null>(null);

  const basculer = useCallback(
    async (jour: string, ferme: boolean) => {
      if (ferme && !joursFermes.includes(jour) && joursFermes.length >= JOURS_FERMES_MAX) return setErreur(TEXTES_FEUILLE_JOURS_FERMES.joursMax);
      setErreur(null);
      setEnCours((avant) => new Set(avant).add(jour));
      const reponse = await fermerJour(jour, ferme);
      setEnCours((avant) => new Set([...avant].filter((j) => j !== jour)));
      if (reponse.ok) {
        if (jour === aujourdhui) return annoncer(ferme ? TEXTES_FERMER_JOUR.annonceFerme : TEXTES_FERMER_JOUR.annonceRouvert);
        return annoncer(remplirModele(ferme ? T.annonceJourFerme : T.annonceJourRouvert, { jour: ecrireJourEnLettres(jour, aujourdhui) }));
      }
      if (reponse.erreur === "reglages-invalides") return setErreur(TEXTES_FEUILLE_JOURS_FERMES.joursMax);
      const message = MESSAGES_SERVICE[reponse.erreur];
      const texte = `${message.titre}. ${message.texte}`;
      setErreur(texte);
      annoncer(texte);
    },
    [fermerJour, joursFermes, aujourdhui, annoncer],
  );

  return { enCours, erreur, basculer };
}
