import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { citer } from "@sos-miam/commun/fonctions/langue/citer";
import { parleDAlcool } from "@sos-miam/commun/fonctions/prevention/parle-d-alcool";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { ReservationPro } from "@sos-miam/commun/types/reservation";
import { Bouton } from "~/composants/interface/Bouton";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import { EmojiOuMiami } from "~/composants/profil/EmojiOuMiami";
import { EtiquetteStatutReservation } from "~/composants/reservations/EtiquetteStatutReservation";
import { TEXTES_COMPTOIR_RESERVATIONS_PAR_LANGUE, type TEXTES_COMPTOIR_RESERVATIONS } from "~/contenus/textes-comptoir-reservations";
import { TEXTES_DEMANDES_COMPTOIR_PAR_LANGUE, type TEXTES_DEMANDES_COMPTOIR } from "~/contenus/textes-demandes-comptoir";
import { TEXTES_RESERVATIONS_PRO_PAR_LANGUE, type TEXTES_RESERVATIONS_PRO } from "~/contenus/textes-reservations-pro";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { ecrireNombrePersonnesLangue } from "~/fonctions/langue/ecrire-nombre-personnes-langue";
import { calculerGestesReservationPro } from "~/fonctions/reservations/calculer-gestes-reservation-pro";
import { decrireCreneauReservation } from "~/fonctions/reservations/decrire-creneau-reservation";
import { decrireStatutReservationPro } from "~/fonctions/reservations/decrire-statut-reservation-pro";
import { nommerClientReservation } from "~/fonctions/reservations/nommer-client-reservation";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { Palette } from "~/hooks/utiliser-theme";

type Props = {
  reservation: ReservationPro;
  maintenantMs: number;
  enCours: boolean;
  onMarquerArrivee: (venu: boolean) => void;
  onAnnuler: () => void;
};

type Textes = {
  comptoir: Traduction<typeof TEXTES_COMPTOIR_RESERVATIONS>;
  pro: Traduction<typeof TEXTES_RESERVATIONS_PRO>;
  demandes: Traduction<typeof TEXTES_DEMANDES_COMPTOIR>;
};

function dessinerActions({ reservation, maintenantMs, enCours, onMarquerArrivee, onAnnuler }: Props, couleurs: Palette, { comptoir, pro, demandes }: Textes) {
  if (enCours) return <ActivityIndicator color={couleurs.encre} accessibilityLabel={comptoir.enCours} />;
  if (reservation.statut !== "acceptee") return null;
  const gestes = calculerGestesReservationPro(reservation, maintenantMs);
  const nom = nommerClientReservation(reservation);
  const aide = !gestes.venu && !gestes.absent ? pro.attendreVenu : !gestes.absent ? pro.attendreAbsent : null;
  return (
    <View className="gap-2">
      {gestes.venu || gestes.absent ? (
        <View className="flex-row gap-3">
          {gestes.venu ? <Bouton libelle={pro.venu} libelleLu={demandes.reservation.passageLu(nom)} petit className="flex-1" onPress={() => onMarquerArrivee(true)} /> : null}
          {gestes.absent ? (
            <Bouton libelle={pro.absent} libelleLu={demandes.reservation.absenceLu(nom)} variante="blanc" petit className="flex-1" onPress={() => onMarquerArrivee(false)} />
          ) : null}
        </View>
      ) : null}
      {aide ? <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(aide)}</Text> : null}
      {gestes.venu && !reservation.presence ? <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(pro.venuSansPresence)}</Text> : null}
      {gestes.annuler ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={remplirModele(comptoir.annulerLu, { nom })}
          onPress={() => {
            vibrerLegerement();
            onAnnuler();
          }}
          className="min-h-11 justify-center self-start active:opacity-60"
        >
          <Text className="font-texte-gras text-[14px] text-rouge-texte underline">{comptoir.annuler}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function decrireCarte(reservation: ReservationPro, maintenantMs: number, langue: Langue) {
  return {
    nom: nommerClientReservation(reservation),
    personnes: ecrireNombrePersonnesLangue(reservation.personnes, langue),
    creneau: decrireCreneauReservation(reservation.creneau, maintenantMs, langue),
    etiquette: decrireStatutReservationPro(reservation, langue),
  };
}

export function CarteReservationPro(props: Props) {
  const couleurs = utiliserCouleurs();
  const { langue } = utiliserLangue();
  const comptoir = utiliserTextes(TEXTES_COMPTOIR_RESERVATIONS_PAR_LANGUE);
  const pro = utiliserTextes(TEXTES_RESERVATIONS_PRO_PAR_LANGUE);
  const demandes = utiliserTextes(TEXTES_DEMANDES_COMPTOIR_PAR_LANGUE);
  const { reservation, maintenantMs } = props;
  const { nom, personnes, creneau, etiquette } = decrireCarte(reservation, maintenantMs, langue);
  const etiquetteAuto = { texte: comptoir.accepteeAuto, lu: comptoir.accepteeAutoLu, ton: "attente" } as const;
  const enRetrait = reservation.statut === "refusee" || reservation.statut === "annulee" || reservation.statut === "expiree";
  const auto = reservation.automatique && reservation.statut !== "refusee";
  const code = reservation.code;

  return (
    <View className={`gap-3 rounded-carte border-2 bg-carte p-4 ${enRetrait ? "border-ligne" : "border-encre"}`}>
      <View accessible accessibilityLabel={`${nom}, ${personnes}, ${creneau.lu}. ${etiquette.lu}${auto ? `. ${etiquetteAuto.lu}` : ""}`} className="flex-row items-start gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-encre bg-jaune-clair">
          <EmojiOuMiami valeur={reservation.avatar} taille={44} allowFontScaling={false} style={{ fontSize: 24, lineHeight: 30 }} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="font-texte-gras text-base text-encre">{`${nom} · ${personnes}`}</Text>
          <Text className="font-texte-semi text-[15px] leading-5 text-encre">{creneau.court}</Text>
          <View className="mt-1.5 flex-row flex-wrap gap-1.5">
            <EtiquetteStatutReservation etiquette={etiquette} />
            {auto ? <EtiquetteStatutReservation etiquette={etiquetteAuto} /> : null}
          </View>
        </View>
      </View>

      {reservation.message ? (
        <View accessible className="gap-1 rounded-2xl bg-creme px-3 py-2.5">
          <Text className="font-texte-semi text-[12px] text-gris">{pro.petitMot}</Text>
          <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(citer(reservation.message, langue))}</Text>
          {parleDAlcool(reservation.message) ? <MentionPrevention variante="courte" /> : null}
        </View>
      ) : null}

      {code && reservation.statut === "acceptee" ? (
        <Text accessibilityLabel={demandes.reservation.etiquetteValeur(pro.code, code.split("").join(" "))} className="font-texte-semi text-[15px] text-encre">
          {demandes.reservation.etiquetteValeur(pro.code, code)}
        </Text>
      ) : null}
      {reservation.statut === "acceptee" && reservation.presence ? (
        <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(pro.presenceNotee)}</Text>
      ) : null}

      {dessinerActions(props, couleurs, { comptoir, pro, demandes })}
    </View>
  );
}
