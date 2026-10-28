import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, Pressable, Text, useWindowDimensions, View, type PressableProps } from "react-native";

import type { SondageApi } from "@sos-miam/commun/types/messagerie";
import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_SONDAGE_PAR_LANGUE } from "~/contenus/textes-sondage";
import { decrireSondage } from "~/fonctions/chat/decrire-sondage";
import { lireEtatSondage } from "~/fonctions/chat/lire-etat-sondage";
import { retirerEmojiAnnonce } from "~/fonctions/chat/retirer-emoji-annonce";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { ecrireQuartierVille } from "~/fonctions/lieux/ecrire-quartier-ville";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  conversationId: string;
  messageId: string;
  vote: SondageApi;
  deMoi: boolean;
  participants: string[];
  maintenant: Date;
  onAppuiLong: () => void;
  actionsLecteur?: Pick<PressableProps, "accessibilityActions" | "onAccessibilityAction">;
};

const LARGEUR_MAX = 310;

export function CarteSondageChat({ conversationId, messageId, vote, deMoi, participants, maintenant, onAppuiLong, actionsLecteur }: Props) {
  const couleurs = utiliserCouleurs();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_SONDAGE_PAR_LANGUE);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { voterSondage } = utiliserConversations();
  const { trouverLieu } = utiliserLieux();
  const monId = utiliserMonId();
  const [souci, setSouci] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const { clos, gagnant } = lireEtatSondage(vote, maintenant);
  const pied = decrireSondage(vote, participants.length, maintenant, langue);
  const coins = deMoi ? "rounded-[20px] rounded-br-md" : "rounded-[20px] rounded-tl-md";
  const options = [...vote.options].sort((a, b) => a.ordre - b.ordre);
  const lieuGagnant = gagnant === null ? undefined : options.find((o) => o.ordre === gagnant)?.lieuId;

  function dire(texte: string) {
    setSouci(texte);
    AccessibilityInfo.announceForAccessibility(retirerEmojiAnnonce(texte));
  }

  async function voter(ordre: number, nom: string) {
    if (enCours) return;
    if (clos) return dire(T.sondageClos);
    vibrerLegerement();
    setSouci(null);
    setEnCours(true);
    const retirer = vote.monVote === ordre;
    const resultat = await voterSondage(conversationId, messageId, retirer ? null : ordre);
    setEnCours(false);
    if (resultat === "clos") return dire(T.sondageClos);
    if (resultat === "reseau") return dire(T.voteRate);
    AccessibilityInfo.announceForAccessibility(retirer ? T.voteRetire : T.voteMis(nom));
  }

  return (
    <View style={{ width: Math.min(LARGEUR_MAX, Math.round(width * 0.8)) }} className={`gap-2 border-2 border-encre bg-carte p-3 ${coins}`}>
      <Pressable accessibilityRole="header" onLongPress={onAppuiLong} delayLongPress={350} {...actionsLecteur} className="flex-row items-center gap-2">
        <Text className="flex-1 font-titre text-lg leading-6 text-encre">{lierPonctuation(T.question)}</Text>
        {clos ? (
          <View className="rounded-full border border-encre px-2 py-0.5">
            <Text className="font-texte-gras text-xs text-encre">{T.voteFini}</Text>
          </View>
        ) : null}
      </Pressable>

      {options.map((o) => {
        const lieu = trouverLieu(o.lieuId);
        const nom = lieu?.nom ?? T.lieuParti;
        const info = lieu ? [lieu.info, ecrireQuartierVille(lieu)].filter(Boolean).join(" · ") : "";
        const mien = vote.monVote === o.ordre;
        const gagne = clos && gagnant === o.ordre;
        const part = vote.votants > 0 ? Math.min(1, o.votes / vote.votants) : 0;
        const lu = [nom, info, T.voix(o.votes), mien ? T.tonVote : null, gagne ? T.gagnant : null].filter(Boolean).join(", ");
        return (
          <Pressable
            key={o.ordre}
            accessibilityRole="button"
            accessibilityLabel={lu}
            accessibilityState={{ selected: mien, disabled: clos }}
            accessibilityHint={clos ? undefined : mien ? T.retirer : vote.monVote === null ? T.voter : T.changer}
            onPress={() => void voter(o.ordre, nom)}
            onLongPress={onAppuiLong}
            delayLongPress={350}
            className={`min-h-[52px] flex-row items-center gap-2.5 overflow-hidden rounded-[14px] border-2 px-2.5 py-1.5 active:opacity-80 ${gagne ? "bg-jaune" : "bg-creme"} ${mien || gagne ? "border-encre" : "border-ligne"}`}
          >
            {gagne ? null : <View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.round(part * 100)}%` }} className="bg-jaune-clair" />}
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ fontSize: 22, lineHeight: 28 }}>
              {lieu?.emoji ?? "📍"}
            </Text>
            <View className="flex-1">
              <Text numberOfLines={1} className={`font-texte-gras text-[15px] ${gagne ? "text-nuit" : "text-encre"}`}>
                {nom}
              </Text>
              {info ? (
                <Text numberOfLines={1} className={`font-texte text-xs ${gagne ? "text-nuit" : "text-gris"}`}>
                  {info}
                </Text>
              ) : null}
            </View>
            {gagne ? <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants">🏆</Text> : null}
            <View className="flex-row items-center gap-1">
              {mien ? <Ionicons name="checkmark-circle" size={18} color={gagne ? couleurs.nuit : couleurs.encre} /> : null}
              <Text className={`font-texte-gras text-sm ${gagne ? "text-nuit" : "text-encre"}`}>{o.votes}</Text>
            </View>
          </Pressable>
        );
      })}

      <Text className="font-texte text-[13px] leading-[18px] text-gris" accessibilityLabel={clos ? pied.lu : `${pied.lu}. ${T.piedOuvert}`}>
        {lierPonctuation(clos ? pied.vu : `${pied.vu}. ${T.piedOuvert}`)}
      </Text>
      {souci ? <Text className="font-texte-semi text-[13px] leading-[18px] text-rouge-texte">{lierPonctuation(souci)}</Text> : null}
      {clos && lieuGagnant !== undefined && trouverLieu(lieuGagnant) ? (
        <Bouton
          libelle={T.creerSortie}
          petit
          indice={T.indiceCreerSortie}
          onPress={() =>
            router.push({ pathname: "/potes/nouvelle-sortie", params: { lieu: String(lieuGagnant), invites: participants.filter((p) => p !== monId).join(",") } })
          }
          className="mt-1"
        />
      ) : null}
    </View>
  );
}
