import { useEffect, useRef } from "react";
import { Platform, Pressable, ScrollView, Text } from "react-native";

import type { JourReservation } from "~/contenus/type-jour-reservation";
import { SANS_CRENEAU } from "~/contenus/textes-reserver-table";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { decrireJourReservation } from "~/fonctions/reservations/decrire-jour-reservation";
import { lireRaisonSansCreneau } from "~/fonctions/reservations/lire-raison-sans-creneau";

type Props = {
  jours: readonly JourReservation[];
  aujourdhui: string;
  choisi: string;
  onChoisir: (jour: string) => void;
};

const LARGEUR_JOUR = 70;
const ECART_JOURS = 8;
const MARGE_RANGEE = 20;

function lireCouleurs(choisi: boolean, sansCreneau: boolean) {
  if (choisi) return { cadre: "border-encre bg-encre", haut: "text-jaune", numero: "text-white", bas: "text-jaune" };
  if (sansCreneau) return { cadre: "border-dashed border-gris bg-creme", haut: "text-gris", numero: "text-gris", bas: "text-gris" };
  return { cadre: "border-encre bg-white", haut: "text-encre", numero: "text-encre", bas: "text-gris" };
}

export function ChoixJourReservation({ jours, aujourdhui, choisi, onChoisir }: Props) {
  const ios = Platform.OS === "ios";
  const rangee = useRef<ScrollView>(null);
  const decalage = useRef(0);
  const largeurVisible = useRef(0);
  const indexChoisi = jours.findIndex((jour) => jour.jour === choisi);

  useEffect(() => {
    if (indexChoisi < 0 || largeurVisible.current === 0) return;
    const debut = MARGE_RANGEE + indexChoisi * (LARGEUR_JOUR + ECART_JOURS);
    const fin = debut + LARGEUR_JOUR;
    if (debut < decalage.current) rangee.current?.scrollTo({ x: debut - MARGE_RANGEE, animated: true });
    else if (fin > decalage.current + largeurVisible.current) rangee.current?.scrollTo({ x: fin - largeurVisible.current + MARGE_RANGEE, animated: true });
  }, [indexChoisi]);

  return (
    <ScrollView
      ref={rangee}
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={32}
      onLayout={(evenement) => {
        largeurVisible.current = evenement.nativeEvent.layout.width;
      }}
      onScroll={(evenement) => {
        decalage.current = evenement.nativeEvent.contentOffset.x;
      }}
      className="-mx-5"
      contentContainerClassName="gap-2 px-5 py-1"
    >
      {jours.map((jour, index) => {
        const decrit = decrireJourReservation(jour.jour, aujourdhui);
        const raison = lireRaisonSansCreneau(jour, aujourdhui);
        const estChoisi = jour.jour === choisi;
        const couleurs = lireCouleurs(estChoisi, raison !== null);
        const etat = raison ? `, ${SANS_CRENEAU[raison].lu}` : "";
        const place = ios ? `, ${index + 1} sur ${jours.length}` : "";
        return (
          <Pressable
            key={jour.jour}
            accessibilityRole={ios ? "button" : "radio"}
            accessibilityState={ios ? { selected: estChoisi } : { checked: estChoisi }}
            accessibilityLabel={`${decrit.long}${etat}${place}`}
            onPress={() => {
              vibrerLegerement();
              onChoisir(jour.jour);
            }}
            className={`min-h-[78px] w-[70px] items-center justify-center rounded-2xl border-2 px-1 py-2 active:opacity-80 ${couleurs.cadre}`}
          >
            <Text numberOfLines={1} className={`font-texte-semi text-xs ${couleurs.haut}`}>
              {decrit.haut}
            </Text>
            <Text className={`font-titre text-2xl ${couleurs.numero}`}>{decrit.numero}</Text>
            <Text numberOfLines={1} className={`font-texte text-[11px] ${couleurs.bas}`}>
              {raison ? SANS_CRENEAU[raison].court : decrit.mois}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
