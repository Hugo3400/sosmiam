import { Ionicons } from "@expo/vector-icons";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioStatus } from "expo-audio";
import { File } from "expo-file-system";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, View, type PressableProps } from "react-native";

import { formaterDureeVocal } from "~/fonctions/chat/formater-duree-vocal";
import { formaterDureeVocalLue } from "~/fonctions/chat/formater-duree-vocal-lue";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { estEnregistrementEnCours, jouerNoteVocale, oublierNoteVocale, utiliserAudioChat } from "~/hooks/utiliser-audio-chat";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Adresse de la note dans les fichiers de l'app */
  fichier: string | undefined;
  /** Durée enregistrée avec le message, en secondes */
  dureeSecondes: number | undefined;
  /** Qui l'a envoyée et quand : « Note vocale de Léa, 14h32 », « Ta note vocale, 14h32 » */
  libelle: string;
  /** Ta note : sur ta bulle jaune */
  deMoi: boolean;
  /** Appui long sur le bouton : le menu du message (réactions, signaler) */
  onAppuiLong: () => void;
  /** Actions du lecteur d'écran (cœur, options), posées sur le bouton lecture */
  actionsLecteur?: Pick<PressableProps, "accessibilityActions" | "onAccessibilityAction">;
};

type Etat = "arret" | "chargement" | "lecture" | "pause" | "introuvable";

// Sans nouvelles du fichier au bout de ce délai, on le considère parti (une adresse du navigateur oubliée après rechargement)
const ATTENTE_MAX = 8000;

/**
 * Vrai si le fichier est encore là. Sur le web, une note enregistrée vit à une adresse du navigateur (« blob: »),
 * oubliée au rechargement de la page : on demande au navigateur s'il l'a encore, plutôt que de laisser la lecture planter.
 */
async function existeEncore(fichier: string): Promise<boolean> {
  if (Platform.OS === "web") {
    if (!fichier.startsWith("blob:")) return true;
    try {
      await fetch(fichier);
      return true;
    } catch {
      return false;
    }
  }
  try {
    return new File(fichier).exists;
  } catch {
    return false;
  }
}

/**
 * Une note vocale du chat : lecture ou pause, barre d'avancée et durée « 0:12 ». Le lecteur n'est créé qu'au premier
 * « lire » (pas un lecteur par message affiché), le son sort du haut-parleur même en mode silencieux, et tout s'arrête
 * quand la bulle quitte l'écran. Une seule note joue à la fois, et aucune pendant que tu enregistres (utiliserAudioChat).
 */
export function NoteVocale({ fichier, dureeSecondes, libelle, deMoi, onAppuiLong, actionsLecteur }: Props) {
  const { enregistrementEnCours } = utiliserAudioChat();
  const lecteur = useRef<AudioPlayer | null>(null);
  const abonnement = useRef<{ remove: () => void } | null>(null);
  const attente = useRef<ReturnType<typeof setTimeout> | null>(null);
  // La bulle a quitté l'écran pendant une attente : plus de lecteur à créer
  const demontee = useRef(false);
  const [etat, setEtat] = useState<Etat>("arret");
  const [position, setPosition] = useState(0);
  const [dureeLue, setDureeLue] = useState(0);

  // La bulle disparaît (écran quitté, message signalé) : on coupe le son et on libère le lecteur
  useEffect(
    () => () => {
      demontee.current = true;
      if (attente.current) clearTimeout(attente.current);
      abonnement.current?.remove();
      const l = lecteur.current;
      if (!l) return;
      oublierNoteVocale(l);
      try {
        l.pause();
        l.remove();
      } catch {
        // Déjà libéré
      }
    },
    [],
  );

  const duree = dureeSecondes && dureeSecondes > 0 ? dureeSecondes : dureeLue;

  function suivre(statut: AudioStatus & { error?: string }) {
    // Le web signale un fichier illisible par un champ « error » (absent du type d'expo-audio)
    if (statut.error) {
      if (attente.current) clearTimeout(attente.current);
      attente.current = null;
      setEtat("introuvable");
      return;
    }
    if (statut.isLoaded && attente.current) {
      clearTimeout(attente.current);
      attente.current = null;
    }
    if (statut.duration > 0) setDureeLue(statut.duration);
    if (statut.didJustFinish) {
      // Fin de la note : on revient au début, prête à être réécoutée
      setEtat("arret");
      setPosition(0);
      lecteur.current?.seekTo(0).catch(() => {});
      return;
    }
    setPosition(statut.currentTime);
    if (statut.playing) setEtat("lecture");
    else setEtat((avant) => (avant === "lecture" ? "pause" : avant));
  }

  async function lire() {
    if (!fichier || !(await existeEncore(fichier))) return setEtat("introuvable");
    // Pendant un enregistrement, régler le son pour lire couperait le micro (le bouton est d'ailleurs désactivé) ;
    // vérifié à l'instant, car l'enregistreur a pu s'ouvrir pendant l'attente
    if (estEnregistrementEnCours()) return;
    try {
      // Le son sort du haut-parleur, même quand le téléphone est en silencieux
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
    } catch {
      // Le web n'a pas de mode audio : rien à régler
    }
    if (demontee.current || estEnregistrementEnCours()) return;
    let l = lecteur.current;
    if (!l) {
      try {
        l = createAudioPlayer({ uri: fichier }, { updateInterval: 200 });
      } catch {
        return setEtat("introuvable");
      }
      lecteur.current = l;
      abonnement.current = l.addListener("playbackStatusUpdate", suivre);
      setEtat("chargement");
      attente.current = setTimeout(() => {
        attente.current = null;
        if (!lecteur.current?.isLoaded) setEtat("introuvable");
      }, ATTENTE_MAX);
    }
    jouerNoteVocale(l);
    l.play();
  }

  function basculer() {
    vibrerLegerement();
    if (etat === "lecture") {
      lecteur.current?.pause();
      setEtat("pause");
      return;
    }
    lire().catch(() => setEtat("introuvable"));
  }

  const texte = deMoi ? "text-encre" : "text-gris";
  if (etat === "introuvable") {
    return (
      <View accessible accessibilityLabel={`${libelle} : partie se promener, elle ne se lit plus`} {...actionsLecteur} className="min-h-11 flex-row items-center gap-2.5 py-0.5">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-xl">
          🎙️
        </Text>
        <Text className={`shrink font-texte-semi text-sm ${texte}`}>Note vocale partie se promener</Text>
      </View>
    );
  }

  const enCours = etat === "lecture" || etat === "pause";
  const avancee = enCours && duree > 0 ? Math.min(1, position / duree) : 0;
  // Pendant que tu enregistres une note, les autres attendent leur tour
  const action = enregistrementEnCours ? "à écouter après ton enregistrement" : etat === "lecture" ? "mettre en pause" : etat === "pause" ? "reprendre" : "lire";

  return (
    <View className="w-52 flex-row items-center gap-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${libelle}, ${formaterDureeVocalLue(duree)}, ${action}`}
        accessibilityState={{ disabled: enregistrementEnCours }}
        disabled={enregistrementEnCours}
        onPress={basculer}
        onLongPress={() => {
          vibrerLegerement();
          onAppuiLong();
        }}
        delayLongPress={350}
        {...actionsLecteur}
        className={`h-11 w-11 items-center justify-center rounded-full border-2 border-encre active:opacity-70 ${deMoi ? "bg-white" : "bg-jaune"} ${enregistrementEnCours ? "opacity-40" : ""}`}
      >
        {etat === "chargement" ? (
          <ActivityIndicator size="small" color={couleurs.encre} />
        ) : (
          <Ionicons name={etat === "lecture" ? "pause" : "play"} size={20} color={couleurs.encre} style={etat === "lecture" ? undefined : { marginLeft: 2 }} />
        )}
      </Pressable>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="flex-1 gap-1.5">
        <View className="h-1.5 overflow-hidden rounded-full bg-encre/15">
          <View style={{ width: `${avancee * 100}%` }} className="h-full rounded-full bg-encre" />
        </View>
        <View className="flex-row items-center justify-between">
          <Text className={`font-texte-semi text-xs ${texte}`}>{formaterDureeVocal(enCours ? position : duree)}</Text>
          <Ionicons name="mic" size={13} color={deMoi ? couleurs.encre : couleurs.gris} />
        </View>
      </View>
    </View>
  );
}
