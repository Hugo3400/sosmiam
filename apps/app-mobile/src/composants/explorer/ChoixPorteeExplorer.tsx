import { View } from "react-native";

import { BoutonIconeRond } from "~/composants/interface/BoutonIconeRond";
import { Pastille } from "~/composants/interface/Pastille";
import type { PorteeExplorer } from "~/contenus/portee-explorer";

type Props = {
  portee: PorteeExplorer;
  rayonKm: number;
  /** Faux si on ne sait pas dans quelle région tu es : « Région » n'est pas proposée */
  regionConnue: boolean;
  onChoisir: (portee: PorteeExplorer) => void;
  /** Ouvre le réglage du rayon (curseur de 1 à 50 km) */
  onReglerRayon: () => void;
};

/**
 * Jusqu'où regarde Explorer : « 5 km » (le rayon réglé), « Région » ou « France », pour la carte comme pour la liste.
 * Avec « km » choisi, un bouton règle le rayon ; toucher encore la pastille le fait aussi.
 */
export function ChoixPorteeExplorer({ portee, rayonKm, regionConnue, onChoisir, onReglerRayon }: Props) {
  const choix: { portee: PorteeExplorer; libelle: string; emoji: string }[] = [
    { portee: "proche", libelle: `${rayonKm} km`, emoji: "📍" },
    ...(regionConnue ? [{ portee: "region" as const, libelle: "Région", emoji: "🗺️" }] : []),
    { portee: "france", libelle: "France", emoji: "🇫🇷" },
  ];
  return (
    <View className="flex-row items-center gap-2 px-4 pb-2">
      {choix.map((c, i) => (
        <Pastille
          key={c.portee}
          libelle={c.libelle}
          emoji={c.emoji}
          role="radio"
          position={i + 1}
          total={choix.length}
          choisi={portee === c.portee}
          indice={c.portee === "proche" && portee === "proche" ? "Touche encore pour régler le rayon" : undefined}
          onPress={() => (c.portee === "proche" && portee === "proche" ? onReglerRayon() : onChoisir(c.portee))}
        />
      ))}
      {portee === "proche" ? <BoutonIconeRond icone="options-outline" libelle={`Régler le rayon, ${rayonKm} kilomètres`} onPress={onReglerRayon} /> : null}
    </View>
  );
}
