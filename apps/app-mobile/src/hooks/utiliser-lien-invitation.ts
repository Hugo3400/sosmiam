import { useCallback, useEffect, useState } from "react";

import { creerLienInvitation } from "@sos-miam/commun/fonctions/potes/creer-lien-invitation";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";
import { lireCodeInvitation } from "~/stockage/code-invitation";

// Démo : le code du téléphone, lu une seule fois par ouverture de l'app (partout le même lien)
let lectureLocale: Promise<string> | null = null;
let codeLocal: string | null = null;

export type EtatLienInvitation = {
  /** Ton lien (« https://sosmiam.fr/invitation/<pseudo>#c=<code> »), aussi dans ton QR code ; null le temps de le lire */
  lien: string | null;
  /** Le lien n'a pas pu être lu (réseau, pas encore de pseudo côté serveur) ; null sinon */
  erreur: ErreurService | null;
  /** « Changer mon lien » (compte connecté) : l'ancien lien et l'ancien QR code ne marchent plus ; null en démo */
  changer: (() => Promise<ErreurService | null>) | null;
};

/**
 * Ton lien d'invitation et le code secret qu'il porte. Compte connecté : créé et gardé chiffré par le serveur, sans date de
 * fin, le même sur tous tes téléphones (GET /app/bande/invitation), et changé d'un geste. Démo : un code tiré une fois et
 * gardé dans le coffre-fort du téléphone, vérifié nulle part.
 */
export function utiliserLienInvitation(pseudo: string): EtatLienInvitation {
  const source = utiliserSourceSociale();
  const { sociaux } = utiliserSession();
  const [code, setCode] = useState<string | null>(codeLocal);
  const [serveur, setServeur] = useState<{ lien: string | null; erreur: ErreurService | null }>({ lien: null, erreur: null });

  useEffect(() => {
    if (source === "compte") {
      let actif = true;
      void sociaux.bande.lireInvitation().then((r) => {
        if (actif) setServeur(r.ok ? { lien: r.invitation.lien, erreur: null } : { lien: null, erreur: r.erreur });
      });
      return () => {
        actif = false;
      };
    }
    if (codeLocal) return;
    let actif = true;
    lectureLocale ??= lireCodeInvitation().then((lu) => (codeLocal = lu));
    void lectureLocale.then((lu) => {
      if (actif) setCode(lu);
    });
    return () => {
      actif = false;
    };
    // Le pseudo change (choisi dans tes infos) : le serveur refait le lien
  }, [source, sociaux, pseudo]);

  const changer = useCallback(async () => {
    const r = await sociaux.bande.renouvelerInvitation();
    if (!r.ok) return r.erreur;
    setServeur({ lien: r.invitation.lien, erreur: null });
    return null;
  }, [sociaux]);

  if (source === "compte") return { ...serveur, changer };
  return { lien: code && pseudo ? creerLienInvitation(pseudo, code) : null, erreur: null, changer: null };
}
