import { useCallback, useEffect, useRef, useState } from "react";

import { GIFS_PAR_PAGE, MAX_PAGE_GIF } from "@sos-miam/commun/regles/chat";
import type { GifApi } from "@sos-miam/commun/types/messagerie";
import { construireRequeteGif } from "~/fonctions/chat/construire-requete-gif";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserValeurTemporisee } from "~/hooks/utiliser-valeur-temporisee";

export type EtatRechercheGifs = "chargement" | "pret" | "vide" | "indisponible" | "reseau";

const DELAI_RECHERCHE_MS = 400;

export function utiliserRechercheGifs(actif: boolean, texte: string, motPastille: string | null) {
  const { chercherGifs } = utiliserConversations();
  const texteTemporise = utiliserValeurTemporisee(texte, DELAI_RECHERCHE_MS);
  const requete = construireRequeteGif(texteTemporise, motPastille);
  const cle = requete.type === "tendances" ? "tendances" : `recherche:${requete.q}`;
  const [resultat, setResultat] = useState<{ cle: string; gifs: GifApi[]; page: number; fin: boolean; etat: EtatRechercheGifs }>({ cle: "", gifs: [], page: -1, fin: false, etat: "chargement" });
  const [suiteEnCours, setSuiteEnCours] = useState(false);
  const enCours = useRef<string | null>(null);
  const derniere = useRef({ requete, cle, chercherGifs });
  derniere.current = { requete, cle, chercherGifs };

  const charger = useCallback(async (page: number) => {
    const { requete: demandee, cle: cleDemandee, chercherGifs: chercher } = derniere.current;
    const jeton = `${cleDemandee}#${page}`;
    if (enCours.current === jeton) return;
    enCours.current = jeton;
    setSuiteEnCours(page > 0);
    const r = await chercher(demandee, page);
    if (enCours.current !== jeton) return;
    enCours.current = null;
    setSuiteEnCours(false);
    setResultat((avant) => {
      if ("erreur" in r) return page === 0 ? { cle: cleDemandee, gifs: [], page: 0, fin: true, etat: r.erreur } : { ...avant, fin: true };
      const deja = page === 0 || avant.cle !== cleDemandee ? [] : avant.gifs;
      const connus = new Set(deja.map((g) => g.id));
      const gifs = [...deja, ...r.gifs.filter((g) => !connus.has(g.id))];
      return { cle: cleDemandee, gifs, page, fin: r.gifs.length < GIFS_PAR_PAGE || page >= MAX_PAGE_GIF, etat: gifs.length === 0 ? "vide" : "pret" };
    });
  }, []);

  useEffect(() => {
    if (!actif) return;
    void charger(0);
  }, [actif, cle, charger]);

  const aJour = resultat.cle === cle;
  const chargerSuite = useCallback(() => {
    if (!aJour || resultat.fin || resultat.etat !== "pret" || enCours.current) return;
    void charger(resultat.page + 1);
  }, [aJour, resultat, charger]);

  return {
    gifs: aJour ? resultat.gifs : [],
    etat: aJour ? resultat.etat : ("chargement" as const),
    chargementSuite: aJour && suiteEnCours,
    chargerSuite,
    reessayer: () => void charger(0),
  };
}
