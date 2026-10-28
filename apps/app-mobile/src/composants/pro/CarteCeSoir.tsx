import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";

import { citer } from "@sos-miam/commun/fonctions/langue/citer";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { MomentLieu } from "@sos-miam/commun/types/moment-lieu";
import { LigneMonLieu } from "~/composants/pro/LigneMonLieu";
import { TEXTES_SOS_DU_SOIR_PAR_LANGUE } from "~/contenus/textes-blocs-ce-soir";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Où en est le soir, en une ligne : SOS en cours (places, jusqu'à quand), message affiché, ou rien encore */
function decrire(moment: MomentLieu | null, langue: Langue): string {
  const T = choisirTextes(TEXTES_SOS_DU_SOIR_PAR_LANGUE, langue);
  if (!moment) return T.carteVide;
  const sos = moment.sos?.enCours ? T.carteEnCours(moment.sos.places, ecrireHeureLangue(moment.sos.jusqua, langue)) : null;
  const message = moment.message ? `📣 ${citer(moment.message.texte, langue)}` : null;
  if (sos || message) return [sos, message].filter(Boolean).join(" · ");
  return moment.sosPossible ? T.carteLancer : T.carteTermine;
}

/** Sur le comptoir, pour toute l'équipe : l'accès à « Ce soir » (SOS du soir et message du moment), relu à chaque retour. */
export function CarteCeSoir({ lieuId }: { lieuId: number }) {
  const router = useRouter();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_SOS_DU_SOIR_PAR_LANGUE);
  const { lieuPro } = utiliserServices();
  const [moment, setMoment] = useState<MomentLieu | null>(null);

  useFocusEffect(
    useCallback(() => {
      let actif = true;
      lieuPro.lireMoment(lieuId).then((r) => actif && r.ok && setMoment(r.moment));
      return () => {
        actif = false;
      };
    }, [lieuPro, lieuId]),
  );

  return <LigneMonLieu emoji="🌙" titre={T.carteTitre} detail={decrire(moment, langue)} onPress={() => router.push("/pro/ce-soir")} />;
}
