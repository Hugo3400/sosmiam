import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Pote } from "@sos-miam/commun/types/potes";
import type { LienSuiviApi } from "@sos-miam/commun/types/suivis";
import { convertirPersonneEnPote } from "~/fonctions/communaute/convertir-personne-en-pote";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserSuivisPersonnes, type SensSuivi } from "~/hooks/utiliser-suivis-personnes";

export type EtatLiensDe = {
  /** null : en cours de lecture ; « ferme » : réservé à sa bande (compte connecté) */
  liste: Pote[] | "ferme" | null;
  /** Combien attendent encore sur le serveur (0 : tout est là) */
  restants: number;
  chargerSuite: () => void;
  /** La lecture a raté (réseau) : rien à montrer pour l'instant */
  ratee: boolean;
};

type Lecture = { cle: string; liens: LienSuiviApi[]; suite: string | null; etat: "chargement" | "pret" | "ferme" | "ratee" };

const rienAFaire = () => {};

/**
 * Les abonnés ou les abonnements d'une autre personne. Compte connecté : lus sur le serveur, 50 par page
 * (GET /app/personnes/:id/abonnes ou /abonnements), seulement si tu es dans sa bande (« ferme » sinon, comme le serveur, qui
 * répond « profil-prive ») ; la communauté connaît ensuite ces personnes. Visite ou toi : utiliserSuivisPersonnes.
 */
export function utiliserLiensDe(id: string, sens: SensSuivi): EtatLiensDe {
  const suivis = utiliserSuivisPersonnes();
  const { sociaux } = utiliserSession();
  const { trouverPote, noterPersonne, bloques } = utiliserCommunaute();
  const monId = utiliserMonId();
  const cle = `${id}:${sens}`;
  const duServeur = suivis.source === "compte" && id !== "" && id !== monId;
  const ouvert = duServeur && suivis.pret && (sens === "abonnes" ? suivis.abonnesDe(id) : suivis.abonnementsDe(id)) !== "ferme";
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const enCours = useRef(false);

  useEffect(() => {
    if (!ouvert) return;
    let actif = true;
    setLecture({ cle, liens: [], suite: null, etat: "chargement" });
    void sociaux.social.listerLiensDe(id, sens).then((r) => {
      if (!actif) return;
      if (!r.ok) return setLecture({ cle, liens: [], suite: null, etat: r.erreur === "profil-prive" ? "ferme" : "ratee" });
      r.liens.forEach((l) => noterPersonne(l.personne));
      setLecture({ cle, liens: r.liens, suite: r.suite, etat: "pret" });
    });
    return () => {
      actif = false;
    };
    // noterPersonne change à chaque relecture de la bande : la lecture ne repart pas pour autant
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouvert, cle, sociaux]);

  const suite = lecture?.cle === cle ? lecture.suite : null;
  const chargerSuite = useCallback(() => {
    if (!suite || enCours.current) return;
    enCours.current = true;
    void sociaux.social
      .listerLiensDe(id, sens, suite)
      .then((r) => {
        if (!r.ok) return;
        r.liens.forEach((l) => noterPersonne(l.personne));
        setLecture((avant) => {
          if (!avant || avant.cle !== cle || avant.suite !== suite) return avant;
          const deja = new Set(avant.liens.map((l) => l.personne.id));
          return { ...avant, liens: [...avant.liens, ...r.liens.filter((l) => !deja.has(l.personne.id))], suite: r.suite };
        });
      })
      .finally(() => {
        enCours.current = false;
      });
  }, [suite, sociaux, id, sens, cle, noterPersonne]);

  const compteur = suivis.compteursDe(id)?.[sens] ?? 0;
  return useMemo((): EtatLiensDe => {
    if (!duServeur) {
      const liste = suivis.pret ? (sens === "abonnes" ? suivis.abonnesDe(id) : suivis.abonnementsDe(id)) : null;
      return { liste, restants: 0, chargerSuite: rienAFaire, ratee: false };
    }
    if (!suivis.pret) return { liste: null, restants: 0, chargerSuite: rienAFaire, ratee: false };
    if (!ouvert) return { liste: "ferme", restants: 0, chargerSuite: rienAFaire, ratee: false };
    if (!lecture || lecture.cle !== cle || lecture.etat === "chargement") return { liste: null, restants: 0, chargerSuite: rienAFaire, ratee: false };
    if (lecture.etat === "ferme") return { liste: "ferme", restants: 0, chargerSuite: rienAFaire, ratee: false };
    if (lecture.etat === "ratee") return { liste: null, restants: 0, chargerSuite: rienAFaire, ratee: true };
    const idsBloques = new Set(bloques.map((p) => p.id));
    const liste = lecture.liens.filter((l) => !idsBloques.has(l.personne.id)).map((l) => trouverPote(l.personne.id) ?? convertirPersonneEnPote(l.personne));
    // Le compteur du profil peut dater un peu : tant qu'il y a une suite, il en reste au moins une
    const restants = lecture.suite ? Math.max(1, compteur - lecture.liens.length) : 0;
    return { liste, restants, chargerSuite, ratee: false };
  }, [duServeur, suivis, sens, id, ouvert, lecture, cle, bloques, trouverPote, compteur, chargerSuite]);
}
