import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { Visite } from "@sos-miam/commun/types/visite";
import { TEXTES_DEMANDE_ADDITION_PAR_LANGUE } from "~/contenus/textes-demande-addition";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { direChezLieuLangue } from "~/fonctions/langue/dire-chez-lieu-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** La demande d'addition en attente (statut « demandee ») */
  visite: Visite;
  onPress: () => void;
};

const UNE_MINUTE = 60_000;

/** « Expire dans 27 min », ou « Expire dans moins d'une minute » ; null si c'est déjà passé */
function decrireExpiration(expireLe: string, maintenant: Date, T: Pick<typeof TEXTES_DEMANDE_ADDITION_PAR_LANGUE.fr, "expireBientot" | "expireDans">): string | null {
  const minutes = Math.ceil((Date.parse(expireLe) - maintenant.getTime()) / UNE_MINUTE);
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  return minutes <= 1 ? T.expireBientot : T.expireDans(minutes);
}

/** Ta demande d'addition en attente, en haut de l'onglet Scan : le lieu, le code à montrer et le temps qu'il reste. */
export function CarteDemandeEnCours({ visite, onPress }: Props) {
  // « Expire dans 27 min » se met à jour toute seule, une fois par minute
  const couleurs = utiliserCouleurs();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_DEMANDE_ADDITION_PAR_LANGUE);
  const [maintenant, setMaintenant] = useState(() => new Date());
  useEffect(() => {
    const minuterie = setInterval(() => setMaintenant(new Date()), UNE_MINUTE);
    return () => clearInterval(minuterie);
  }, []);

  const attente = visite.expireLe ? decrireExpiration(visite.expireLe, maintenant, T) : null;
  const code = visite.code ?? "";
  const libelle = [
    T.enCoursChez(direChezLieuLangue(visite.lieu.nom, langue)),
    // Le code est lu chiffre par chiffre : « 4, 8, 2, 1 »
    code ? T.enCoursCode(code.split("").join(", ")) : null,
    attente,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityHint={T.enCoursIndice}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className="gap-3 rounded-carte border-2 border-encre bg-jaune-clair px-5 py-4 active:opacity-80"
    >
      <View className="flex-row items-center gap-2">
        <View className="h-2.5 w-2.5 rounded-full bg-tomate" />
        <Text className="flex-1 font-texte-gras text-[13px] uppercase tracking-wide text-encre">{T.enCoursTitre}</Text>
        <Ionicons name="chevron-forward" size={20} color={couleurs.encre} />
      </View>
      <View className="flex-row items-end justify-between gap-4">
        <View className="flex-1 gap-0.5">
          <Text numberOfLines={1} className="font-titre-gras text-xl text-encre">
            {visite.lieu.emoji} {visite.lieu.nom}
          </Text>
          {attente ? <Text className="font-texte text-sm text-gris">{lierPonctuation(attente)}</Text> : null}
        </View>
        {code ? (
          <View className="rounded-2xl border-2 border-encre bg-carte px-3 py-1.5">
            <Text className="font-titre text-[28px] tracking-[6px] text-encre">{code}</Text>
          </View>
        ) : null}
      </View>
      <Text className="font-texte-semi text-sm text-encre">{lierPonctuation(T.enCoursConsigne)}</Text>
    </Pressable>
  );
}
