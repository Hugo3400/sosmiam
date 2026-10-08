import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { Visite } from "@sos-miam/commun/types/visite";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { decrireAttenteAddition } from "~/fonctions/visites/decrire-attente-addition";
import { formaterCodeLu } from "~/fonctions/visites/formater-code-lu";
import couleurs from "~/theme/couleurs";

type Props = {
  /** La demande d'addition en attente (statut « demandee ») */
  visite: Visite;
  onPress: () => void;
};

const UNE_MINUTE = 60_000;

/** Ta demande d'addition en attente, en haut de l'onglet Scan : le lieu, le code à montrer et le temps qu'il reste. */
export function CarteDemandeEnCours({ visite, onPress }: Props) {
  // « Expire dans 27 min » se met à jour toute seule, une fois par minute
  const [maintenant, setMaintenant] = useState(() => new Date());
  useEffect(() => {
    const minuterie = setInterval(() => setMaintenant(new Date()), UNE_MINUTE);
    return () => clearInterval(minuterie);
  }, []);

  const attente = visite.expireLe ? decrireAttenteAddition(visite.expireLe, maintenant) : null;
  const code = visite.code ?? "";
  const libelle = [
    `Addition demandée chez ${visite.lieu.nom}`,
    code ? `ton code : ${formaterCodeLu(code)}` : null,
    attente,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityHint="Ouvre ta demande en cours"
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className="gap-3 rounded-carte border-2 border-encre bg-jaune-clair px-5 py-4 active:opacity-80"
    >
      <View className="flex-row items-center gap-2">
        <View className="h-2.5 w-2.5 rounded-full bg-tomate" />
        <Text className="flex-1 font-texte-gras text-[13px] uppercase tracking-wide text-encre">Addition demandée</Text>
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
          <View className="rounded-2xl border-2 border-encre bg-white px-3 py-1.5">
            <Text className="font-titre text-[28px] tracking-[6px] text-encre">{code}</Text>
          </View>
        ) : null}
      </View>
      <Text className="font-texte-semi text-sm text-encre">{lierPonctuation("Montre ce code au moment de payer : l'équipe valide d'un geste.")}</Text>
    </Pressable>
  );
}
