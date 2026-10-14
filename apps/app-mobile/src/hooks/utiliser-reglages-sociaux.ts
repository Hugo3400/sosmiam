import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { ReglagesSociaux } from "@sos-miam/commun/types/social";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";

export type EtatReglagesSociaux = {
  /** Vrai avec un compte connecté : les interrupteurs « Ta bande » ne s'affichent qu'alors */
  disponible: boolean;
  /** Faux pendant la lecture */
  pret: boolean;
  /** Tes réglages ; tant que ton profil social n'existe pas, ceux qu'il aura (tout allumé) */
  reglages: ReglagesSociaux;
  /**
   * Change un ou plusieurs réglages : l'interrupteur bouge tout de suite, puis le serveur ; en cas de refus il revient en
   * arrière et l'erreur est rendue (« pseudo-requis » : choisis d'abord ton pseudo), sinon null
   */
  changer: (changements: Partial<ReglagesSociaux>) => Promise<ErreurService | null>;
};

/** Les réglages d'un profil social qui vient d'être créé (valeurs par défaut du serveur) */
const PAR_DEFAUT: ReglagesSociaux = { trouvable: true, suggerable: true, activitePartagee: true, pushSocial: true };

/**
 * Réglages › Confidentialité, bloc « Ta bande » : « Qu'on me trouve par mon pseudo » (trouvable), « Me proposer à d'autres »
 * (suggerable), « Montrer mon activité à ma bande » (activitePartagee) et « Notifications de ma bande » (pushSocial). Lus
 * sur le serveur (GET /app/social/moi) et changés par PATCH /app/social/moi, qui crée ton profil social s'il manque (il
 * faut un pseudo). Démo et visite : pas disponibles.
 */
export function utiliserReglagesSociaux(): EtatReglagesSociaux {
  const source = utiliserSourceSociale();
  const { sociaux } = utiliserSession();
  const disponible = source === "compte";
  const [reglages, setReglages] = useState<ReglagesSociaux>(PAR_DEFAUT);
  const [pret, setPret] = useState(false);
  const courant = useRef(reglages);
  courant.current = reglages;

  useEffect(() => {
    if (!disponible) {
      setReglages(PAR_DEFAUT);
      setPret(false);
      return;
    }
    let actif = true;
    void sociaux.social
      .lireMoi()
      .catch(() => null)
      .then((r) => {
        if (!actif) return;
        if (r?.ok && r.moi) setReglages(r.moi.reglages);
        setPret(true);
      });
    return () => {
      actif = false;
    };
  }, [disponible, sociaux]);

  const changer = useCallback(
    async (changements: Partial<ReglagesSociaux>): Promise<ErreurService | null> => {
      if (!disponible) return "session-app-requise";
      const avant = courant.current;
      setReglages({ ...avant, ...changements });
      const r = await sociaux.social.modifierReglages(changements).catch(() => ({ ok: false as const, erreur: "hors-ligne" as ErreurService }));
      if (!r.ok) {
        // Revenu en arrière, seulement sur ce qui vient d'être changé
        setReglages((maintenant) => ({ ...maintenant, ...Object.fromEntries(Object.keys(changements).map((cle) => [cle, avant[cle as keyof ReglagesSociaux]])) }));
        return r.erreur;
      }
      setReglages(r.moi.reglages);
      return null;
    },
    [disponible, sociaux],
  );

  return useMemo(() => ({ disponible, pret, reglages, changer }), [disponible, pret, reglages, changer]);
}
