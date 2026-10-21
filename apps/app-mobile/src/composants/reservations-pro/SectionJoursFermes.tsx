import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { Bouton } from "~/composants/interface/Bouton";
import { BoutonFermerJour } from "~/composants/reservations-pro/BoutonFermerJour";
import { TEXTES_REGLAGES_RESERVATIONS as T } from "~/contenus/textes-reglages-reservations";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { decrireJourReservation } from "~/fonctions/reservations/decrire-jour-reservation";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  joursFermes: readonly string[];
  aujourdhui: string;
  enCours: ReadonlySet<string>;
  onBasculer: (jour: string, ferme: boolean) => void;
  onChoisir: () => void;
};

export function SectionJoursFermes({ joursFermes, aujourdhui, enCours, onBasculer, onChoisir }: Props) {
  const aVenir = joursFermes.filter((jour) => jour > aujourdhui).sort();
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
        {T.joursFermesTitre}
      </Text>
      <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(T.joursFermesIntro)}</Text>
      <BoutonFermerJour ferme={joursFermes.includes(aujourdhui)} enCours={enCours.has(aujourdhui)} onBasculer={(ferme) => onBasculer(aujourdhui, ferme)} />
      <Text className="mt-2 font-texte-semi text-base text-encre">{T.joursFermesProchains}</Text>
      {aVenir.length === 0 ? (
        <Text className="font-texte text-sm text-gris">{T.joursFermesVide}</Text>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {aVenir.map((jour) => {
            const decrit = decrireJourReservation(jour, aujourdhui);
            return (
              <Pressable
                key={jour}
                accessibilityRole="button"
                accessibilityLabel={remplirModele(T.jourFermeLu, { jour: decrit.long })}
                accessibilityHint={T.rouvrirJourIndice}
                accessibilityState={{ disabled: enCours.has(jour) }}
                disabled={enCours.has(jour)}
                onPress={() => {
                  vibrerLegerement();
                  onBasculer(jour, false);
                }}
                className={`min-h-11 flex-row items-center gap-1.5 rounded-full border-2 border-encre bg-encre px-3.5 py-2 active:opacity-80 ${enCours.has(jour) ? "opacity-40" : ""}`}
              >
                <Text className="font-texte-semi text-[14px] text-jaune">{`${decrit.haut} ${decrit.numero} ${decrit.mois}`}</Text>
                <Ionicons name="close" size={16} color={couleurs.jaune} />
              </Pressable>
            );
          })}
        </View>
      )}
      <Bouton libelle={T.choisirJoursFermes} variante="blanc" petit indice={T.indiceChoisirJoursFermes} onPress={onChoisir} />
    </View>
  );
}
