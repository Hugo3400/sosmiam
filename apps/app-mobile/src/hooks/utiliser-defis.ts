import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";

import { calculerJourParis } from "@sos-miam/commun/fonctions/temps/calculer-jour-paris";
import type { DefiApp } from "@sos-miam/commun/types/defi";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { defisExemples } from "~/contenus/defis-exemples";
import type { DefiAffiche } from "~/contenus/type-defi-affiche";
import { calculerDefiExemple } from "~/fonctions/defis/calculer-defi-exemple";
import { rangerDefis } from "~/fonctions/defis/ranger-defis";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserRetoursPremierPlan } from "~/hooks/utiliser-retours-premier-plan";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserSession } from "~/hooks/utiliser-session";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";

export type DefisDuProfil = {
  /** Les défis à montrer, rangés (rangerDefis) ; null : pas encore lus, ou pas de compte */
  defis: DefiAffiche[] | null;
  /** La dernière lecture a raté ; les défis déjà lus restent montrés */
  erreur: ErreurService | null;
};

/** Les défis réussis d'une réponse, en une clé (« 1,4 ») */
const lireReussis = (defis: DefiApp[]) =>
  defis
    .filter((d) => d.etat === "reussi")
    .map((d) => d.id)
    .join(",");

/**
 * Les défis du profil. Avec un compte : ceux du serveur (GET /app/defis), relus chaque fois que le profil revient à l'écran
 * ou que l'app revient au premier plan. Le serveur recompte l'avancée à chaque lecture et peut créditer un défi ou donner un
 * badge : à la première lecture, puis dès que les défis réussis changent, le compte est relu (points, palier, badges). En
 * démo : les défis d'exemple, comptés sur le téléphone. Sans compte : rien (les défis demandent un compte).
 */
export function utiliserDefis(): DefisDuProfil {
  const { defis: service } = utiliserServices();
  const { connecte, rafraichir } = utiliserSession();
  const activite = utiliserActivite();
  const retours = utiliserRetoursPremierPlan();
  const avecCompte = !DEMO_VISITES_ACTIVE && connecte;
  const [lus, setLus] = useState<DefiApp[] | null>(null);
  const [erreur, setErreur] = useState<ErreurService | null>(null);
  // Les défis réussis de la dernière lecture ; null : pas encore lus
  const reussisVus = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!avecCompte) return;
      let actif = true;
      service.listerDefis().then((r) => {
        if (!actif) return;
        if (!r.ok) {
          setErreur(r.erreur);
          return;
        }
        setLus(r.defis);
        setErreur(null);
        const reussis = lireReussis(r.defis);
        if (reussisVus.current === reussis) return;
        reussisVus.current = reussis;
        void rafraichir();
      });
      return () => {
        actif = false;
      };
      // retours : relu aussi au retour au premier plan, si le profil est à l'écran
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [avecCompte, service, rafraichir, retours]),
  );

  const rescousses = activite.rescoussesDonnees;
  const premiers = activite.premiersSauvetages.length;
  const exemples = useMemo(() => {
    if (!DEMO_VISITES_ACTIVE) return null;
    const jour = calculerJourParis(Date.now());
    return rangerDefis(defisExemples.map((d) => calculerDefiExemple(d, { rescousses, "premiers-sauvetages": premiers }, jour)));
  }, [rescousses, premiers]);
  const duServeur = useMemo(() => (lus ? rangerDefis(lus.map((d) => ({ ...d, attente: null }))) : null), [lus]);

  if (exemples) return { defis: exemples, erreur: null };
  return avecCompte ? { defis: duServeur, erreur } : { defis: null, erreur: null };
}
