import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LONGUEUR_MAX_CONTESTATION, LONGUEUR_MIN_CONTESTATION } from "@sos-miam/commun/regles/signalement";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { LimitationCompteApi } from "@sos-miam/commun/types/limitation-compte";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";

/** « trop-court » ou « trop-long » : rien n'est parti ; sinon l'erreur du serveur, ou null : la contestation est partie */
export type ResultatContestationLimitation = "trop-court" | "trop-long" | ErreurService | null;

export type EtatLimitationCompte = {
  /** Faux pendant la première lecture */
  pret: boolean;
  /** La lecture a raté (réseau) : on ne sait pas si le compte est limité */
  ratee: boolean;
  /** La limitation en cours, sinon celle à venir, sinon null ; toujours null sans compte (visite) */
  limitation: LimitationCompteApi | null;
  /** Une seule fois, pendant la limitation : 10 à 1 000 caractères (espaces autour retirés) */
  contester: (texte: string) => Promise<ResultatContestationLimitation>;
  relire: () => Promise<boolean>;
};

/** Des refus qui disent que la limitation lue n'est plus à jour (déjà contestée ailleurs, finie ou levée) : on la relit */
const REFUS_A_RELIRE: readonly ErreurService[] = ["deja-conteste", "aucune-limitation"];

/**
 * « Ton compte est limité » (décision de Hugo du 15/10/2026) : la limitation du compte connecté, lue sur l'API à l'ouverture
 * de l'écran qui s'en sert (Décisions de la modération) et quand on le demande, et sa contestation. Visite : rien, aucune
 * demande ne part.
 */
export function utiliserLimitationCompte(): EtatLimitationCompte {
  const source = utiliserSourceSociale();
  const { comptes } = utiliserSession();
  const avecCompte = source === "compte";
  const [limitation, setLimitation] = useState<LimitationCompteApi | null>(null);
  const [pret, setPret] = useState(!avecCompte);
  const [ratee, setRatee] = useState(false);
  const generation = useRef(0);

  const relire = useCallback(async () => {
    if (!avecCompte) return true;
    const g = ++generation.current;
    const r = await comptes.lireLimitation().catch(() => null);
    // Une API qui ne connaît pas encore la route (404 « introuvable », avant son redémarrage) ne limite personne : « Tout est
    // calme », pas une panne
    const lue = !!r?.ok || (r?.ok === false && r.erreur === "introuvable");
    if (g !== generation.current) return lue;
    if (r?.ok) setLimitation(r.limitation ?? null);
    else if (lue) setLimitation(null);
    setRatee(!lue);
    setPret(true);
    return lue;
  }, [avecCompte, comptes]);

  useEffect(() => {
    if (!avecCompte) {
      generation.current++;
      setLimitation(null);
      setRatee(false);
      setPret(true);
      return;
    }
    setPret(false);
    void relire();
  }, [avecCompte, relire]);

  const contester = useCallback(
    async (texte: string): Promise<ResultatContestationLimitation> => {
      const propre = texte.trim();
      if (propre.length < LONGUEUR_MIN_CONTESTATION) return "trop-court";
      if (propre.length > LONGUEUR_MAX_CONTESTATION) return "trop-long";
      if (!avecCompte) return "aucune-limitation";
      const r = await comptes.contesterLimitation(propre).catch(() => ({ ok: false as const, erreur: "hors-ligne" as ErreurService }));
      if (!r.ok) {
        if (REFUS_A_RELIRE.includes(r.erreur)) void relire();
        return r.erreur;
      }
      // Partie : la carte le dit tout de suite, sans attendre une relecture
      setLimitation((avant) => (avant ? { ...avant, contestation: propre, contesteLe: new Date().toISOString(), peutContester: false } : avant));
      return null;
    },
    [avecCompte, comptes, relire],
  );

  return useMemo((): EtatLimitationCompte => ({ pret, ratee, limitation, contester, relire }), [pret, ratee, limitation, contester, relire]);
}
