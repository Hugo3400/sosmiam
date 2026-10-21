import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { parleDAlcool } from "@sos-miam/commun/fonctions/prevention/parle-d-alcool";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { ReservationPro } from "@sos-miam/commun/types/reservation";
import { Bouton } from "~/composants/interface/Bouton";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import { EtiquetteStatutReservation } from "~/composants/reservations/EtiquetteStatutReservation";
import { TEXTES_COMPTOIR_RESERVATIONS } from "~/contenus/textes-comptoir-reservations";
import { TEXTES_RESERVATIONS_PRO } from "~/contenus/textes-reservations-pro";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { calculerGestesReservationPro } from "~/fonctions/reservations/calculer-gestes-reservation-pro";
import { decrireCreneauReservation } from "~/fonctions/reservations/decrire-creneau-reservation";
import { decrireStatutReservationPro } from "~/fonctions/reservations/decrire-statut-reservation-pro";
import { ecrireNombrePersonnes } from "~/fonctions/reservations/ecrire-nombre-personnes";
import { nommerClientReservation } from "~/fonctions/reservations/nommer-client-reservation";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  reservation: ReservationPro;
  maintenantMs: number;
  enCours: boolean;
  onMarquerArrivee: (venu: boolean) => void;
  onAnnuler: () => void;
};

const ETIQUETTE_AUTO = { texte: TEXTES_COMPTOIR_RESERVATIONS.accepteeAuto, lu: TEXTES_COMPTOIR_RESERVATIONS.accepteeAutoLu, ton: "attente" } as const;

function dessinerActions({ reservation, maintenantMs, enCours, onMarquerArrivee, onAnnuler }: Props) {
  if (enCours) return <ActivityIndicator color={couleurs.encre} accessibilityLabel={TEXTES_COMPTOIR_RESERVATIONS.enCours} />;
  if (reservation.statut !== "acceptee") return null;
  const gestes = calculerGestesReservationPro(reservation, maintenantMs);
  const nom = nommerClientReservation(reservation);
  const aide = !gestes.venu && !gestes.absent ? TEXTES_RESERVATIONS_PRO.attendreVenu : !gestes.absent ? TEXTES_RESERVATIONS_PRO.attendreAbsent : null;
  return (
    <View className="gap-2">
      {gestes.venu || gestes.absent ? (
        <View className="flex-row gap-3">
          {gestes.venu ? <Bouton libelle={TEXTES_RESERVATIONS_PRO.venu} libelleLu={`Noter le passage de ${nom}`} petit className="flex-1" onPress={() => onMarquerArrivee(true)} /> : null}
          {gestes.absent ? (
            <Bouton libelle={TEXTES_RESERVATIONS_PRO.absent} libelleLu={`Noter l'absence de ${nom}`} variante="blanc" petit className="flex-1" onPress={() => onMarquerArrivee(false)} />
          ) : null}
        </View>
      ) : null}
      {aide ? <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(aide)}</Text> : null}
      {gestes.venu && !reservation.presence ? <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(TEXTES_RESERVATIONS_PRO.venuSansPresence)}</Text> : null}
      {gestes.annuler ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={remplirModele(TEXTES_COMPTOIR_RESERVATIONS.annulerLu, { nom })}
          onPress={() => {
            vibrerLegerement();
            onAnnuler();
          }}
          className="min-h-11 justify-center self-start active:opacity-60"
        >
          <Text className="font-texte-gras text-[14px] text-rouge-texte underline">{TEXTES_COMPTOIR_RESERVATIONS.annuler}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function CarteReservationPro(props: Props) {
  const { reservation, maintenantMs } = props;
  const nom = nommerClientReservation(reservation);
  const personnes = ecrireNombrePersonnes(reservation.personnes);
  const creneau = decrireCreneauReservation(reservation.creneau, maintenantMs);
  const etiquette = decrireStatutReservationPro(reservation);
  const enRetrait = reservation.statut === "refusee" || reservation.statut === "annulee" || reservation.statut === "expiree";
  const auto = reservation.automatique && reservation.statut !== "refusee";

  return (
    <View className={`gap-3 rounded-carte border-2 bg-white p-4 ${enRetrait ? "border-ligne" : "border-encre"}`}>
      <View accessible accessibilityLabel={`${nom}, ${personnes}, ${creneau.lu}. ${etiquette.lu}${auto ? `. ${ETIQUETTE_AUTO.lu}` : ""}`} className="flex-row items-start gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-encre bg-jaune-clair">
          <Text allowFontScaling={false} style={{ fontSize: 24, lineHeight: 30 }}>
            {reservation.avatar}
          </Text>
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="font-texte-gras text-base text-encre">{`${nom} · ${personnes}`}</Text>
          <Text className="font-texte-semi text-[15px] leading-5 text-encre">{creneau.court}</Text>
          <View className="mt-1.5 flex-row flex-wrap gap-1.5">
            <EtiquetteStatutReservation etiquette={etiquette} />
            {auto ? <EtiquetteStatutReservation etiquette={ETIQUETTE_AUTO} /> : null}
          </View>
        </View>
      </View>

      {reservation.message ? (
        <View accessible className="gap-1 rounded-2xl bg-creme px-3 py-2.5">
          <Text className="font-texte-semi text-[12px] text-gris">{TEXTES_RESERVATIONS_PRO.petitMot}</Text>
          <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(`« ${reservation.message} »`)}</Text>
          {parleDAlcool(reservation.message) ? <MentionPrevention variante="courte" /> : null}
        </View>
      ) : null}

      {reservation.code && reservation.statut === "acceptee" ? (
        <Text accessibilityLabel={`${TEXTES_RESERVATIONS_PRO.code} : ${reservation.code.split("").join(" ")}`} className="font-texte-semi text-[15px] text-encre">
          {`${TEXTES_RESERVATIONS_PRO.code} : ${reservation.code}`}
        </Text>
      ) : null}
      {reservation.statut === "acceptee" && reservation.presence ? (
        <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(TEXTES_RESERVATIONS_PRO.presenceNotee)}</Text>
      ) : null}

      {dessinerActions(props)}
    </View>
  );
}
