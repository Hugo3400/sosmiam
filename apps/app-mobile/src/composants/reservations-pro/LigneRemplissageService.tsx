import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { nommerServiceReservation } from "@sos-miam/commun/fonctions/reservations/nommer-service-reservation";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { ServiceReservation } from "@sos-miam/commun/types/reglages-reservations";
import { Jauge } from "~/composants/interface/Jauge";
import { LigneRemplissageCreneau } from "~/composants/reservations-pro/LigneRemplissageCreneau";
import { TEXTES_REMPLISSAGE_PAR_LANGUE } from "~/contenus/textes-comptoir-reservations";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import type { RemplissageService } from "~/fonctions/reservations/calculer-remplissage-jour";
import { ecrireNomService } from "~/fonctions/reservations/ecrire-nom-service";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = { remplissage: RemplissageService; services: readonly ServiceReservation[] };

export function LigneRemplissageService({ remplissage, services }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_REMPLISSAGE_PAR_LANGUE);
  const [deplie, setDeplie] = useState(false);
  const { langue } = utiliserLangue();
  const { emoji, titre } = ecrireNomService(nommerServiceReservation(remplissage.service, services), langue);
  const valeurs = { acceptes: String(remplissage.acceptes), capacite: String(remplissage.capacite) };
  const total = remplirModele(T.service, valeurs);
  return (
    <View className="gap-2 rounded-2xl border-2 border-ligne bg-carte px-3.5 py-3">
      <View accessible accessibilityLabel={remplirModele(T.serviceLu, { service: titre, ...valeurs })} className="gap-2">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="font-texte-gras text-base text-encre">{`${emoji} ${titre}`}</Text>
          <Text className="font-texte-semi text-[14px] text-encre">{total}</Text>
        </View>
        <Jauge avancee={remplissage.capacite > 0 ? remplissage.acceptes / remplissage.capacite : 1} />
      </View>
      {remplissage.creneaux.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: deplie }}
          onPress={() => {
            vibrerLegerement();
            setDeplie((d) => !d);
          }}
          className="min-h-11 flex-row items-center gap-1.5 self-start active:opacity-60"
        >
          <Text className="font-texte-gras text-[14px] text-encre underline">{deplie ? T.replier : T.deplier}</Text>
          <Ionicons name={deplie ? "chevron-up" : "chevron-down"} size={16} color={couleurs.encre} />
        </Pressable>
      ) : null}
      {deplie ? remplissage.creneaux.map((creneau) => <LigneRemplissageCreneau key={creneau.heure} creneau={creneau} />) : null}
    </View>
  );
}
