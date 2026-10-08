import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { memo, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming, type SharedValue } from "react-native-reanimated";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { ActionPost } from "~/composants/fil/ActionPost";
import { AvatarSuivre } from "~/composants/fil/AvatarSuivre";
import { HAUTEUR_ZONE_PROGRESSION } from "~/composants/fil/BarreProgressionVideo";
import { BoueeEnvol } from "~/composants/fil/BoueeEnvol";
import { BoutonSuivre } from "~/composants/fil/BoutonSuivre";
import { CoeurEnvol } from "~/composants/fil/CoeurEnvol";
import { LegendeRepliable } from "~/composants/fil/LegendeRepliable";
import { MediaPublication } from "~/composants/fil/MediaPublication";
import type { Publication } from "~/contenus/type-publication";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { formaterDistance } from "~/fonctions/geo/formater-distance";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { formaterNombreCourt } from "~/fonctions/texte/formater-nombre-court";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  publication: Publication;
  lieu: Lieu;
  /** Distance du lieu depuis ta ville, en km (un nombre : la publication est mémorisée) */
  km: number;
  largeur: number;
  hauteur: number;
  /** « Parce que tu aimes les restos »… */
  raison: string | null;
  aime: boolean;
  garde: boolean;
  /** Tu suis l'auteur (le lieu, ou le créateur) */
  suivi: boolean;
  /** Vrai nombre de commentaires (réponses comprises), sans ceux des personnes bloquées */
  nombreCommentaires: number;
  /** Publication affichée à l'écran : seule celle-ci joue sa vidéo et anime son cadre */
  actif: boolean;
  /** Place à laisser en haut (en-tête du fil posé sur la publication) */
  margeHaut: number;
  /** Place à laisser en bas (barre d'onglets transparente posée sur le fil) */
  margeBas: number;
  /** Fiche réduite : seule une pastille du lieu reste, pour voir la vidéo en plein écran */
  reduit: boolean;
  /** Avancée de la réduction, de 0 (fiche ouverte) à 1 (réduite), animée par le fil sans nouveau rendu */
  reduction: SharedValue<number>;
  /** Numéros des dernières animations (double appui, rescousse) */
  envolCoeur: number;
  envolBouee: number;
  gestes: GestesPublication;
};

/** Ce que fait le fil quand on touche une publication : les mêmes fonctions pour toutes, pour ne redessiner que celles qui changent */
export type GestesPublication = {
  jaime: (publication: Publication) => void;
  doubleAppui: (publication: Publication) => void;
  commentaires: (publication: Publication) => void;
  garder: (publication: Publication) => void;
  partager: (publication: Publication) => void;
  menu: (publication: Publication) => void;
  voir: (publication: Publication) => void;
  reduire: () => void;
  /** Suit l'auteur, ou (déjà suivi) demande confirmation avant de ne plus le suivre */
  suivre: (publication: Publication) => void;
  /** Fiche du lieu, ou page du créateur */
  ouvrirAuteur: (publication: Publication) => void;
};

const DELAI_DOUBLE_APPUI = 280;
const DELAI_APPUI_LONG = 400;
// Fiche, pastille et colonne d'actions restent au-dessus de la barre d'avancée des vidéos (posée juste sur la barre d'onglets)
const ECART_BAS = HAUTEUR_ZONE_PROGRESSION + 6;
const ombreTexte = { textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 6 };

/** Une publication en plein écran : la vidéo ou les photos d'un lieu, son auteur, ses infos et la colonne d'actions. Mémorisée : elle ne se redessine que si ses données changent. */
export const PostPublication = memo(function PostPublication(props: Props) {
  const { publication, lieu, km, largeur, hauteur, raison, aime, garde, suivi, nombreCommentaires, actif, envolCoeur, envolBouee, margeHaut, margeBas, reduit, reduction, gestes } = props;
  const animationsReduites = useReducedMotion();
  const cadre = useSharedValue(1);
  const [enPause, setEnPause] = useState(false);
  // Appui long sur la vidéo : elle file en accéléré jusqu'à ce qu'on lâche
  const [acceleree, setAcceleree] = useState(false);
  const dernierAppui = useRef(0);
  const appuiSimple = useRef<ReturnType<typeof setTimeout> | null>(null);

  // En quittant l'écran, la vidéo reprendra du début de la boucle, pas en pause ni en accéléré
  useEffect(() => {
    if (actif) return;
    setEnPause(false);
    setAcceleree(false);
  }, [actif]);

  useEffect(() => {
    if (!actif || !lieu.sos || animationsReduites) {
      cadre.value = 1;
      return;
    }
    cadre.value = withRepeat(withTiming(0.35, { duration: 800 }), -1, true);
  }, [actif, lieu.sos, animationsReduites, cadre]);
  const styleCadre = useAnimatedStyle(() => ({ opacity: cadre.value }));

  // Fiche et pastille restent montées : seules leur opacité et leur position bougent, sur le fil d'affichage
  const styleFiche = useAnimatedStyle(() => ({ opacity: 1 - reduction.value, transform: [{ translateY: reduction.value * 48 }] }));
  const styleActions = useAnimatedStyle(() => ({ opacity: 1 - reduction.value, transform: [{ translateX: reduction.value * 72 }] }));
  const stylePastille = useAnimatedStyle(() => ({ opacity: reduction.value, transform: [{ translateY: (1 - reduction.value) * 16 }] }));
  const styleGrandDegrade = useAnimatedStyle(() => ({ opacity: 1 - reduction.value }));

  // Un appui : pause ou lecture (vidéo) ; deux appuis rapprochés : « J'aime »
  function appuiSurLeMedia() {
    const maintenant = Date.now();
    if (maintenant - dernierAppui.current < DELAI_DOUBLE_APPUI) {
      if (appuiSimple.current) clearTimeout(appuiSimple.current);
      dernierAppui.current = 0;
      gestes.doubleAppui(publication);
      return;
    }
    dernierAppui.current = maintenant;
    if (publication.media?.type === "video") appuiSimple.current = setTimeout(() => setEnPause((p) => !p), DELAI_DOUBLE_APPUI);
  }

  // Appui long (vidéo seulement) : l'appui simple en attente est oublié, et une vidéo en pause repart, en accéléré
  function debutAcceleration() {
    if (appuiSimple.current) clearTimeout(appuiSimple.current);
    dernierAppui.current = 0;
    vibrerLegerement();
    setEnPause(false);
    setAcceleree(true);
  }

  const auteur = publication.auteur;
  const nomAuteur = auteur.type === "lieu" ? lieu.nom : `@${auteur.pseudo}`;
  const emojiAuteur = auteur.type === "lieu" ? lieu.emoji : "🎬";
  const media = publication.media;
  const typeMedia = !media ? "Publication" : media.type === "video" ? "Vidéo" : `${media.photos.length} photos`;
  const etiquetteIllustration = media?.type === "photos" ? "Photos d'illustration" : "Vidéo d'illustration";
  const description = [
    `${typeMedia} de ${nomAuteur}`,
    media && publication.illustration ? etiquetteIllustration : null,
    auteur.type === "createur" && auteur.partenariat ? `Collaboration commerciale : ${auteur.partenariat}` : null,
    lieu.sos ? `SOS : ${lieu.sos.places} place${lieu.sos.places > 1 ? "s" : ""} jusqu'à ${formaterHeure(lieu.sos.jusqua)}` : null,
    lieu.alerte,
    raison,
    `${lieu.nom}, ${lieu.info}, ${lieu.quartier}, ${lieu.ville}, à ${formaterDistance(km)}, ${lieu.prix}`,
  ].filter(Boolean).join(". ");

  return (
    <View style={{ height: hauteur, width: largeur }} className="overflow-hidden bg-encre">
      <LinearGradient colors={lieu.couleurs} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ position: "absolute", inset: 0 }} />
      {media ? (
        <MediaPublication
          media={media}
          largeur={largeur}
          hauteur={hauteur}
          actif={actif}
          enPause={enPause}
          acceleree={acceleree}
          margeHaut={margeHaut}
          margeBas={margeBas}
          onAppuiPhoto={appuiSurLeMedia}
        />
      ) : (
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: "absolute", top: hauteur * 0.24, alignSelf: "center", fontSize: Math.min(140, hauteur * 0.17) }}>
          {lieu.emoji}
        </Text>
      )}

      {/* Zone d'appui sur le média (VoiceOver passe par les boutons ❤️ et ⋯) ; les photos gèrent leurs appuis elles-mêmes, pour garder le glissement de côté.
          Appui long sur une vidéo : accéléré tant qu'on garde le doigt (le relâcher ne compte pas comme un appui simple) */}
      {media?.type !== "photos" ? (
        <Pressable
          onPress={appuiSurLeMedia}
          onLongPress={media?.type === "video" ? debutAcceleration : undefined}
          onPressOut={() => setAcceleree(false)}
          delayLongPress={DELAI_APPUI_LONG}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ position: "absolute", inset: 0 }}
        />
      ) : null}

      <LinearGradient colors={["rgba(0,0,0,0.35)", "transparent"]} pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, height: 140 }} />

      {/* Média libre d'exemple : on le dit clairement (lu par VoiceOver dans la description ci-dessous) */}
      {media && publication.illustration ? (
        <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ top: margeHaut }} className="absolute left-4 flex-row items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5">
          <Text className="text-xs">{media.type === "video" ? "🎬" : "📷"}</Text>
          <Text className="font-texte-semi text-xs text-white">{etiquetteIllustration}</Text>
        </View>
      ) : null}
      {/* Dégradés du bas : le petit garde lisible la barre d'onglets, le grand (qui s'efface en réduisant) garde lisibles les infos */}
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)"]} pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: margeBas + 90 }} />
      <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 0, right: 0, bottom: 0, height: hauteur * 0.55 }, styleGrandDegrade]}>
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={{ flex: 1 }} />
      </Animated.View>

      {/* Le placement reste sur une View : NativeWind n'applique pas ses classes à une Animated.View qui porte un style animé */}
      <View pointerEvents={reduit ? "box-none" : "none"} aria-hidden={!reduit} style={{ bottom: margeBas + ECART_BAS }} className="absolute left-4 right-4 flex-row">
        <Animated.View style={stylePastille}>
          {/* L'auteur reste visible (son @ pour un créateur) ; toucher la pastille rouvre toujours la fiche */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={auteur.type === "lieu" ? `Afficher la fiche de ${lieu.nom}` : `Afficher la fiche : publication de ${nomAuteur} sur ${lieu.nom}`}
            onPress={gestes.reduire}
            className="min-h-11 flex-row items-center gap-2 rounded-full bg-black/50 pl-1.5 pr-4 active:opacity-70"
          >
            <View className="h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-jaune">
              <Text className="text-sm">{emojiAuteur}</Text>
            </View>
            <Text numberOfLines={1} className="max-w-[220px] font-texte-gras text-[15px] text-white">{nomAuteur}</Text>
            <Ionicons name="chevron-up" size={18} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      </View>

      <View pointerEvents={reduit ? "none" : "box-none"} aria-hidden={reduit} style={{ paddingBottom: margeBas + ECART_BAS }} className="absolute inset-x-0 bottom-0 pl-5 pr-[88px]">
        <Animated.View style={styleFiche}>
          {/* L'auteur et « Suivre » restent hors du bloc lu d'une traite par VoiceOver, pour que le bouton soit atteignable ;
              toucher l'avatar ou le nom ouvre sa fiche ou sa page (VoiceOver passe par l'avatar de la colonne d'actions) */}
          <View className="gap-1.5">
            <View className="flex-row items-center gap-2.5">
              <Pressable
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                hitSlop={6}
                onPress={() => gestes.ouvrirAuteur(publication)}
                className="shrink flex-row items-center gap-2 active:opacity-70"
              >
                <View className="h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-jaune">
                  <Text className="text-sm">{emojiAuteur}</Text>
                </View>
                <Text numberOfLines={1} className="shrink font-texte-gras text-[15px] text-white" style={ombreTexte}>{nomAuteur}</Text>
              </Pressable>
              <BoutonSuivre suivi={suivi} nom={nomAuteur} onPress={() => gestes.suivre(publication)} />
            </View>
            <View accessible accessibilityLabel={description} className="gap-1.5">
              {auteur.type === "createur" && auteur.partenariat ? (
                <Text className="self-start overflow-hidden rounded-md bg-white/85 px-2 py-0.5 font-texte-semi text-xs text-encre">
                  Collaboration commerciale · {auteur.partenariat}
                </Text>
              ) : null}
              <View className="flex-row flex-wrap gap-2">
                {lieu.sos ? (
                  <Text className="overflow-hidden rounded-full bg-jaune px-3 py-1 font-texte-gras text-[13px] text-encre">
                    🛟 SOS · {lieu.sos.places} place{lieu.sos.places > 1 ? "s" : ""} jusqu'à {formaterHeure(lieu.sos.jusqua)}
                  </Text>
                ) : null}
                {lieu.alerte ? (
                  <Text className="overflow-hidden rounded-full bg-tomate px-3 py-1 font-texte-gras text-[13px] text-white">🔥 {lieu.alerte}</Text>
                ) : null}
              </View>
              {raison ? <Text className="font-texte-semi text-sm text-jaune-clair" style={ombreTexte}>💛 {raison}</Text> : null}
              <Text className="font-titre text-[26px] leading-[30px] text-white" style={ombreTexte}>{lieu.nom}</Text>
              <Text className="font-texte-moyen text-[14px] text-white/90" style={ombreTexte}>
                📍 {lieu.quartier}, {lieu.ville} · {formaterDistance(km)} · {lieu.prix}
              </Text>
            </View>
            <LegendeRepliable texte={lierPonctuation(publication.legende)} />
          </View>
          <View className="mt-3 flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Voir l'adresse de ${lieu.nom}`}
              onPress={() => gestes.voir(publication)}
              className="min-h-11 justify-center rounded-full bg-white/25 px-4 active:opacity-70"
            >
              <Text className="font-texte-semi text-[15px] text-white">Voir l'adresse →</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Réduire la fiche pour voir la vidéo en plein écran"
              onPress={gestes.reduire}
              className="min-h-11 min-w-11 flex-row items-center justify-center gap-1 rounded-full bg-white/25 px-3 active:opacity-70"
            >
              <Ionicons name="chevron-down" size={18} color="#FFFFFF" />
              <Text className="font-texte-semi text-[15px] text-white">Réduire</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>

      <View pointerEvents={reduit ? "none" : "box-none"} aria-hidden={reduit} style={{ bottom: margeBas + ECART_BAS }} className="absolute right-3">
        <Animated.View style={[{ alignItems: "center", gap: 14 }, styleActions]}>
          <AvatarSuivre
            emoji={emojiAuteur}
            nom={nomAuteur}
            createur={auteur.type === "createur"}
            suivi={suivi}
            onOuvrir={() => gestes.ouvrirAuteur(publication)}
            onSuivre={() => gestes.suivre(publication)}
          />
          <ActionPost
            actif={aime}
            icone={<Ionicons name={aime ? "heart" : "heart-outline"} size={28} color={aime ? couleurs.tomate : "#FFFFFF"} />}
            libelle={formaterNombreCourt(publication.jaimes + (aime ? 1 : 0))}
            description={aime ? "Retirer ton J'aime" : `J'aime, ${publication.jaimes} personnes aiment`}
            onPress={() => gestes.jaime(publication)}
            style="transparent"
          />
          <ActionPost
            icone={<Ionicons name="chatbubble-ellipses" size={26} color="#FFFFFF" />}
            libelle={formaterNombreCourt(nombreCommentaires)}
            description={nombreCommentaires === 0 ? "Commentaires : aucun pour l'instant, écris le premier" : `${nombreCommentaires} commentaire${nombreCommentaires > 1 ? "s" : ""}, les lire ou commenter`}
            onPress={() => gestes.commentaires(publication)}
            style="transparent"
          />
          <ActionPost
            actif={garde}
            icone={<Ionicons name={garde ? "bookmark" : "bookmark-outline"} size={26} color={garde ? couleurs.jaune : "#FFFFFF"} />}
            libelle={garde ? "Gardé" : "Garder"}
            description={garde ? `Ne plus garder ${lieu.nom}` : `Garder ${lieu.nom} pour plus tard`}
            onPress={() => gestes.garder(publication)}
            style="transparent"
          />
          <ActionPost
            icone={<Ionicons name="arrow-redo" size={26} color="#FFFFFF" />}
            libelle="Partager"
            description={`Partager ${lieu.nom}`}
            onPress={() => gestes.partager(publication)}
            style="transparent"
          />
          <ActionPost
            icone={<Ionicons name="ellipsis-horizontal" size={26} color="#FFFFFF" />}
            libelle=""
            description="Plus d'options : rescousse, adresse, envoyer à un pote, pas intéressé, signaler"
            onPress={() => gestes.menu(publication)}
            style="transparent"
          />
        </Animated.View>
      </View>

      {lieu.sos ? (
        <Animated.View pointerEvents="none" style={[{ position: "absolute", inset: 0, borderWidth: 5, borderColor: couleurs.jaune }, styleCadre]} />
      ) : null}
      <CoeurEnvol numero={envolCoeur} />
      <BoueeEnvol numero={envolBouee} />
    </View>
  );
});
