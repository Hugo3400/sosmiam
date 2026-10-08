import { router } from "expo-router";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { FeuilleCreerCompte } from "~/composants/invite/FeuilleCreerCompte";
import { ContexteCompteRequis, type ExigerCompte, type RaisonCompte } from "~/hooks/utiliser-compte-requis";
import { utiliserProfil } from "~/hooks/utiliser-profil";

// Demandée mais pas montrée au bout de ce délai (iOS refuse d'ouvrir une fenêtre pendant qu'une autre se referme, et ne réessaie
// pas) : la feuille repasse à « fermée », pour que le prochain geste réservé l'ouvre bien au lieu de ne rien faire
const SECOURS_OUVERTURE = 1500;

/**
 * Fournit utiliserCompteRequis à toute l'app, et la feuille « Crée ton compte » qui s'ouvre quand on touche un geste réservé
 * aux inscrits pendant la visite sans compte. « Je m'inscris » ouvre l'inscription par-dessus l'écran en cours : une fois
 * le compte créé, on y revient, avec le compte.
 */
export function FournisseurInvite({ children }: { children: ReactNode }) {
  const { profil } = utiliserProfil();
  const [raison, setRaison] = useState<RaisonCompte>("rescousse");
  const [visible, setVisible] = useState(false);
  // Lu au moment du geste : la fonction rendue ne change jamais, même quand le profil arrive
  const aUnCompte = useRef(profil !== null);

  useLayoutEffect(() => {
    aUnCompte.current = profil !== null;
  }, [profil]);

  // Inscrit entre-temps : plus rien à demander
  useEffect(() => {
    if (profil !== null) setVisible(false);
  }, [profil]);

  // Vrai une fois la feuille vraiment à l'écran (onShow)
  const montree = useRef(false);
  useEffect(() => {
    if (!visible) return;
    montree.current = false;
    const secours = setTimeout(() => {
      if (!montree.current) setVisible(false);
    }, SECOURS_OUVERTURE);
    return () => clearTimeout(secours);
  }, [visible]);
  const marquerMontree = useCallback(() => {
    montree.current = true;
  }, []);

  const exigerCompte = useCallback<ExigerCompte>((nouvelle) => {
    if (aUnCompte.current) return true;
    setRaison(nouvelle);
    setVisible(true);
    return false;
  }, []);

  const fermer = useCallback(() => setVisible(false), []);
  // Le parcours commence au choix Apple, Google ou e-mail ; « Retour » ramène à l'écran d'où l'on vient
  const inscrire = useCallback(() => {
    if (!aUnCompte.current) router.push("/compte");
  }, []);

  return (
    <ContexteCompteRequis.Provider value={exigerCompte}>
      {children}
      <FeuilleCreerCompte visible={visible} raison={raison} onFermer={fermer} onInscrire={inscrire} onMontree={marquerMontree} />
    </ContexteCompteRequis.Provider>
  );
}
