import Ionicons from "@expo/vector-icons/Ionicons";
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState, type RecordingOptions } from "expo-audio";
import { File } from "expo-file-system";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Platform, Pressable, Text, View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

import { DUREE_MAX_VOCAL_SECONDES } from "@sos-miam/commun/regles/chat";
import { BARRES_ONDE_EN_DIRECT, OndeEnDirect } from "~/composants/chat/OndeEnDirect";
import { TEXTES_MEDIAS_CHAT as T } from "~/contenus/textes-medias-chat";
import { calculerOndeVocal } from "~/fonctions/chat/calculer-onde-vocal";
import { convertirNiveauMicro } from "~/fonctions/chat/convertir-niveau-micro";
import { formaterChronoEnregistrement } from "~/fonctions/chat/formater-chrono-enregistrement";
import { formaterDureeVocalLue } from "~/fonctions/chat/formater-duree-vocal-lue";
import { suivreSilenceMicro } from "~/fonctions/chat/suivre-silence-micro";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { signalerEnregistrement } from "~/hooks/utiliser-audio-chat";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

/** Pourquoi l'enregistrement s'arrête sans envoi (à montrer sous le champ), et s'il faut proposer d'ouvrir les réglages */
export type ProblemeEnregistrement = { texte: string; reglages?: boolean };

type Props = {
  conversationId: string;
  /** La note vocale est partie */
  onEnvoye: () => void;
  /** Retour au champ sans envoi : annulée (rien), ou un souci à expliquer */
  onAbandon: (probleme: ProblemeEnregistrement | null) => void;
};

type Phase = "preparation" | "enregistrement" | "envoi";

type Mesures = { cle: number; barres: number[]; toutes: number[]; dernierSonMs: number; silencieux: boolean; mesure: boolean };

const MESURES_VIDES: Mesures = { cle: -1, barres: [], toutes: [], dernierSonMs: 0, silencieux: false, mesure: false };

// Une voix, pas un concert : mono et 64 kbit/s suffisent (une minute pèse environ 500 Ko)
const OPTIONS_VOCAL: RecordingOptions = { ...RecordingPresets.HIGH_QUALITY, numberOfChannels: 1, bitRate: 64_000, isMeteringEnabled: true };
const DUREE_MIN_MS = 1000;
const ALERTE_SECONDES = 10;
const MAX = formaterChronoEnregistrement(DUREE_MAX_VOCAL_SECONDES);

const MICRO_REFUSE: ProblemeEnregistrement = {
  texte:
    Platform.OS === "web"
      ? "Le micro est fermé pour SOS Miam dans ce navigateur. Pour envoyer des notes vocales, autorise-le dans ses réglages (le petit cadenas près de l'adresse) 🎙️"
      : "Le micro est fermé pour SOS Miam. Pour envoyer des notes vocales, ouvre-le dans les réglages de ton téléphone 🎙️",
  reglages: true,
};
const SOUCI_MICRO: ProblemeEnregistrement = { texte: "Le micro fait sa timide et n'a pas démarré. Réessaie dans un instant !" };
const TROP_COURT: ProblemeEnregistrement = { texte: "Note un peu trop express : parle au moins une seconde, tes potes veulent t'entendre 😄" };
const PAS_PARTIE: ProblemeEnregistrement = { texte: "Ta note vocale n'a pas pu partir. Réessaie dans un instant !" };

/** Remet le son comme avant : sans ça, l'iPhone continue de jouer les sons dans l'écouteur, tout bas. */
function remettreModeAudio(): Promise<void> {
  return setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
}

/** Le fichier de l'enregistreur ne sert plus (la note est copiée dans le chat, ou jetée) ; sur le web, c'est une adresse du navigateur. */
function jeterFichierTemporaire(uri: string | null) {
  if (!uri || Platform.OS === "web") return;
  try {
    const fichier = new File(uri);
    if (fichier.exists) fichier.delete();
  } catch {
    // Déjà parti : le cache du téléphone fera le ménage
  }
}

/**
 * Une note vocale qui s'enregistre dès l'ouverture (après l'autorisation du micro) : point rouge, chrono jusqu'à une minute,
 * la voix en barres qui bougent et le micro qui respire avec elle (un mot si on n'entend rien depuis 3 s), « Annuler » ou
 * « Envoyer » avec la forme de la voix. À la minute, elle part toute seule ; si l'écran se ferme en route, rien n'est envoyé.
 * Tant qu'il est ouvert, aucune note du chat ne joue (celle qui jouait se met en pause) : voir utiliserAudioChat.
 */
export function EnregistreurVocal({ conversationId, onEnvoye, onAbandon }: Props) {
  const couleurs = utiliserCouleurs();
  const conversations = utiliserConversations();
  const animationsReduites = useReducedMotion();
  const enregistreur = useAudioRecorder(OPTIONS_VOCAL);
  const etat = useAudioRecorderState(enregistreur, 150);
  const [phase, setPhase] = useState<Phase>("preparation");
  const [mesures, setMesures] = useState<Mesures>(MESURES_VIDES);
  if (phase === "enregistrement" && etat.durationMillis !== mesures.cle) {
    const niveau = convertirNiveauMicro(etat.metering);
    const suivi = suivreSilenceMicro(mesures.dernierSonMs, niveau, etat.durationMillis);
    setMesures({
      cle: etat.durationMillis,
      barres: niveau === null ? mesures.barres : [...mesures.barres.slice(1 - BARRES_ONDE_EN_DIRECT), niveau],
      toutes: niveau === null ? mesures.toutes : [...mesures.toutes, niveau],
      mesure: mesures.mesure || niveau !== null,
      ...suivi,
    });
  }
  const mesuresLues = useRef(mesures);
  mesuresLues.current = mesures;
  // Durée gardée à l'écran pendant l'envoi (l'arrêt remet le compteur de l'enregistreur à zéro)
  const [dureeFigee, setDureeFigee] = useState<number | null>(null);
  const chrono = useRef<View>(null);
  // Le micro tourne (record() appelé) ; arrêt déjà demandé (envoi, annulation, démontage) : un seul compte
  const lance = useRef(false);
  const termine = useRef(false);
  const monte = useRef(true);
  // Le fichier que remplit l'enregistreur, à jeter si l'écran se ferme en plein enregistrement
  const fichierEnCours = useRef<string | null>(null);
  const alerteFaite = useRef(false);
  // Les derniers rappels, pour les appels qui arrivent après une attente (autorisation, arrêt, copie du fichier)
  const rappels = useRef({ conversations, onEnvoye, onAbandon });
  rappels.current = { conversations, onEnvoye, onAbandon };

  useEffect(() => {
    let quitte = false;
    lance.current = false;
    termine.current = false;
    monte.current = true;
    // Avant tout réglage du son : la note qui jouait se tait (le micro l'entendrait), et plus aucune ne se lance
    signalerEnregistrement(true);
    (async () => {
      try {
        const permission = await requestRecordingPermissionsAsync();
        if (quitte) return;
        if (!permission.granted) {
          termine.current = true;
          rappels.current.onAbandon(MICRO_REFUSE);
          return;
        }
        // Le petit « toc » du départ vient avant le micro : l'iPhone coupe les vibrations pendant qu'il enregistre
        vibrerLegerement();
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await enregistreur.prepareToRecordAsync();
        // Écran quitté ou « Annuler » touché pendant la préparation : le micro ne s'allume pas
        if (quitte || termine.current) return void remettreModeAudio();
        enregistreur.record();
        lance.current = true;
        fichierEnCours.current = enregistreur.uri;
        setPhase("enregistrement");
        AccessibilityInfo.announceForAccessibility("Enregistrement en cours");
        setTimeout(() => deplacerFocusLecteurEcran(chrono.current), 150);
      } catch {
        await remettreModeAudio();
        if (quitte || termine.current) return;
        termine.current = true;
        rappels.current.onAbandon(SOUCI_MICRO);
      }
    })();
    return () => {
      quitte = true;
      monte.current = false;
      // Démontage en plein enregistrement : on coupe sans rien envoyer et on jette le fichier (l'enregistreur libéré s'arrête aussi de lui-même)
      if (lance.current && !termine.current) {
        termine.current = true;
        const fichier = fichierEnCours.current;
        const jeter = () => jeterFichierTemporaire(fichier);
        try {
          enregistreur.stop().then(jeter, jeter);
        } catch {
          // Déjà libéré, donc déjà arrêté
          jeter();
        }
      }
      signalerEnregistrement(false);
      void remettreModeAudio();
    };
  }, [enregistreur]);

  const millisecondes = dureeFigee ?? Math.min(etat.durationMillis, DUREE_MAX_VOCAL_SECONDES * 1000);
  const secondes = Math.floor(millisecondes / 1000);
  const restantes = DUREE_MAX_VOCAL_SECONDES - secondes;

  /** Arrête l'enregistrement et renvoie le fichier et sa durée (lue avant l'arrêt, qui remet le compteur à zéro). */
  async function arreter(): Promise<{ uri: string | null; duree: number }> {
    termine.current = true;
    let duree = 0;
    try {
      if (lance.current) {
        duree = Math.min(enregistreur.getStatus().durationMillis, DUREE_MAX_VOCAL_SECONDES * 1000);
        setDureeFigee(duree);
        await enregistreur.stop();
      }
    } catch {
      // Déjà arrêté
    }
    await remettreModeAudio();
    return { uri: lance.current ? enregistreur.uri : null, duree };
  }

  async function envoyer() {
    if (termine.current || phase !== "enregistrement") return;
    setPhase("envoi");
    const { uri, duree } = await arreter();
    if (!uri || duree < DUREE_MIN_MS) {
      jeterFichierTemporaire(uri);
      if (monte.current) rappels.current.onAbandon(TROP_COURT);
      return;
    }
    // Tu as demandé l'envoi : la note part, même si tu quittes l'écran entre-temps
    const { envoyerVocal } = rappels.current.conversations;
    const onde = calculerOndeVocal(mesuresLues.current.toutes) ?? undefined;
    const resultat = await envoyerVocal(conversationId, uri, duree / 1000, onde);
    jeterFichierTemporaire(uri);
    if (!monte.current) return;
    if (resultat === "ok") rappels.current.onEnvoye();
    else rappels.current.onAbandon(PAS_PARTIE);
  }

  async function annuler() {
    if (termine.current) return;
    const { uri } = await arreter();
    vibrerLegerement();
    jeterFichierTemporaire(uri);
    if (monte.current) rappels.current.onAbandon(null);
  }

  // À la minute pile, la note part toute seule ; dix secondes avant, le lecteur d'écran prévient
  const envoyerAuto = useRef(envoyer);
  envoyerAuto.current = envoyer;
  useEffect(() => {
    if (phase !== "enregistrement") return;
    if (etat.durationMillis >= DUREE_MAX_VOCAL_SECONDES * 1000) void envoyerAuto.current();
    else if (restantes <= ALERTE_SECONDES && !alerteFaite.current) {
      alerteFaite.current = true;
      AccessibilityInfo.announceForAccessibility(`Plus que ${ALERTE_SECONDES} secondes`);
    }
  }, [etat.durationMillis, phase, restantes]);

  // Le point rouge respire pendant l'enregistrement (fixe si les animations sont réduites)
  const opacite = useSharedValue(1);
  useEffect(() => {
    if (phase !== "enregistrement" || animationsReduites) {
      cancelAnimation(opacite);
      opacite.value = 1;
      return;
    }
    opacite.value = withRepeat(withTiming(0.25, { duration: 700, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(opacite);
  }, [phase, animationsReduites, opacite]);
  const stylePoint = useAnimatedStyle(() => ({ opacity: opacite.value }));

  const etatTexte = phase === "preparation" ? "Le micro s'échauffe…" : phase === "envoi" ? "Ça part…" : restantes <= ALERTE_SECONDES ? "On conclut !" : "Je t'écoute…";
  const libelleChrono =
    phase === "preparation"
      ? "Préparation du micro"
      : `Enregistrement en cours : ${secondes} seconde${secondes > 1 ? "s" : ""} sur ${formaterDureeVocalLue(DUREE_MAX_VOCAL_SECONDES)}`;

  return (
    <View className="flex-row items-center gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Annuler la note vocale"
        accessibilityState={{ disabled: phase === "envoi" }}
        disabled={phase === "envoi"}
        onPress={() => void annuler()}
        className={`h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80 ${phase === "envoi" ? "opacity-40" : ""}`}
      >
        <Ionicons name="trash-outline" size={20} color={couleurs["rouge-texte"]} />
      </Pressable>

      <View ref={chrono} accessible accessibilityLabel={libelleChrono} className="min-h-11 flex-1 flex-row items-center gap-2.5 rounded-3xl border-2 border-encre bg-carte px-4 py-2">
        <View className="h-3 w-3">
          <Animated.View style={[{ flex: 1, borderRadius: 6, backgroundColor: phase === "preparation" ? couleurs.gris : couleurs["rouge-texte"] }, stylePoint]} />
        </View>
        <Text style={{ fontVariant: ["tabular-nums"] }} className="font-texte-semi text-base text-encre">
          {formaterChronoEnregistrement(secondes)} / {MAX}
        </Text>
        <Text numberOfLines={1} className={`flex-1 font-texte text-sm ${restantes <= ALERTE_SECONDES && phase === "enregistrement" ? "text-rouge-texte" : "text-gris"}`}>
          {etatTexte}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={phase === "envoi" ? "Envoi de la note vocale" : "Envoyer la note vocale"}
        accessibilityState={{ disabled: phase !== "enregistrement" }}
        disabled={phase !== "enregistrement"}
        onPress={() => void envoyer()}
        className={`h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-jaune active:opacity-80 ${phase === "preparation" ? "opacity-40" : ""}`}
      >
        {phase === "envoi" ? <ActivityIndicator color={couleurs.nuit} /> : <Ionicons name="arrow-up" size={22} color={couleurs.nuit} />}
      </Pressable>
    </View>
  );
}
