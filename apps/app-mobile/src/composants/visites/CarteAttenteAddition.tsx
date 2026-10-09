import { useEffect, useState, type Ref } from "react";
import { Pressable, Text, View } from "react-native";

import { calculerPointsVisite } from "@sos-miam/commun/fonctions/visites/calculer-points-visite";
import type { Visite } from "@sos-miam/commun/types/visite";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { CodeRapprochement } from "~/composants/visites/CodeRapprochement";
import { PanneauSimulationLieu } from "~/composants/visites/PanneauSimulationLieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { direDeLieu } from "~/fonctions/visites/dire-de-lieu";
import { decrireAttenteAddition } from "~/fonctions/visites/decrire-attente-addition";
import { utiliserServices } from "~/hooks/utiliser-services";

type Props = {
  /** L'addition en attente */
  visite: Visite;
  /** Comme le voit l'équipe : « Léa M. » */
  prenom: string;
  /** Emoji de ton avatar (l'équipe voit le même à côté du code) */
  avatar: string;
  /** Le titre, pour y placer le lecteur d'écran */
  refTitre?: Ref<Text>;
};

// « Expire dans … » se remet à jour tout seul
const INTERVALLE_HORLOGE = 15_000;

/**
 * Addition demandée, en attente du lieu : le code à montrer en payant (avec ton prénom et ton emoji, comme les voit l'équipe),
 * le temps qu'il reste, les points en jeu pendant un SOS, de quoi jouer le lieu en démo, et « Annuler ma demande ».
 */
export function CarteAttenteAddition({ visite, prenom, avatar, refTitre }: Props) {
  const services = utiliserServices();
  const [maintenant, setMaintenant] = useState(() => new Date());
  const [confirmerAnnulation, setConfirmerAnnulation] = useState(false);

  useEffect(() => {
    const horloge = setInterval(() => setMaintenant(new Date()), INTERVALLE_HORLOGE);
    return () => clearInterval(horloge);
  }, []);

  const lieu = visite.lieu;
  const attente = visite.expireLe ? decrireAttenteAddition(visite.expireLe, maintenant) : null;

  return (
    <View className="gap-5">
      <View className="items-center gap-1">
        <Text ref={refTitre} accessibilityRole="header" className="text-center font-titre text-3xl text-encre">
          Addition demandée !
        </Text>
        <View className="flex-row items-center justify-center gap-2">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-base">
            {lieu.emoji}
          </Text>
          <Text className="shrink text-center font-texte-semi text-base text-gris">{lieu.nom}</Text>
        </View>
      </View>

      {visite.code ? <CodeRapprochement code={visite.code} prenom={prenom} avatar={avatar} legende="Montre ce code au moment de payer" /> : null}

      <View className="mt-1 gap-3 rounded-carte border-2 border-encre bg-white p-4">
        <Text className="font-texte text-base leading-6 text-encre">
          {lierPonctuation(`L'équipe ${direDeLieu(lieu.nom)} va la marquer réglée. Tu peux fermer l'app : ta demande reste au chaud.`)}
        </Text>
        {attente ? (
          <View accessible accessibilityLabel={attente} className="flex-row items-center gap-2">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-base">
              ⏳
            </Text>
            <Text className="font-texte-semi text-sm text-gris">{attente}</Text>
          </View>
        ) : null}
      </View>

      {visite.pendantSos ? (
        <View accessible className="flex-row items-center gap-3 rounded-carte bg-rose-alerte px-4 py-3">
          <View className="h-2.5 w-2.5 rounded-full bg-rouge-sos" />
          <Text className="flex-1 font-texte-semi text-sm leading-5 text-rouge-texte">
            {lierPonctuation(`Ta demande est tombée pendant leur SOS : ta visite vaudra +${calculerPointsVisite(true)} points une fois validée.`)}
          </Text>
        </View>
      ) : null}

      <PanneauSimulationLieu visite={visite} />

      <Pressable
        accessibilityRole="button"
        accessibilityHint="Te demande de confirmer avant d'annuler"
        onPress={() => setConfirmerAnnulation(true)}
        className="min-h-11 items-center justify-center self-center px-4 active:opacity-60"
      >
        <Text className="font-texte-semi text-base text-gris underline">Annuler ma demande</Text>
      </Pressable>

      <FeuilleConfirmation
        visible={confirmerAnnulation}
        emoji="🧾"
        titre="Annuler ta demande ?"
        detail="Le code ne servira plus. Tu pourras en redemander une quand tu veux, par exemple si tu as changé de table."
        libelleConfirmer="Annuler la demande"
        libelleRester="Je la garde"
        indiceRester="Ta demande reste en attente"
        onConfirmer={() => {
          // L'écran se met à jour tout seul ; si le lieu a été plus rapide, il montre sa réponse
          services.visites.annulerDemande(visite.id).catch(() => {});
        }}
        onFermer={() => setConfirmerAnnulation(false)}
      />
    </View>
  );
}
