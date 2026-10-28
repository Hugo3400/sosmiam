import { Text, View } from "react-native";

import { calculerCouvertsMaxService } from "@sos-miam/commun/fonctions/reservations/calculer-couverts-max-service";
import { listerHeuresService } from "@sos-miam/commun/fonctions/reservations/lister-heures-service";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { PasCreneaux } from "@sos-miam/commun/types/reglages-reservations";
import { TEXTES_FEUILLE_SERVICE_PAR_LANGUE } from "~/contenus/textes-reglages-reservations";
import { ecrireNombreCouvertsLangue } from "~/fonctions/langue/ecrire-nombre-couverts-langue";
import { formaterHeureTexteLangue } from "~/fonctions/langue/formater-heure-texte-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  premier: string;
  dernier: string;
  pas: PasCreneaux;
  couvertsParService: number | null;
  couvertsParCreneau: number | null;
};

export function ApercuServiceReservation({ premier, dernier, pas, couvertsParService, couvertsParCreneau }: Props) {
  const T = utiliserTextes(TEXTES_FEUILLE_SERVICE_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const heures = listerHeuresService({ premier, dernier, pas });
  const max =
    couvertsParService !== null && couvertsParCreneau !== null && couvertsParService > 0 && couvertsParCreneau > 0
      ? calculerCouvertsMaxService({ jours: [], premier, dernier, pas, couvertsParService, couvertsParCreneau })
      : null;
  const liste = heures.map((heure) => formaterHeureTexteLangue(heure, langue)).join(" · ");
  const couverts = max === null ? null : remplirModele(T.apercuCouverts, { couverts: ecrireNombreCouvertsLangue(max, langue) });
  return (
    <View accessible accessibilityLabel={[T.apercu, heures.length > 0 ? liste : T.apercuVide, couverts].filter(Boolean).join(" ")} className="gap-1.5 rounded-2xl bg-jaune-clair px-4 py-3">
      <Text className="font-texte-semi text-sm text-encre">{T.apercu}</Text>
      <Text className="font-texte text-[15px] leading-[22px] text-encre">{heures.length > 0 ? liste : T.apercuVide}</Text>
      {couverts ? <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(couverts)}</Text> : null}
    </View>
  );
}
