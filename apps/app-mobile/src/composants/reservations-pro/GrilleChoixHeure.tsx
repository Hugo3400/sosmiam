import { Text, View } from "react-native";

import { ecrireHeureMinutes } from "@sos-miam/commun/fonctions/temps/ecrire-heure-minutes";
import { lireMinutesHeure } from "@sos-miam/commun/fonctions/temps/lire-minutes-heure";
import { Pastille } from "~/composants/interface/Pastille";
import { TEXTES_FEUILLE_SERVICE as T } from "~/contenus/textes-reglages-reservations";

type Props = {
  valeur: string;
  heures: readonly number[];
  minutesPour: (heure: number) => number[];
  onChoisir: (valeur: string, fini: boolean) => void;
};

const lireHeure = (valeur: string) => Math.floor((lireMinutesHeure(valeur) ?? 0) / 60);

export function GrilleChoixHeure({ valeur, heures, minutesPour, onChoisir }: Props) {
  const heure = lireHeure(valeur);
  const minuteActuelle = (lireMinutesHeure(valeur) ?? 0) % 60;
  const minutes = minutesPour(heure);

  function choisirHeure(suivante: number) {
    const possibles = minutesPour(suivante);
    const minute = possibles.includes(minuteActuelle) ? minuteActuelle : possibles[0];
    if (minute !== undefined) onChoisir(ecrireHeureMinutes(suivante * 60 + minute), false);
  }

  return (
    <View className="gap-3 rounded-2xl border-2 border-ligne bg-carte p-3">
      <Text className="font-texte-semi text-sm text-gris">{T.heure}</Text>
      <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
        {heures.map((h, i) => (
          <Pastille key={h} role="radio" libelle={`${h}h`} choisi={h === heure} position={i + 1} total={heures.length} onPress={() => choisirHeure(h)} />
        ))}
      </View>
      <Text className="font-texte-semi text-sm text-gris">{T.minutes}</Text>
      <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
        {minutes.map((m, i) => {
          const choisie = ecrireHeureMinutes(heure * 60 + m) === valeur;
          return (
            <Pastille
              key={m}
              role="radio"
              libelle={String(m).padStart(2, "0")}
              libelleLu={`${heure}h${m === 0 ? "" : String(m).padStart(2, "0")}`}
              choisi={choisie}
              position={i + 1}
              total={minutes.length}
              onPress={() => onChoisir(ecrireHeureMinutes(heure * 60 + m), true)}
            />
          );
        })}
      </View>
    </View>
  );
}
