import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, useWindowDimensions, View } from "react-native";

import { REACTIONS_PAR_CODE } from "@sos-miam/commun/regles/chat";
import type { TypePartage } from "@sos-miam/commun/types/messagerie";
import { TuilePhotoPartagee } from "~/composants/chat/TuilePhotoPartagee";
import { VisionneusePhotosChat } from "~/composants/chat/VisionneusePhotosChat";
import { Pastille } from "~/composants/interface/Pastille";
import { TEXTES_CHAT_BULLES_PAR_LANGUE } from "~/contenus/textes-chat-bulles";
import { TEXTES_INFOS_GROUPE_PAR_LANGUE } from "~/contenus/textes-infos-groupe";
import { TEXTES_MEDIAS_CHAT_PAR_LANGUE } from "~/contenus/textes-medias-chat";
import type { MessageChatEnrichi } from "~/contenus/type-discussion-chat";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { ecrireQuartierVille } from "~/fonctions/lieux/ecrire-quartier-ville";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserPartagesGroupe } from "~/hooks/utiliser-partages-groupe";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  conversationId: string;
  repere: string;
  prenomDe: (auteur: string) => string;
};

const COLONNES = 4;
const ECART = 4;
const MARGE = 20;

export function PartagesGroupe({ conversationId, repere, prenomDe }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_INFOS_GROUPE_PAR_LANGUE);
  const T_MEDIAS = utiliserTextes(TEXTES_MEDIAS_CHAT_PAR_LANGUE);
  const T_BULLES = utiliserTextes(TEXTES_CHAT_BULLES_PAR_LANGUE);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const monId = utiliserMonId();
  const { basculerReaction } = utiliserConversations();
  const { trouverLieu } = utiliserLieux();
  const [type, setType] = useState<TypePartage>("photo");
  const [ouverte, setOuverte] = useState<number | null>(null);
  const partages = utiliserPartagesGroupe(conversationId, type, repere);
  const taille = Math.floor((width - 2 * MARGE - (COLONNES - 1) * ECART) / COLONNES);
  const choix: { cle: TypePartage; libelle: string }[] = [
    { cle: "photo", libelle: T.photos },
    { cle: "lieu", libelle: T.lieux },
  ];

  function doubleAppui(message: MessageChatEnrichi): boolean {
    const deja = (message.reactions[REACTIONS_PAR_CODE.miam] ?? []).includes(monId);
    basculerReaction(conversationId, message.id, REACTIONS_PAR_CODE.miam);
    return !deja;
  }

  return (
    <View className="gap-2.5">
      <View className="flex-row flex-wrap items-center gap-2">
        <Text accessibilityRole="header" className="flex-1 font-titre-gras text-lg text-encre">
          {T.partageIci}
        </Text>
        {choix.map((c, i) => (
          <Pastille
            key={c.cle}
            libelle={c.libelle}
            role="radio"
            choisi={type === c.cle}
            position={i + 1}
            total={choix.length}
            mention={type === c.cle && partages.etat === "pret" && !partages.plus ? String(partages.messages.length) : undefined}
            onPress={() => {
              setType(c.cle);
              setOuverte(null);
            }}
          />
        ))}
      </View>

      {partages.etat === "chargement" ? (
        <View className="items-center py-6">
          <ActivityIndicator color={couleurs.encre} />
        </View>
      ) : partages.etat === "erreur" ? (
        <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(T.partagesIndisponibles)}</Text>
      ) : partages.messages.length === 0 ? (
        <View className="items-center rounded-carte border-2 border-dashed border-ligne px-5 py-5">
          <Text className="text-center font-texte text-[15px] leading-6 text-gris">{lierPonctuation(type === "photo" ? T.aucunePhoto : T.aucunLieu)}</Text>
        </View>
      ) : type === "photo" ? (
        <View className="flex-row flex-wrap" style={{ gap: ECART }}>
          {partages.messages.map((m, i) => (
            <TuilePhotoPartagee
              key={m.id}
              conversationId={conversationId}
              message={m}
              taille={taille}
              libelle={`${T_MEDIAS.voirPhoto(i + 1, partages.messages.length)}, ${prenomDe(m.auteur)}`}
              onPress={() => {
                vibrerLegerement();
                setOuverte(i);
              }}
            />
          ))}
        </View>
      ) : (
        <View>
          {partages.messages.map((m) => {
            const lieu = m.lieuId === undefined ? undefined : trouverLieu(m.lieuId);
            if (!lieu) return null;
            return (
              <Pressable
                key={m.id}
                accessibilityRole="button"
                accessibilityLabel={T_BULLES.partageParLu(lieu.nom, lieu.info, prenomDe(m.auteur))}
                accessibilityHint={T_BULLES.ouvreFiche}
                onPress={() => {
                  vibrerLegerement();
                  router.push({ pathname: "/lieu/[id]", params: { id: String(lieu.id) } });
                }}
                className="min-h-14 flex-row items-center gap-3 border-b border-ligne py-2 active:opacity-70"
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-jaune-clair">
                  <Text allowFontScaling={false} style={{ fontSize: 20, lineHeight: 26 }}>
                    {lieu.emoji}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text numberOfLines={1} className="font-texte-gras text-[15px] text-encre">
                    {lieu.nom}
                  </Text>
                  <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
                    {`${[lieu.info, ecrireQuartierVille(lieu)].filter(Boolean).join(" · ")} · ${prenomDe(m.auteur)}`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={couleurs.gris} />
              </Pressable>
            );
          })}
        </View>
      )}

      {partages.plus ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: partages.suiteEnCours }}
          onPress={() => void partages.chargerSuite()}
          className="min-h-11 items-center justify-center self-center rounded-full border-2 border-encre bg-carte px-5 active:opacity-80"
        >
          {partages.suiteEnCours ? <ActivityIndicator color={couleurs.encre} /> : <Text className="font-texte-gras text-sm text-encre">{T.voirPlus}</Text>}
        </Pressable>
      ) : null}

      {ouverte !== null && type === "photo" && partages.messages.length > 0 ? (
        <VisionneusePhotosChat
          visible
          conversationId={conversationId}
          photos={partages.messages}
          depart={ouverte}
          prenomDe={(m) => prenomDe(m.auteur)}
          onFermer={() => setOuverte(null)}
          onDoubleAppui={doubleAppui}
        />
      ) : null}
    </View>
  );
}
