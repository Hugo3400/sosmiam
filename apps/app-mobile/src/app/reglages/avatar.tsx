import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Alert, Linking, Platform, Pressable, Text, useWindowDimensions, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { ImageAvatar } from "~/composants/profil/ImageAvatar";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { LigneReglage } from "~/composants/reglages/LigneReglage";
import { avatarsEmoji } from "~/contenus/avatars-emoji";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { AVATAR_PAR_DEFAUT, garderPhotoAvatar, supprimerPhotoAvatar, type Avatar } from "~/stockage/avatar-local";
import couleurs from "~/theme/couleurs";

/** Nom lu par le lecteur d'écran pour un emoji d'avatar (« renard ») ; à défaut, l'emoji lui-même. */
const nommerAvatar = (emoji: string) => avatarsEmoji.find((a) => a.emoji === emoji)?.nom ?? emoji;

// Options du sélecteur : une image carrée, recadrable, assez légère pour un rond de profil
const OPTIONS_PHOTO: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7 };

// Grille d'emoji : ronds de 56 points minimum, aussi larges que possible sur la largeur de l'écran (marges de 20 points)
const ECART = 10;
const TAILLE_MIN = 56;
const TAILLE_MAX = 72;

const surLeWeb = Platform.OS === "web";

function decrireAvatar(avatar: Avatar): string {
  return avatar.type === "photo" ? "ta photo" : `avatar ${nommerAvatar(avatar.emoji)}`;
}

/** Réglages > Avatar : un emoji de la liste, ou une photo (appareil photo ou galerie) qui reste sur le téléphone. */
export default function ReglagesAvatar() {
  const { avatar, changerAvatar } = utiliserProfil();
  const { width } = useWindowDimensions();
  // Une seule ouverture du sélecteur à la fois (deux appuis rapides n'ouvrent pas deux fois l'appareil photo)
  const occupe = useRef(false);
  const [enCours, setEnCours] = useState<"camera" | "galerie" | null>(null);
  const [cameraRefusee, setCameraRefusee] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  // Après « Retirer la photo », sa ligne disparaît : le lecteur d'écran est ramené sur l'avatar actuel
  const refAvatarActuel = useRef<View>(null);
  const ramenerFocus = useRef(false);

  useEffect(() => {
    if (!ramenerFocus.current || avatar.type === "photo") return;
    ramenerFocus.current = false;
    if (refAvatarActuel.current) AccessibilityInfo.sendAccessibilityEvent(refAvatarActuel.current, "focus");
  }, [avatar]);

  const largeurDispo = width - 40;
  const colonnes = Math.min(8, Math.max(4, Math.floor((largeurDispo + ECART) / (TAILLE_MIN + ECART))));
  const tailleRond = Math.min(TAILLE_MAX, Math.floor((largeurDispo - ECART * (colonnes - 1)) / colonnes));

  function signalerErreur(message: string) {
    setErreur(message);
    AccessibilityInfo.announceForAccessibility(message);
  }

  /** Change d'avatar et l'annonce au lecteur d'écran (sauf annonce null) ; renvoie faux si l'enregistrement a échoué (message affiché). */
  async function appliquer(nouveau: Avatar, annonce: string | null): Promise<boolean> {
    setErreur(null);
    try {
      await changerAvatar(nouveau);
      if (annonce) AccessibilityInfo.announceForAccessibility(annonce);
      return true;
    } catch {
      signalerErreur("Oups, ton avatar n'a pas pu être enregistré. Réessaie dans un instant.");
      return false;
    }
  }

  function choisirEmoji(emoji: string) {
    if (avatar.type === "emoji" && avatar.emoji === emoji) return;
    void appliquer({ type: "emoji", emoji }, `C'est noté : ${decrireAvatar({ type: "emoji", emoji })}.`);
  }

  async function garderResultat(resultat: ImagePicker.ImagePickerResult) {
    if (resultat.canceled || resultat.assets.length === 0) return;
    let uri: string;
    try {
      uri = await garderPhotoAvatar(resultat.assets[0].uri);
    } catch {
      return signalerErreur("Ta photo n'a pas pu être gardée sur le téléphone. Réessaie, ou choisis-en une autre.");
    }
    const enregistree = await appliquer({ type: "photo", uri }, "C'est noté : ta photo est ton nouvel avatar.");
    // Pas enregistrée comme avatar : on ne laisse pas traîner la copie
    if (!enregistree) supprimerPhotoAvatar(uri);
  }

  async function ouvrirSelecteur(source: "camera" | "galerie") {
    if (occupe.current) return;
    occupe.current = true;
    setEnCours(source);
    setErreur(null);
    try {
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setCameraRefusee(true);
          AccessibilityInfo.announceForAccessibility("Pas d'accès à l'appareil photo. Tu peux l'autoriser dans les réglages de ton téléphone.");
          return;
        }
        setCameraRefusee(false);
        await garderResultat(await ImagePicker.launchCameraAsync(OPTIONS_PHOTO));
      } else {
        // Le sélecteur de photos du système ne demande pas d'autorisation : tu ne partages que la photo choisie
        await garderResultat(await ImagePicker.launchImageLibraryAsync(OPTIONS_PHOTO));
      }
    } catch {
      signalerErreur(
        source === "camera"
          ? "Impossible d'ouvrir l'appareil photo. Réessaie, ou choisis une photo dans ta galerie."
          : "Impossible de récupérer cette photo. Réessaie, ou prends-en une nouvelle.",
      );
    } finally {
      occupe.current = false;
      setEnCours(null);
    }
  }

  function retirerPhoto() {
    // Sur le web (aperçu de développement), Alert n'existe pas : on retire directement et on l'annonce
    if (surLeWeb) return void appliquer(AVATAR_PAR_DEFAUT, `Photo retirée : retour à l'${decrireAvatar(AVATAR_PAR_DEFAUT)}.`);
    // Sur le téléphone, le lecteur d'écran se pose sur l'avatar actuel, qui dit déjà lequel c'est
    const retirer = () => {
      ramenerFocus.current = true;
      void appliquer(AVATAR_PAR_DEFAUT, null).then((ok) => {
        if (!ok) ramenerFocus.current = false;
      });
    };
    Alert.alert(
      "Retirer ta photo ?",
      `Elle sera effacée de SOS Miam et tu repartiras avec l'${decrireAvatar(AVATAR_PAR_DEFAUT)}, à changer quand tu veux.`,
      [
        { text: "Garder ma photo", style: "cancel" },
        { text: "Retirer", style: "destructive", onPress: retirer },
      ],
    );
  }

  function ouvrirReglagesTelephone() {
    Linking.openSettings().catch(() => signalerErreur("Les réglages du téléphone n'ont pas voulu s'ouvrir. Tu les trouveras dans l'appli Réglages."));
  }

  const chargement = (source: "camera" | "galerie") => (enCours === source ? <ActivityIndicator color={couleurs.encre} /> : undefined);

  return (
    <EcranReglage titre="Ton avatar" sousTitre="Un emoji qui te ressemble, ou ta vraie bouille.">
      <View ref={refAvatarActuel} accessible accessibilityLabel={`Ton avatar actuel : ${decrireAvatar(avatar)}`} className="items-center">
        <ImageAvatar avatar={avatar} taille={140} />
      </View>

      <Text accessibilityRole="header" className="mt-8 font-titre-gras text-xl text-encre">
        Un emoji
      </Text>
      <View accessibilityRole="radiogroup" accessibilityLabel="Choisis un emoji" className="mt-3 flex-row flex-wrap" style={{ gap: ECART }}>
        {avatarsEmoji.map(({ emoji, nom }, i) => {
          const choisi = avatar.type === "emoji" && avatar.emoji === emoji;
          return (
            <Pressable
              key={emoji}
              // Même règle que Pastille et LigneChoixZone : sur iPhone, la radio et « checked » sont lus en anglais
              // (« radio button ») : bouton « sélectionné », avec sa place dans la grille ; radio cochée ou non ailleurs
              accessibilityRole={Platform.OS === "ios" ? "button" : "radio"}
              accessibilityState={Platform.OS === "ios" ? { selected: choisi } : { checked: choisi }}
              accessibilityLabel={Platform.OS === "ios" ? `Avatar ${nom}, ${i + 1} sur ${avatarsEmoji.length}` : `Avatar ${nom}`}
              onPress={() => {
                vibrerLegerement();
                choisirEmoji(emoji);
              }}
              style={{ width: tailleRond, height: tailleRond, borderRadius: tailleRond / 2 }}
              className={`items-center justify-center border-2 active:opacity-80 ${choisi ? "border-encre bg-encre" : "border-ligne bg-white"}`}
            >
              <Text allowFontScaling={false} style={{ fontSize: tailleRond * 0.5, lineHeight: tailleRond * 0.64 }}>
                {emoji}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text accessibilityRole="header" className="mt-8 font-titre-gras text-xl text-encre">
        Ou une photo
      </Text>
      <View className="mt-1">
        {/* Sur le web (aperçu de développement), il n'y a pas toujours d'appareil photo */}
        {surLeWeb ? null : (
          <LigneReglage
            emoji="📷"
            titre="Prendre une photo"
            detail="Ton plus beau sourire (ou ta tête de faim)"
            onPress={() => void ouvrirSelecteur("camera")}
            droite={chargement("camera")}
          />
        )}
        <LigneReglage
          emoji="🖼️"
          titre="Choisir dans ta galerie"
          detail="Une photo que tu as déjà"
          onPress={() => void ouvrirSelecteur("galerie")}
          droite={chargement("galerie")}
        />
        {avatar.type === "photo" ? (
          <LigneReglage emoji="🗑️" titre="Retirer la photo" detail={`Retour à l'${decrireAvatar(AVATAR_PAR_DEFAUT)}`} danger onPress={retirerPhoto} />
        ) : null}
      </View>

      {cameraRefusee ? (
        <View className="mt-4 gap-3 rounded-carte border-2 border-encre bg-white p-4">
          <Text accessibilityRole="header" className="font-texte-gras text-base text-encre">
            Pas d'accès à l'appareil photo
          </Text>
          <Text className="font-texte text-sm leading-5 text-gris">
            {lierPonctuation(
              "Pour prendre ta photo de profil, SOS Miam a besoin de l'appareil photo, et seulement pour ça. Tu as dit non, et c'est ton droit ! Si tu changes d'avis, ça se passe dans les réglages de ton téléphone. Sinon, une photo de ta galerie fera très bien l'affaire.",
            )}
          </Text>
          <Bouton libelle="Ouvrir les réglages du téléphone" variante="blanc" petit onPress={ouvrirReglagesTelephone} />
        </View>
      ) : null}

      {erreur ? (
        <Text accessibilityLiveRegion="polite" className="mt-4 font-texte-semi text-sm leading-5 text-rouge-texte">
          {lierPonctuation(erreur)}
        </Text>
      ) : null}

      <Text accessibilityLabel="Ta photo reste sur ton téléphone." className="mt-6 font-texte text-sm leading-5 text-gris">
        🔒 Ta photo reste sur ton téléphone.
      </Text>
    </EcranReglage>
  );
}
