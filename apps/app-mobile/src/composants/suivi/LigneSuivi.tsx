import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, View } from "react-native";

import { BoutonSuivreProfil } from "~/composants/suivi/BoutonSuivreProfil";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  /** Clé de suivi (calculerCleSuivi) : « lieu:<id> » ou « createur:<pseudo> » */
  cle: string;
  /** Emoji du lieu, ou 🎬 pour un créateur */
  emoji: string;
  /** Nom du lieu, ou « @pseudo » */
  nom: string;
  /** « Trattoria · Écusson, Montpellier » ou « Créateur · 3 publications » */
  sousTitre: string;
  /** Dégradé du lieu pour le rond ; sans dégradé, un rond jaune */
  degrade?: [string, string];
  /** Ce que la ligne ouvre, lu par VoiceOver : « Ouvre la fiche du lieu » */
  indice: string;
  /** Dernière ligne de la carte : pas de trait dessous */
  derniere: boolean;
  onOuvrir: () => void;
  onAnnoncer: (texte: string) => void;
};

const TAILLE_ROND = 48;
const DEBUT_DEGRADE = { x: 0.1, y: 0 };
const FIN_DEGRADE = { x: 0.9, y: 1 };

/**
 * Une ligne de « Tu suis » : rond (emoji du lieu ou 🎬), nom et sous-titre, à toucher pour ouvrir la fiche ; à droite,
 * le bouton Suivi / Suivre (ne plus suivre passe toujours par la petite feuille de confirmation).
 */
export function LigneSuivi({ cle, emoji, nom, sousTitre, degrade, indice, derniere, onOuvrir, onAnnoncer }: Props) {
  return (
    <View className={`flex-row items-center gap-2 pr-3 ${derniere ? "" : "border-b border-ligne"}`}>
      <Pressable
        accessibilityRole="button"
        // « · » devient une simple virgule pour le lecteur d'écran
        accessibilityLabel={`${nom}, ${sousTitre.replace(/ · /g, ", ")}`}
        accessibilityHint={indice}
        onPress={() => {
          vibrerLegerement();
          onOuvrir();
        }}
        className="min-h-16 flex-1 flex-row items-center gap-3 py-2.5 pl-3 pr-1 active:opacity-70"
      >
        <View
          style={{ width: TAILLE_ROND, height: TAILLE_ROND, borderRadius: TAILLE_ROND / 2 }}
          className="items-center justify-center overflow-hidden border-2 border-encre bg-jaune"
        >
          {degrade ? <LinearGradient colors={degrade} start={DEBUT_DEGRADE} end={FIN_DEGRADE} style={{ position: "absolute", inset: 0 }} /> : null}
          <Text className="text-2xl">{emoji}</Text>
        </View>
        <View className="flex-1 gap-0.5">
          <Text numberOfLines={1} className="font-texte-gras text-base text-encre">
            {nom}
          </Text>
          <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
            {sousTitre}
          </Text>
        </View>
      </Pressable>

      <BoutonSuivreProfil cle={cle} nom={nom} emoji={emoji} onAnnoncer={onAnnoncer} taille="compact" />
    </View>
  );
}
