import { Text, View } from "react-native";

import { calculerCouvertsMaxService } from "@sos-miam/commun/fonctions/reservations/calculer-couverts-max-service";
import { listerHeuresService } from "@sos-miam/commun/fonctions/reservations/lister-heures-service";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { PasCreneaux } from "@sos-miam/commun/types/reglages-reservations";
import { TEXTES_FEUILLE_SERVICE as T } from "~/contenus/textes-reglages-reservations";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { ecrireNombreCouverts } from "~/fonctions/reservations/ecrire-nombre-couverts";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  premier: string;
  dernier: string;
  pas: PasCreneaux;
  couvertsParService: number | null;
  couvertsParCreneau: number | null;
};

export function ApercuServiceReservation({ premier, dernier, pas, couvertsParService, couvertsParCreneau }: Props) {
  const heures = listerHeuresService({ premier, dernier, pas });
  const max =
    couvertsParService !== null && couvertsParCreneau !== null && couvertsParService > 0 && couvertsParCreneau > 0
      ? calculerCouvertsMaxService({ jours: [], premier, dernier, pas, couvertsParService, couvertsParCreneau })
      : null;
  const liste = heures.map(formaterHeure).join(" · ");
  const couverts = max === null ? null : remplirModele(T.apercuCouverts, { couverts: ecrireNombreCouverts(max) });
  return (
    <View accessible accessibilityLabel={[T.apercu, heures.length > 0 ? liste : T.apercuVide, couverts].filter(Boolean).join(" ")} className="gap-1.5 rounded-2xl bg-jaune-clair px-4 py-3">
      <Text className="font-texte-semi text-sm text-encre">{T.apercu}</Text>
      <Text className="font-texte text-[15px] leading-[22px] text-encre">{heures.length > 0 ? liste : T.apercuVide}</Text>
      {couverts ? <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(couverts)}</Text> : null}
    </View>
  );
}
