import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { FeuilleNePlusSuivre } from "~/composants/suivi/FeuilleNePlusSuivre";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Clé de suivi (voir calculerCleSuivi) : « lieu:<id> » ou « createur:<pseudo> » */
  cle: string;
  /** Lu par VoiceOver et dans les annonces : « @lea.mange » ou le nom du lieu */
  nom: string;
  /** Son emoji (🎬 pour un créateur, celui du lieu), dans la feuille de confirmation */
  emoji: string;
  /** Affiche le petit message de l'écran (« 🔔 Tu suis maintenant … ! », « Tu ne suis plus … ») */
  onAnnoncer: (texte: string) => void;
  /** « grand » sur la fiche d'un lieu et la page d'un créateur, « compact » dans les lignes de la liste « Tu suis » */
  taille?: "grand" | "compact";
};

// Deux appuis plus rapprochés que ça comptent pour un seul : un double toucher sur « Suivre » n'ouvre pas aussitôt « Ne plus suivre ? »
const DELAI_ANTI_DOUBLE_APPUI = 700;

/**
 * « Suivre » (jaune) suit tout de suite ; « Suivi ✓ » ouvre une feuille « Ne plus suivre … ? » : on ne désabonne jamais
 * sur un seul toucher. Lit lui-même l'état du suivi : il se met à jour même dans un en-tête mémorisé.
 */
export function BoutonSuivreProfil({ cle, nom, emoji, onAnnoncer, taille = "grand" }: Props) {
  const { estSuivi, basculerSuivi } = utiliserActivite();
  const [feuilleOuverte, setFeuilleOuverte] = useState(false);
  const dernierAppui = useRef(0);
  const suivi = estSuivi(cle);
  const compact = taille === "compact";

  function toucher() {
    const maintenant = Date.now();
    if (maintenant - dernierAppui.current < DELAI_ANTI_DOUBLE_APPUI) return;
    dernierAppui.current = maintenant;
    vibrerLegerement();
    if (suivi) setFeuilleOuverte(true);
    else if (basculerSuivi(cle)) onAnnoncer(`🔔 Tu suis maintenant ${nom} !`);
  }

  function arreterDeSuivre() {
    // Déjà arrêté ailleurs pendant que la feuille était ouverte : surtout ne pas se réabonner
    if (!estSuivi(cle)) return;
    if (!basculerSuivi(cle)) onAnnoncer(`Tu ne suis plus ${nom}, sans rancune 👋`);
  }

  const libelle = suivi ? "Suivi" : "Suivre";
  const accessibilite = {
    accessibilityRole: "button" as const,
    accessibilityLabel: suivi ? `Tu suis ${nom}` : `Suivre ${nom}`,
    accessibilityHint: suivi ? "Touche pour ne plus suivre" : "Ses prochaines publications passeront en tête de ton fil",
  };

  const feuille = (
    <FeuilleNePlusSuivre visible={feuilleOuverte} nom={nom} emoji={emoji} onConfirmer={arreterDeSuivre} onFermer={() => setFeuilleOuverte(false)} />
  );

  if (compact) {
    return (
      <>
        <Pressable
          {...accessibilite}
          // 36 pt de haut à l'écran, 48 pt sous le doigt
          hitSlop={6}
          onPress={toucher}
          className={`h-9 min-w-24 flex-row items-center justify-center gap-1 rounded-full border-2 border-encre px-3 active:opacity-70 ${suivi ? "bg-white" : "bg-jaune"}`}
        >
          <Ionicons name={suivi ? "checkmark" : "person-add"} size={14} color={couleurs.encre} />
          <Text className="font-texte-gras text-[13px] text-encre">{libelle}</Text>
          {suivi ? <Ionicons name="chevron-down" size={12} color={couleurs.encre} /> : null}
        </Pressable>
        {feuille}
      </>
    );
  }

  // Comme le Bouton SOS Miam : bord noir et ombre décalée, avec une icône
  return (
    <View className="relative">
      <View className="absolute inset-0 translate-x-1 translate-y-1 rounded-full bg-encre" />
      <Pressable
        {...accessibilite}
        onPress={toucher}
        className={`min-h-14 flex-row items-center justify-center gap-2 rounded-full border-2 border-encre px-6 py-3.5 active:translate-x-0.5 active:translate-y-0.5 ${suivi ? "bg-white" : "bg-jaune"}`}
      >
        <Ionicons name={suivi ? "checkmark" : "person-add"} size={suivi ? 20 : 18} color={couleurs.encre} />
        <Text className="font-texte-gras text-base text-encre">{libelle}</Text>
        {suivi ? <Ionicons name="chevron-down" size={16} color={couleurs.encre} /> : null}
      </Pressable>
      {feuille}
    </View>
  );
}
