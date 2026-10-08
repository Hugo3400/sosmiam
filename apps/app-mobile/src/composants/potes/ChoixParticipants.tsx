import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Platform, Pressable, Text, View } from "react-native";

import type { Pote } from "@sos-miam/commun/types/potes";
import { Bouton } from "~/composants/interface/Bouton";
import { RondPote } from "~/composants/potes/RondPote";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Ta bande */
  potes: Pote[];
  /** Identifiants des potes invités */
  choisis: string[];
  /** Nombre d'invités au plus (sans toi) */
  max: number;
  onBasculer: (id: string) => void;
  /** Message sous la liste (ex. personne d'invité) */
  erreur?: string | null;
  /** Potes qu'on ne peut pas cocher pour l'instant (identifiant → pourquoi, lu par le lecteur d'écran) ; ceux déjà cochés restent décochables */
  indisponibles?: Record<string, string>;
};

/** Choisir les potes à inviter dans ta bande : une ligne par pote, cochée ou non. */
export function ChoixParticipants({ potes, choisis, max, onBasculer, erreur, indisponibles }: Props) {
  const router = useRouter();
  const complet = choisis.length >= max;

  if (potes.length === 0) {
    return (
      <View className="items-center gap-3 rounded-carte border-2 border-dashed border-ligne px-6 py-6">
        <Text className="text-center font-texte text-base leading-6 text-gris">
          {lierPonctuation("Ta bande est vide pour l'instant : ajoute un pote, et tu pourras l'inviter.")}
        </Text>
        <Bouton libelle="Ajouter un pote" variante="blanc" petit onPress={() => router.push("/potes/ajouter")} />
      </View>
    );
  }

  return (
    <View className="gap-1">
      {potes.map((pote) => {
        const choisi = choisis.includes(pote.id);
        const raison = choisi ? undefined : indisponibles?.[pote.id];
        const bloque = (complet && !choisi) || raison !== undefined;
        return (
          <Pressable
            key={pote.id}
            // Sur iPhone, « coché » est lu en anglais : bouton « sélectionné » ; case à cocher ailleurs
            accessibilityRole={Platform.OS === "ios" ? "button" : "checkbox"}
            accessibilityState={Platform.OS === "ios" ? { selected: choisi, disabled: bloque } : { checked: choisi, disabled: bloque }}
            accessibilityLabel={`${pote.prenom}, ${pote.ville}`}
            accessibilityHint={raison ?? (bloque ? `${max} invités au plus par sortie` : undefined)}
            disabled={bloque}
            onPress={() => {
              vibrerLegerement();
              onBasculer(pote.id);
            }}
            className={`min-h-14 flex-row items-center gap-3 border-b border-ligne py-2.5 active:opacity-70 ${bloque ? "opacity-40" : ""}`}
          >
            <RondPote pote={pote} taille={40} />
            <View className="flex-1">
              <Text numberOfLines={1} className="font-texte-gras text-base text-encre">
                {pote.prenom}
              </Text>
              <Text numberOfLines={1} className="font-texte text-sm text-gris">
                @{pote.pseudo} · {pote.ville}
              </Text>
            </View>
            <View className={`h-7 w-7 items-center justify-center rounded-full border-2 border-encre ${choisi ? "bg-encre" : "bg-white"}`}>
              {choisi ? <Ionicons name="checkmark" size={16} color={couleurs.jaune} /> : null}
            </View>
          </Pressable>
        );
      })}
      {erreur ? (
        <Text className="mt-1 font-texte text-sm leading-5 text-rouge-texte">
          {lierPonctuation(erreur)}
        </Text>
      ) : null}
    </View>
  );
}
