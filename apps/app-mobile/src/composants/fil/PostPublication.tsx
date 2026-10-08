import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { ActionPost } from "~/composants/fil/ActionPost";
import { BoueeEnvol } from "~/composants/fil/BoueeEnvol";
import { CoeurEnvol } from "~/composants/fil/CoeurEnvol";
import { MediaPublication } from "~/composants/fil/MediaPublication";
import type { Publication } from "~/contenus/type-publication";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { formaterDistance } from "~/fonctions/geo/formater-distance";
import { formaterNombreCourt } from "~/fonctions/texte/formater-nombre-court";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  publication: Publication;
  lieu: Lieu;
  largeur: number;
  hauteur: number;
  /** « Parce que tu aimes les restos »… */
  raison: string | null;
  aime: boolean;
  garde: boolean;
  /** Publication affichée à l'écran : seule celle-ci joue sa vidéo et anime son cadre */
  actif: boolean;
  /** Numéros des dernières animations (double appui, rescousse) */
  envolCoeur: number;
  envolBouee: number;
  onJaime: () => void;
  onDoubleAppui: () => void;
  onCommentaires: () => void;
  onGarder: () => void;
  onPartager: () => void;
  onMenu: () => void;
  onVoir: () => void;
};

const DELAI_DOUBLE_APPUI = 280;
const ombreTexte = { textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 6 };

/** Une publication en plein écran : la vidéo ou les photos d'un lieu, son auteur, ses infos et la colonne d'actions. */
export function PostPublication(props: Props) {
  const { publication, lieu, largeur, hauteur, raison, aime, garde, actif, envolCoeur, envolBouee } = props;
  const animationsReduites = useReducedMotion();
  const cadre = useSharedValue(1);
  const [enPause, setEnPause] = useState(false);
  const dernierAppui = useRef(0);
  const appuiSimple = useRef<ReturnType<typeof setTimeout> | null>(null);

  // En quittant l'écran, la vidéo reprendra du début de la boucle, pas en pause
  useEffect(() => {
    if (!actif) setEnPause(false);
  }, [actif]);

  useEffect(() => {
    if (!actif || !lieu.sos || animationsReduites) {
      cadre.value = 1;
      return;
    }
    cadre.value = withRepeat(withTiming(0.35, { duration: 800 }), -1, true);
  }, [actif, lieu.sos, animationsReduites, cadre]);
  const styleCadre = useAnimatedStyle(() => ({ opacity: cadre.value }));

  // Un appui : pause ou lecture (vidéo) ; deux appuis rapprochés : « J'aime »
  function appuiSurLeMedia() {
    const maintenant = Date.now();
    if (maintenant - dernierAppui.current < DELAI_DOUBLE_APPUI) {
      if (appuiSimple.current) clearTimeout(appuiSimple.current);
      dernierAppui.current = 0;
      props.onDoubleAppui();
      return;
    }
    dernierAppui.current = maintenant;
    if (publication.media.type === "video") appuiSimple.current = setTimeout(() => setEnPause((p) => !p), DELAI_DOUBLE_APPUI);
  }

  const auteur = publication.auteur;
  const nomAuteur = auteur.type === "lieu" ? lieu.nom : `@${auteur.pseudo}`;
  const typeMedia = publication.media.type === "video" ? "Vidéo" : `${publication.media.photos.length} photos`;
  const description = [
    `${typeMedia} de ${nomAuteur}`,
    auteur.type === "createur" && auteur.partenariat ? `Collaboration commerciale : ${auteur.partenariat}` : null,
    lieu.sos ? `SOS : ${lieu.sos.places} places jusqu'à ${formaterHeure(lieu.sos.jusqua)}` : null,
    lieu.alerte,
    raison,
    `${lieu.nom}, ${lieu.info}, ${lieu.quartier}, ${lieu.ville}, à ${formaterDistance(lieu.km)}, ${lieu.prix}`,
    publication.legende,
  ].filter(Boolean).join(". ");

  return (
    <View style={{ height: hauteur, width: largeur }} className="overflow-hidden bg-encre">
      <LinearGradient colors={lieu.couleurs} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ position: "absolute", inset: 0 }} />
      <MediaPublication media={publication.media} largeur={largeur} hauteur={hauteur} actif={actif} enPause={enPause} />

      {/* Zone d'appui sur le média (VoiceOver passe par les boutons ❤️ et ⋯) ; les photos gardent leur glissement de côté */}
      {publication.media.type === "video" ? (
        <Pressable onPress={appuiSurLeMedia} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: "absolute", inset: 0 }} />
      ) : null}

      <LinearGradient colors={["rgba(0,0,0,0.35)", "transparent"]} pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, height: 140 }} />
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.75)"]} pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: hauteur * 0.55 }} />

      <View className="absolute inset-x-0 bottom-0 pb-6 pl-5 pr-[88px]">
        <View accessible accessibilityLabel={description} className="gap-1.5">
          <View className="flex-row items-center gap-2">
            <View className="h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-jaune">
              <Text className="text-sm">{auteur.type === "lieu" ? lieu.emoji : "🎬"}</Text>
            </View>
            <Text className="font-texte-gras text-[15px] text-white" style={ombreTexte}>{nomAuteur}</Text>
          </View>
          {auteur.type === "createur" && auteur.partenariat ? (
            <Text className="self-start overflow-hidden rounded-md bg-white/85 px-2 py-0.5 font-texte-semi text-xs text-encre">
              Collaboration commerciale · {auteur.partenariat}
            </Text>
          ) : null}
          <View className="flex-row flex-wrap gap-2">
            {lieu.sos ? (
              <Text className="overflow-hidden rounded-full bg-jaune px-3 py-1 font-texte-gras text-[13px] text-encre">
                🛟 SOS · {lieu.sos.places} places jusqu'à {formaterHeure(lieu.sos.jusqua)}
              </Text>
            ) : null}
            {lieu.alerte ? (
              <Text className="overflow-hidden rounded-full bg-tomate px-3 py-1 font-texte-gras text-[13px] text-white">🔥 {lieu.alerte}</Text>
            ) : null}
          </View>
          {raison ? <Text className="font-texte-semi text-sm text-jaune-clair" style={ombreTexte}>💛 {raison}</Text> : null}
          <Text className="font-titre text-[26px] leading-[30px] text-white" style={ombreTexte}>{lieu.nom}</Text>
          <Text className="font-texte-moyen text-[14px] text-white/90" style={ombreTexte}>
            📍 {lieu.quartier}, {lieu.ville} · {formaterDistance(lieu.km)} · {lieu.prix}
          </Text>
          <Text numberOfLines={3} className="font-texte text-[15px] leading-[21px] text-white" style={ombreTexte}>
            {lierPonctuation(publication.legende)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Voir l'adresse de ${lieu.nom}`}
          onPress={props.onVoir}
          className="mt-3 min-h-11 self-start justify-center rounded-full bg-white/25 px-4 active:opacity-70"
        >
          <Text className="font-texte-semi text-[15px] text-white">Voir l'adresse →</Text>
        </Pressable>
      </View>

      <View className="absolute bottom-6 right-3 items-center gap-4">
        <ActionPost
          actif={aime}
          icone={<Ionicons name={aime ? "heart" : "heart-outline"} size={28} color={aime ? couleurs.tomate : "#FFFFFF"} />}
          libelle={formaterNombreCourt(publication.jaimes + (aime ? 1 : 0))}
          description={aime ? "Retirer ton J'aime" : `J'aime, ${publication.jaimes} personnes aiment`}
          onPress={props.onJaime}
          style="transparent"
        />
        <ActionPost
          icone={<Ionicons name="chatbubble-ellipses" size={26} color="#FFFFFF" />}
          libelle={formaterNombreCourt(publication.commentaires)}
          description={`Commentaires, ${publication.commentaires}`}
          onPress={props.onCommentaires}
          style="transparent"
        />
        <ActionPost
          actif={garde}
          icone={<Ionicons name={garde ? "bookmark" : "bookmark-outline"} size={26} color={garde ? couleurs.jaune : "#FFFFFF"} />}
          libelle={garde ? "Gardé" : "Garder"}
          description={garde ? `Ne plus garder ${lieu.nom}` : `Garder ${lieu.nom} pour plus tard`}
          onPress={props.onGarder}
          style="transparent"
        />
        <ActionPost
          icone={<Ionicons name="arrow-redo" size={26} color="#FFFFFF" />}
          libelle="Partager"
          description={`Partager ${lieu.nom}`}
          onPress={props.onPartager}
          style="transparent"
        />
        <ActionPost
          icone={<Ionicons name="ellipsis-horizontal" size={26} color="#FFFFFF" />}
          libelle=""
          description="Plus d'options : rescousse, adresse, pas intéressé, signaler"
          onPress={props.onMenu}
          style="transparent"
        />
      </View>

      {lieu.sos ? (
        <Animated.View pointerEvents="none" style={[{ position: "absolute", inset: 0, borderWidth: 5, borderColor: couleurs.jaune }, styleCadre]} />
      ) : null}
      <CoeurEnvol numero={envolCoeur} />
      <BoueeEnvol numero={envolBouee} />
    </View>
  );
}
