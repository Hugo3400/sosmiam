import { Text, View } from "react-native";

import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { DelaiReservation } from "@sos-miam/commun/types/reglages-reservations";
import { Pastille } from "~/composants/interface/Pastille";
import { EnTeteGroupeCreneaux } from "~/composants/reservations/EnTeteGroupeCreneaux";
import { DELAIS_RESERVATION_TEXTES } from "~/contenus/textes-reglages-reservations";
import { TEXTES_RESERVER_TABLE as T } from "~/contenus/textes-reserver-table";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { ecrireNombrePersonnes } from "~/fonctions/reservations/ecrire-nombre-personnes";
import type { GroupeCreneauxReservation } from "~/fonctions/reservations/ranger-creneaux-par-service";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  groupes: readonly GroupeCreneauxReservation[];
  choisi: string | null;
  personnes: number;
  delai: DelaiReservation;
  onChoisir: (heure: string) => void;
};

export function ChoixCreneauReservation({ groupes, choisi, personnes, delai, onChoisir }: Props) {
  const toutes = groupes.flatMap((g) => g.creneaux.map((c) => c.heure));
  const tropTard = delai === "veille" ? T.serviceTropTardVeille : remplirModele(T.serviceTropTard, { delai: DELAIS_RESERVATION_TEXTES[delai].court });
  return (
    <View accessibilityRole="radiogroup" className="gap-4">
      {groupes.map((groupe) => (
        <View key={groupe.cle} className="gap-2">
          <EnTeteGroupeCreneaux nom={groupe.nom} plage={groupe.plage} />
          {groupe.creneaux.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {groupe.creneaux.map((creneau) => (
                <Pastille
                  key={creneau.heure}
                  role="radio"
                  libelle={formaterHeure(creneau.heure)}
                  mention={creneau.peuDePlaces ? T.peuDePlaces : undefined}
                  choisi={creneau.heure === choisi}
                  position={toutes.indexOf(creneau.heure) + 1}
                  total={toutes.length}
                  onPress={() => onChoisir(creneau.heure)}
                />
              ))}
            </View>
          ) : (
            <Text className="font-texte text-sm leading-5 text-gris">
              {lierPonctuation(groupe.etat === "complet" ? remplirModele(T.serviceComplet, { personnes: ecrireNombrePersonnes(personnes) }) : tropTard)}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}
