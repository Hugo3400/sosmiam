import { Text, View } from "react-native";

import { SERVICES_RESERVATION_MAX } from "@sos-miam/commun/regles/reglages-reservations";
import type { ServiceReservation } from "@sos-miam/commun/types/reglages-reservations";
import { Bouton } from "~/composants/interface/Bouton";
import { CarteModeTranquille } from "~/composants/reservations-pro/CarteModeTranquille";
import { CarteServiceReservation } from "~/composants/reservations-pro/CarteServiceReservation";
import { TEXTES_REGLAGES_RESERVATIONS as T } from "~/contenus/textes-reglages-reservations";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  services: readonly ServiceReservation[];
  avecHoraires: boolean;
  modifiable: boolean;
  erreur: { service: number; texte: string } | null;
  onOuvrir: (index: number) => void;
  onAjouter: () => void;
  onReglerDepuisHoraires: (couverts: number) => void;
  onRevenirRepli: () => void;
};

export function SectionServicesReservation(props: Props) {
  const { services, modifiable, erreur } = props;
  const ordre = services.map((service, index) => ({ service, index })).sort((a, b) => a.service.premier.localeCompare(b.service.premier));
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
        {T.servicesTitre}
      </Text>
      <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(T.servicesIntro)}</Text>
      {services.length === 0 ? (
        <CarteModeTranquille avecHoraires={props.avecHoraires} modifiable={modifiable} onRegler={props.onReglerDepuisHoraires} onNouveau={props.onAjouter} />
      ) : (
        ordre.map(({ service, index }) => (
          <CarteServiceReservation
            key={`${index}-${service.premier}-${service.jours.join("")}`}
            service={service}
            services={services}
            erreur={erreur?.service === index ? erreur.texte : null}
            modifiable={modifiable}
            onPress={() => props.onOuvrir(index)}
          />
        ))
      )}
      {modifiable && services.length > 0 ? (
        services.length >= SERVICES_RESERVATION_MAX ? (
          <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(T.servicesMax)}</Text>
        ) : (
          <Bouton libelle={T.ajouterService} variante="blanc" petit onPress={props.onAjouter} />
        )
      ) : null}
      {modifiable && services.length > 0 ? <Bouton libelle={T.revenirRepli} variante="blanc" petit onPress={props.onRevenirRepli} /> : null}
    </View>
  );
}
