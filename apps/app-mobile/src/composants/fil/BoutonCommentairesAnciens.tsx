import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { TEXTES_COMMENTAIRES_FIL_PAR_LANGUE } from "~/contenus/textes-commentaires-fil";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  onCharger: () => void;
  /** Combien de commentaires sont déjà là (réponses comprises) : quand ce nombre bouge, la suite est arrivée */
  charges: number;
};

// La suite ne dit pas quand elle a fini (ni si elle a raté) : la roue tourne au plus ce temps-là
const DUREE_MAX = 6000;

/** Au bout de la liste des commentaires, quand il en reste de plus anciens à lire (100 par page). */
export function BoutonCommentairesAnciens({ onCharger, charges }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_COMMENTAIRES_FIL_PAR_LANGUE).reponses;
  const [enCours, setEnCours] = useState(false);
  const [vus, setVus] = useState(charges);
  if (charges !== vus) {
    setVus(charges);
    setEnCours(false);
  }

  useEffect(() => {
    if (!enCours) return;
    const minuterie = setTimeout(() => setEnCours(false), DUREE_MAX);
    return () => clearTimeout(minuterie);
  }, [enCours]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={enCours ? T.anciensArrivent : T.voirAnciens}
      accessibilityState={{ busy: enCours, disabled: enCours }}
      disabled={enCours}
      onPress={() => {
        vibrerLegerement();
        setEnCours(true);
        onCharger();
      }}
      className="mt-1 min-h-11 flex-row items-center justify-center gap-2 self-center px-3 active:opacity-60"
    >
      <View className="h-px w-6 bg-gris" />
      <Text className="font-texte-semi text-[13px] text-gris">{enCours ? T.remonte : T.voirAnciens}</Text>
      {enCours ? <ActivityIndicator size="small" color={couleurs.gris} /> : <Ionicons name="chevron-down" size={14} color={couleurs.gris} />}
    </Pressable>
  );
}
