import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { parleDAlcool } from "@sos-miam/commun/fonctions/prevention/parle-d-alcool";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { calculerJourParis } from "@sos-miam/commun/fonctions/temps/calculer-jour-paris";
import type { ReservationPro } from "@sos-miam/commun/types/reservation";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import { BoutonCarteComptoir } from "~/composants/pro/BoutonCarteComptoir";
import { OptionHoraireDemande } from "~/composants/reservations-pro/OptionHoraireDemande";
import { TEXTES_COMPTOIR_RESERVATIONS as T } from "~/contenus/textes-comptoir-reservations";
import { TEXTES_RESERVATIONS_PRO } from "~/contenus/textes-reservations-pro";
import { ecrireHeureParis } from "~/fonctions/dates/ecrire-heure-paris";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { calculerGestesReservationPro } from "~/fonctions/reservations/calculer-gestes-reservation-pro";
import { decrireEndormissementDemande } from "~/fonctions/reservations/decrire-endormissement-demande";
import { decrireHorairePropose } from "~/fonctions/reservations/decrire-horaire-propose";
import { decrireJourReservation } from "~/fonctions/reservations/decrire-jour-reservation";
import { ecrireNombrePersonnes } from "~/fonctions/reservations/ecrire-nombre-personnes";
import { nommerClientReservation } from "~/fonctions/reservations/nommer-client-reservation";
import { resumerDemandeReservation } from "~/fonctions/reservations/resumer-demande-reservation";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  reservation: ReservationPro;
  choisi: string;
  deplie: boolean;
  enCours: boolean;
  maintenantMs: number;
  onChoisir: (creneau: string) => void;
  onBasculer: () => void;
  onAccepter: (tient: boolean) => void;
  onRefuser: () => void;
};

export function CarteDemandeReservation({ reservation, choisi, deplie, enCours, maintenantMs, onChoisir, onBasculer, onAccepter, onRefuser }: Props) {
  const nom = nommerClientReservation(reservation);
  const resume = resumerDemandeReservation(reservation, choisi);
  const jour = decrireJourReservation(calculerJourParis(Date.parse(choisi)), calculerJourParis(maintenantMs)).long;
  const options = reservation.propositions.map((p, rang) => decrireHorairePropose(p, rang, reservation.personnes));
  const choix = options.find((o) => o.creneau === choisi) ?? options[0];
  const tient = choix?.tient ?? true;
  const heure = ecrireHeureParis(choisi);
  const gestes = calculerGestesReservationPro(reservation, maintenantMs);
  const accepter = remplirModele(tient ? T.accepter : T.accepterQuandMeme, { heure });
  const plusieurs = options.length > 1;

  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-white p-4">
      <View accessible accessibilityLabel={`${resume.lu}. ${jour}`} className="flex-row items-start gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-encre bg-jaune-clair">
          <Text allowFontScaling={false} style={{ fontSize: 24, lineHeight: 30 }}>
            {reservation.avatar}
          </Text>
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="font-texte-gras text-[16px] leading-[22px] text-encre">{resume.texte}</Text>
          <Text className="font-texte text-[13px] leading-[18px] text-gris">{jour}</Text>
        </View>
      </View>

      {reservation.message ? (
        <View accessible className="gap-1 rounded-2xl bg-creme px-3 py-2.5">
          <Text className="font-texte-semi text-[12px] text-gris">{TEXTES_RESERVATIONS_PRO.petitMot}</Text>
          <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(`« ${reservation.message} »`)}</Text>
          {parleDAlcool(reservation.message) ? <MentionPrevention variante="courte" /> : null}
        </View>
      ) : null}

      <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(decrireEndormissementDemande(reservation, maintenantMs))}</Text>

      {enCours ? (
        <ActivityIndicator color={couleurs.encre} accessibilityLabel={T.enCours} />
      ) : (
        <View className="gap-3">
          <View className="flex-row">
            <BoutonCarteComptoir
              libelle={accepter}
              libelleLu={remplirModele(T.accepterLu, { nom, heure, personnes: ecrireNombrePersonnes(reservation.personnes) })}
              plein
              icone="checkmark"
              desactive={!gestes.accepter}
              onPress={() => onAccepter(tient)}
            />
          </View>
          <View className="flex-row gap-3">
            <BoutonCarteComptoir libelle={T.refuser} libelleLu={remplirModele(T.refuserLu, { nom })} plein={false} desactive={!gestes.refuser} onPress={onRefuser} />
            {plusieurs ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={remplirModele(deplie ? T.replierHorairesLu : T.autreHoraireLu, { nom })}
                accessibilityState={{ expanded: deplie }}
                onPress={() => {
                  vibrerLegerement();
                  onBasculer();
                }}
                className="min-h-12 flex-1 flex-row items-center justify-center gap-1.5 rounded-full border-2 border-encre bg-white px-4 active:opacity-80"
              >
                <Text className="text-center font-texte-gras text-base text-encre">{deplie ? T.replierHoraires : T.autreHoraire}</Text>
                <Ionicons name={deplie ? "chevron-up" : "chevron-down"} size={16} color={couleurs.encre} />
              </Pressable>
            ) : null}
          </View>
        </View>
      )}

      {plusieurs && deplie ? (
        <View accessibilityRole="radiogroup" accessibilityLabel={T.horairesProposes} className="gap-2">
          {options.map((option, i) => (
            <OptionHoraireDemande key={option.creneau} decrit={option} choisi={option.creneau === choisi} position={i + 1} total={options.length} onPress={() => onChoisir(option.creneau)} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
