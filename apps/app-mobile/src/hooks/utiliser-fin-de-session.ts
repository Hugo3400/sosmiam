import { useEffect, useRef } from "react";

import { utiliserEffacementLocal } from "~/hooks/utiliser-effacement-local";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { poserSessionPerdue } from "~/stockage/session-perdue";

/**
 * Hors démo, un profil sur le téléphone sans session n'a plus de sens : ton compte vit sur le serveur. Quand le serveur dit
 * la session expirée (déconnecté partout, mot de passe changé, compte supprimé ailleurs), ou qu'au lancement il reste un
 * profil sans session, l'app oublie ce qu'elle gardait et revient à l'accueil, où « Me connecter » t'attend avec un mot
 * pour dire pourquoi. Une déconnexion demandée, elle, efface déjà tout de son côté.
 */
export function utiliserFinDeSession(): void {
  const session = utiliserSession();
  const { profil, chargement } = utiliserProfil();
  const effacement = utiliserEffacementLocal();
  const auLancement = useRef(true);
  const enCours = useRef(false);

  useEffect(() => {
    if (!session.pret || chargement) return;
    const lancement = auLancement.current;
    auLancement.current = false;
    if (enCours.current || !profil || session.connecte) return;
    // Au lancement : un profil resté sans session ; ensuite : seulement une session que le serveur a dite expirée
    if (!lancement && !session.perdue) return;
    enCours.current = true;
    void (async () => {
      await poserSessionPerdue();
      await effacement.toutEffacer();
      enCours.current = false;
    })();
  }, [session.pret, session.connecte, session.perdue, profil, chargement, effacement]);
}
