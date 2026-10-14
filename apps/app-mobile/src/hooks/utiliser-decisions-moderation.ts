import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LONGUEUR_MAX_CONTESTATION, LONGUEUR_MIN_CONTESTATION } from "@sos-miam/commun/regles/signalement";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { DecisionModerationApi } from "@sos-miam/commun/types/signalement";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";

export type EtatDecisionsModeration = {
  /** Faux pendant la première lecture */
  pret: boolean;
  /** La lecture a raté (réseau) */
  ratee: boolean;
  /** Les décisions sur tes contenus et sur tes signalements, les plus récentes d'abord (50 au plus) ; vides sans compte */
  decisions: DecisionModerationApi[];
  /**
   * Conteste une décision (une fois, pendant 6 mois) : « trop-court » ou « trop-long » sans rien envoyer ; sinon l'erreur
   * du serveur (decision-inconnue, deja-contestee, contestation-hors-delai…), ou null : envoyée, la décision passe à « envoyee »
   */
  contester: (id: string, texte: string) => Promise<"trop-court" | "trop-long" | ErreurService | null>;
  relire: () => Promise<boolean>;
};

/**
 * « Décisions de la modération » (règlement européen sur les services numériques) : ce que l'équipe a décidé sur tes
 * contenus et sur tes signalements, avec la règle en cause et son explication, jamais qui a signalé ; et la contestation.
 * Compte connecté seulement (démo et visite : rien). Lu à l'ouverture de l'écran.
 */
export function utiliserDecisionsModeration(): EtatDecisionsModeration {
  const source = utiliserSourceSociale();
  const { sociaux } = utiliserSession();
  const avecCompte = source === "compte";
  const [decisions, setDecisions] = useState<DecisionModerationApi[]>([]);
  const [pret, setPret] = useState(!avecCompte);
  const [ratee, setRatee] = useState(false);
  const generation = useRef(0);

  const relire = useCallback(async () => {
    if (!avecCompte) return true;
    const g = ++generation.current;
    const r = await sociaux.moderation.listerDecisions().catch(() => null);
    if (g !== generation.current) return !!r?.ok;
    if (r?.ok) setDecisions(r.decisions);
    setRatee(!r?.ok);
    setPret(true);
    return !!r?.ok;
  }, [avecCompte, sociaux]);

  useEffect(() => {
    if (!avecCompte) {
      setDecisions([]);
      setPret(true);
      return;
    }
    setPret(false);
    void relire();
  }, [avecCompte, relire]);

  return useMemo(
    (): EtatDecisionsModeration => ({
      pret,
      ratee,
      decisions,
      contester: async (id, texte) => {
        const propre = texte.trim();
        if (propre.length < LONGUEUR_MIN_CONTESTATION) return "trop-court";
        if (propre.length > LONGUEUR_MAX_CONTESTATION) return "trop-long";
        const r = await sociaux.moderation.contester(id, propre).catch(() => ({ ok: false as const, erreur: "hors-ligne" as ErreurService }));
        if (!r.ok) return r.erreur;
        setDecisions((avant) => avant.map((d) => (d.id === id ? { ...d, contestation: "envoyee" } : d)));
        return null;
      },
      relire,
    }),
    [pret, ratee, decisions, sociaux, relire],
  );
}
