import { useEffect, useRef, useState } from "react";

import { convertirProfilServeur } from "~/fonctions/compte/convertir-profil-serveur";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { effacerRepriseCompte, lireRepriseCompte } from "~/stockage/compte-de-cote";

/**
 * Au lancement qui suit « Quitter la démo » (reconnexion rapide) : la session du compte mis de côté est déjà en place, on
 * réinstalle son profil depuis le serveur pour rouvrir l'app directement sur les onglets. Vrai tant que ce n'est pas fini
 * (l'écran de démarrage reste affiché). Session expirée entre-temps : on laisse l'app à la bienvenue.
 */
export function utiliserRepriseCompte(): boolean {
  const session = utiliserSession();
  const { profil, chargement, enregistrer } = utiliserProfil();
  const [enCours, setEnCours] = useState(true);
  const lancee = useRef(false);

  useEffect(() => {
    if (!session.pret || chargement || lancee.current) return;
    lancee.current = true;
    void (async () => {
      try {
        if (!(await lireRepriseCompte())) return;
        await effacerRepriseCompte();
        if (!session.connecte || profil) return;
        const lu = await session.comptes.lireProfil();
        const local = lu.ok ? convertirProfilServeur(lu.profil, undefined) : null;
        if (local) await enregistrer(local);
      } finally {
        setEnCours(false);
      }
    })();
  }, [session, chargement, profil, enregistrer]);

  return enCours;
}
