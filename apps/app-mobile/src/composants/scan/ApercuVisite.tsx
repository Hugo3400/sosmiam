import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { ecrireDateLangue } from "@sos-miam/commun/fonctions/langue/ecrire-date-langue";
import type { StatutVisite, Visite } from "@sos-miam/commun/types/visite";
import { EtiquettesReglement } from "~/composants/visites/EtiquettesReglement";
import { TEXTES_SCAN_PAR_LANGUE } from "~/contenus/textes-scan";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { decrireReglementLangue } from "~/fonctions/langue/decrire-reglement-langue";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  visite: Visite;
  onPress: () => void;
};

const FONDS_STATUTS: Record<StatutVisite, string> = {
  demandee: "bg-jaune-clair",
  validee: "bg-jaune",
  refusee: "bg-rose-alerte",
  annulee: "bg-ligne",
  expiree: "bg-ligne",
  retiree: "bg-rose-alerte",
};

const FORMAT_JOUR = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

/** Une visite en une ligne, dans l'aperçu de l'onglet Scan : le lieu, le jour, ce qu'elle a rapporté et son état. */
export function ApercuVisite({ visite, onPress }: Props) {
  const couleurs = utiliserCouleurs();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_SCAN_PAR_LANGUE);
  const statut = { texte: T.statuts[visite.statut], fond: FONDS_STATUTS[visite.statut] };
  const date = new Date(visite.valideLe ?? visite.creeLe);
  const jour =
    langue === "en" ? ecrireDateLangue({ annee: date.getFullYear(), mois: date.getMonth() + 1, jour: date.getDate() }, langue, { sansAnnee: true, court: true }) : FORMAT_JOUR.format(date);
  const gain = visite.statut === "validee" && visite.points > 0 ? T.gain(visite.points, visite.tampon) : null;
  const reglement = visite.statut === "validee" ? decrireReglementLangue(visite.reglement, "client", langue) : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[T.apercuLu(visite.lieu.nom, jour), statut.texte, reglement ? [reglement.titre, ...reglement.etiquettesLues].join(", ") : null, gain].filter(Boolean).join(", ")}
      accessibilityHint={T.apercuIndice}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className="min-h-16 flex-row items-center gap-3 rounded-2xl border-2 border-ligne bg-carte px-3.5 py-3 active:opacity-80"
    >
      <View className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-creme">
        <Text className="text-xl">{visite.lieu.emoji}</Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={1} className="font-texte-gras text-[15px] text-encre">
          {visite.lieu.nom}
        </Text>
        <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
          {jour}
          {gain ? ` · ${gain}` : ""}
        </Text>
        {reglement ? (
          <View className="mt-1">
            <EtiquettesReglement reglement={visite.reglement} pour="client" taille="petite" />
          </View>
        ) : null}
      </View>
      <View className={`rounded-full px-2.5 py-1 ${statut.fond}`}>
        <Text className={`font-texte-gras text-xs ${visite.statut === "validee" ? "text-nuit" : "text-encre"}`}>{statut.texte}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={couleurs.gris} />
    </Pressable>
  );
}
