import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { AccessibilityInfo, Pressable, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { RAISONS_AVEC_MASQUAGE_IMMEDIAT } from "@sos-miam/commun/regles/signalement";
import type { Signalement } from "@sos-miam/commun/types/signalement";
import { DetailsSignalement } from "~/composants/signalement/DetailsSignalement";
import { ListeRaisonsSignalement } from "~/composants/signalement/ListeRaisonsSignalement";
import { MerciSignalement } from "~/composants/signalement/MerciSignalement";
import type { ChoixRaisonSignalement } from "~/contenus/raisons-signalement";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

/** Ce que la personne a choisi et écrit ; le fil y ajoute la publication et la date. */
export type ChoixSignalement = Pick<Signalement, "raison" | "precision" | "explication">;

type Props = {
  nomLieu: string;
  onEnvoyer: (choix: ChoixSignalement) => void;
  /** Retour au menu « ⋯ » depuis la première étape */
  onRetourMenu: () => void;
  onFermer: () => void;
};

type Etape = "raison" | "details" | "merci";

/** Signaler une publication, en trois temps : la raison, les précisions et le pourquoi, puis merci. */
export function SignalementPublication({ nomLieu, onEnvoyer, onRetourMenu, onFermer }: Props) {
  const [etape, setEtape] = useState<Etape>("raison");
  const [raison, setRaison] = useState<ChoixRaisonSignalement | null>(null);
  const [precision, setPrecision] = useState<string | null>(null);
  const [explication, setExplication] = useState("");

  const titre = etape === "details" && raison ? `${raison.emoji} ${raison.titre}` : "Pourquoi tu signales ?";
  const sousTitre = etape === "details" ? "Dis-nous en plus, ça aide l'équipe." : `Publication sur ${nomLieu}`;

  // Le contenu change sous le doigt : VoiceOver annonce la nouvelle étape
  useEffect(() => {
    if (etape !== "merci") AccessibilityInfo.announceForAccessibility(titre);
  }, [etape, titre]);

  function choisirRaison(choix: ChoixRaisonSignalement) {
    if (choix.cle !== raison?.cle) setPrecision(null);
    setRaison(choix);
    setEtape("details");
  }

  function envoyer() {
    if (!raison) return;
    vibrerLegerement();
    onEnvoyer({ raison: raison.cle, precision, explication: explication.trim() });
    setEtape("merci");
  }

  if (etape === "merci") {
    return (
      <Animated.View entering={FadeIn.duration(200)}>
        <MerciSignalement grave={!!raison?.grave} masqueePourTous={!!raison && RAISONS_AVEC_MASQUAGE_IMMEDIAT.includes(raison.cle)} onFermer={onFermer} />
      </Animated.View>
    );
  }

  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={etape === "details" ? "Retour aux raisons" : "Retour au menu"}
          hitSlop={8}
          onPress={() => (etape === "details" ? setEtape("raison") : onRetourMenu())}
          className="-ml-2 h-11 w-11 items-center justify-center rounded-full active:opacity-70"
        >
          <Ionicons name="chevron-back" size={26} color={couleurs.encre} />
        </Pressable>
        <View className="flex-1">
          <Text accessibilityRole="header" numberOfLines={2} className="font-titre text-2xl text-encre">
            {titre}
          </Text>
          <Text numberOfLines={1} className="font-texte text-sm text-gris">
            {sousTitre}
          </Text>
        </View>
      </View>

      <Animated.View key={etape} entering={FadeIn.duration(180)}>
        {etape === "details" && raison ? (
          <DetailsSignalement
            raison={raison}
            precision={precision}
            onChoisirPrecision={setPrecision}
            explication={explication}
            onChangerExplication={setExplication}
            onEnvoyer={envoyer}
          />
        ) : (
          <ListeRaisonsSignalement onChoisir={choisirRaison} />
        )}
      </Animated.View>
    </View>
  );
}
