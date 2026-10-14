import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";

import type { MomentLieu } from "@sos-miam/commun/types/moment-lieu";
import { LigneMonLieu } from "~/composants/pro/LigneMonLieu";
import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";
import { utiliserServices } from "~/hooks/utiliser-services";

/** Où en est le soir, en une ligne : SOS en cours (places, jusqu'à quand), message affiché, ou rien encore */
function decrire(moment: MomentLieu | null): string {
  if (!moment) return "Le SOS du soir et le message du moment";
  const sos = moment.sos?.enCours ? `🛟 SOS en cours : ${moment.sos.places} place${moment.sos.places > 1 ? "s" : ""} jusqu'à ${ecrireHeure(moment.sos.jusqua)}` : null;
  const message = moment.message ? `📣 « ${moment.message.texte} »` : null;
  if (sos || message) return [sos, message].filter(Boolean).join(" · ");
  return moment.sosPossible ? "Des tables vides ? Lance un SOS du soir" : "SOS de ce soir terminé · un message du moment ?";
}

/** Sur le comptoir, pour toute l'équipe : l'accès à « Ce soir » (SOS du soir et message du moment), relu à chaque retour. */
export function CarteCeSoir({ lieuId }: { lieuId: number }) {
  const router = useRouter();
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

  return <LigneMonLieu emoji="🌙" titre="Ce soir" detail={decrire(moment)} onPress={() => router.push("/pro/ce-soir")} />;
}
