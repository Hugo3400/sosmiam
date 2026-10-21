import { Platform, Pressable, Text, View } from "react-native";

import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { TEXTES_FEUILLE_JOURS_FERMES as T } from "~/contenus/textes-reglages-reservations";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { decrireJourReservation } from "~/fonctions/reservations/decrire-jour-reservation";
import { listerMoisCalendrier } from "~/fonctions/reservations/lister-mois-calendrier";

type Props = {
  aujourdhui: string;
  joursFermes: readonly string[];
  enCours: ReadonlySet<string>;
  onBasculer: (jour: string, ferme: boolean) => void;
};

const JOURS_AFFICHES = 92;
const INITIALES = ["L", "M", "M", "J", "V", "S", "D"];

export function CalendrierJoursFermes({ aujourdhui, joursFermes, enCours, onBasculer }: Props) {
  const ios = Platform.OS === "ios";
  const fermes = new Set(joursFermes);
  return (
    <View className="gap-5">
      {listerMoisCalendrier(aujourdhui, JOURS_AFFICHES).map((mois) => (
        <View key={mois.cle} className="gap-2">
          <Text accessibilityRole="header" className="font-texte-gras text-base text-encre">
            {mois.titre}
          </Text>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="flex-row">
            {INITIALES.map((initiale, i) => (
              <Text key={i} className="flex-1 text-center font-texte-semi text-[12px] text-gris">
                {initiale}
              </Text>
            ))}
          </View>
          {mois.semaines.map((semaine, s) => (
            <View key={s} className="flex-row gap-1">
              {semaine.map((jour, i) => {
                if (jour === null) return <View key={i} className="min-h-11 flex-1" />;
                const ferme = fermes.has(jour);
                const occupe = enCours.has(jour);
                const decrit = decrireJourReservation(jour, aujourdhui);
                return (
                  <Pressable
                    key={jour}
                    accessibilityRole={ios ? "button" : "checkbox"}
                    accessibilityState={ios ? { selected: ferme, disabled: occupe } : { checked: ferme, disabled: occupe }}
                    accessibilityLabel={ferme ? remplirModele(T.jourLuFerme, { jour: decrit.long }) : decrit.long}
                    accessibilityHint={T.indice}
                    disabled={occupe}
                    onPress={() => {
                      vibrerLegerement();
                      onBasculer(jour, !ferme);
                    }}
                    className={`min-h-11 flex-1 items-center justify-center rounded-xl border-2 active:opacity-80 ${ferme ? "border-encre bg-encre" : "border-ligne bg-white"} ${occupe ? "opacity-40" : ""}`}
                  >
                    <Text className={`font-texte-semi text-[15px] ${ferme ? "text-jaune" : "text-encre"}`}>{decrit.numero}</Text>
                    {ferme ? <Text className="font-texte-gras text-[10px] leading-3 text-jaune">✕</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
