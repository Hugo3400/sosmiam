import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Alert, Linking, Platform, Pressable, Text, useWindowDimensions, View } from "react-native";

import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { IdMiamiAuChoix } from "@sos-miam/commun/regles/avatars-miamis";
import { Bouton } from "~/composants/interface/Bouton";
import { EncartPhotoLocale } from "~/composants/profil/EncartPhotoLocale";
import { EtatEnvoiPhoto } from "~/composants/profil/EtatEnvoiPhoto";
import { GrilleMiamis } from "~/composants/profil/GrilleMiamis";
import { ImageAvatar } from "~/composants/profil/ImageAvatar";
import { MentionPhotoProfil } from "~/composants/profil/MentionPhotoProfil";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { LigneReglage } from "~/composants/reglages/LigneReglage";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { AVATARS_EMOJI_PAR_LANGUE } from "~/contenus/avatars-emoji";
import { TEXTES_REGLAGES_AVATAR_PAR_LANGUE } from "~/contenus/textes-reglages-avatar";
import { decrireEtatPhoto } from "~/fonctions/compte/decrire-etat-photo";
import { nommerAvatar } from "~/fonctions/compte/nommer-avatar";
import { preparerPhotoProfil } from "~/fonctions/compte/preparer-photo-profil";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { AVATAR_PAR_DEFAUT, garderPhotoAvatar, supprimerPhotoAvatar, type Avatar } from "~/stockage/avatar-local";
import { enregistrerEncartPhotoLocaleVu, lireEncartPhotoLocaleVu } from "~/stockage/encart-photo-locale";

// Options du sélecteur : une image carrée, recadrable, assez légère pour un rond de profil
const OPTIONS_PHOTO: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7 };

// Grilles des Miamis et des emoji : ronds de 56 points minimum, aussi larges que possible sur la largeur de l'écran (marges de 20 points)
const ECART = 10;
const TAILLE_MIN = 56;
const TAILLE_MAX = 72;
// Les Miamis, plus détaillés, montent un peu plus haut : 4 par ligne (8 sur une tablette), les 16 tombent juste
const TAILLE_MAX_MIAMI = 84;

const surLeWeb = Platform.OS === "web";

function decrireAvatar(avatar: Avatar, langue: Langue): string {
  const T = choisirTextes(TEXTES_REGLAGES_AVATAR_PAR_LANGUE, langue);
  return avatar.type === "photo" ? T.taPhoto : T.avatarNomme(nommerAvatar(avatar, langue));
}

/** Réglages > Avatar : un Miami (en tête), un emoji de la liste, ou une photo (appareil photo ou galerie). */
export default function ReglagesAvatar() {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_REGLAGES_AVATAR_PAR_LANGUE);
  const avatarsEmoji = utiliserTextes(AVATARS_EMOJI_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const { avatar, changerAvatar, retirerPhoto: retirerPhotoProfil, etatPhoto, profil } = utiliserProfil();
  const partage = profil !== null ? "compte" : "visite";
  const { width } = useWindowDimensions();
  // Une seule ouverture du sélecteur à la fois (deux appuis rapides n'ouvrent pas deux fois l'appareil photo)
  const occupe = useRef(false);
  const [enCours, setEnCours] = useState<"camera" | "galerie" | null>(null);
  const [cameraRefusee, setCameraRefusee] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [encartVu, setEncartVu] = useState(true);
  const [preparation, setPreparation] = useState(false);
  const [enLigneIci, setEnLigneIci] = useState(false);
  const partageAvant = useRef(avatar.type === "photo" ? avatar.partage : undefined);
  // Après « Retirer la photo », sa ligne disparaît : le lecteur d'écran est ramené sur l'avatar actuel
  const refAvatarActuel = useRef<View>(null);
  const ramenerFocus = useRef(false);
  const photoLocale = avatar.type === "photo" && avatar.partage === undefined;
  const description = decrireEtatPhoto(etatPhoto, avatar.type === "photo" && avatar.partage === "a-envoyer", langue);

  useEffect(() => {
    let actif = true;
    void lireEncartPhotoLocaleVu().then((vu) => {
      if (actif) setEncartVu(vu);
    });
    return () => {
      actif = false;
    };
  }, []);

  useEffect(() => {
    const partageActuel = avatar.type === "photo" ? avatar.partage : undefined;
    const vientDePartir = partageAvant.current === "a-envoyer" && partageActuel !== undefined && partageActuel !== "a-envoyer";
    partageAvant.current = partageActuel;
    setEnLigneIci(vientDePartir);
    if (vientDePartir) AccessibilityInfo.announceForAccessibility(T.photoEnLigneLue);
  }, [avatar, T]);

  useEffect(() => {
    if (!ramenerFocus.current || avatar.type === "photo") return;
    ramenerFocus.current = false;
    if (refAvatarActuel.current) AccessibilityInfo.sendAccessibilityEvent(refAvatarActuel.current, "focus");
  }, [avatar]);

  const largeurDispo = width - 40;
  const colonnes = Math.min(8, Math.max(4, Math.floor((largeurDispo + ECART) / (TAILLE_MIN + ECART))));
  const tailleRond = Math.min(TAILLE_MAX, Math.floor((largeurDispo - ECART * (colonnes - 1)) / colonnes));
  const colonnesMiamis = colonnes >= 8 ? 8 : 4;
  const tailleMiami = Math.min(TAILLE_MAX_MIAMI, Math.floor((largeurDispo - ECART * (colonnesMiamis - 1)) / colonnesMiamis));

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
      signalerErreur(T.avatarRate);
      return false;
    }
  }

  function choisirMiami(id: IdMiamiAuChoix) {
    if (avatar.type === "miami" && avatar.id === id) return;
    void appliquer({ type: "miami", id }, T.choixNote(decrireAvatar({ type: "miami", id }, langue)));
  }

  function choisirEmoji(emoji: string) {
    if (avatar.type === "emoji" && avatar.emoji === emoji) return;
    void appliquer({ type: "emoji", emoji }, T.choixNote(decrireAvatar({ type: "emoji", emoji }, langue)));
  }

  async function garderPhoto(uriChoisie: string, annonce: string): Promise<boolean> {
    let uri: string;
    try {
      uri = await garderPhotoAvatar(await preparerPhotoProfil(uriChoisie));
    } catch {
      signalerErreur(T.photoPasPreparee);
      return false;
    }
    const nouveau: Avatar = partage === "compte" ? { type: "photo", uri, partage: "a-envoyer" } : { type: "photo", uri };
    const enregistree = await appliquer(nouveau, annonce);
    // Pas enregistrée comme avatar : on ne laisse pas traîner la copie
    if (!enregistree) supprimerPhotoAvatar(uri);
    return enregistree;
  }

  async function garderResultat(resultat: ImagePicker.ImagePickerResult) {
    if (resultat.canceled || resultat.assets.length === 0) return;
    await garderPhoto(resultat.assets[0].uri, partage === "compte" ? T.photoChoisieCompte : T.photoChoisie);
  }

  async function montrerPhotoLocale() {
    if (avatar.type !== "photo" || !avatar.uri || preparation) return;
    setPreparation(true);
    try {
      if (!(await garderPhoto(avatar.uri, T.photoPart))) return;
      void enregistrerEncartPhotoLocaleVu();
      setEncartVu(true);
    } finally {
      setPreparation(false);
    }
  }

  function laisserPhotoLocale() {
    void enregistrerEncartPhotoLocaleVu();
    setEncartVu(true);
    AccessibilityInfo.announceForAccessibility(T.photoResteIci);
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
          AccessibilityInfo.announceForAccessibility(T.cameraRefuseeLue);
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
          ? T.cameraRatee
          : T.galerieRatee,
      );
    } finally {
      occupe.current = false;
      setEnCours(null);
    }
  }

  async function enleverPhoto(annonce: string | null): Promise<boolean> {
    setErreur(null);
    try {
      await retirerPhotoProfil();
      if (annonce) AccessibilityInfo.announceForAccessibility(annonce);
      return true;
    } catch {
      signalerErreur(T.retraitRate);
      return false;
    }
  }

  function retirerPhoto() {
    // Sur le web (aperçu de développement), Alert n'existe pas : on retire directement et on l'annonce
    if (surLeWeb) return void enleverPhoto(T.photoRetireeLue);
    // Sur le téléphone, le lecteur d'écran se pose sur l'avatar actuel, qui dit déjà lequel c'est
    const retirer = () => {
      ramenerFocus.current = true;
      void enleverPhoto(null).then((ok) => {
        if (!ok) ramenerFocus.current = false;
      });
    };
    Alert.alert(
      T.retirerTitre,
      partage === "compte"
        ? T.retirerTexteCompte(decrireAvatar(AVATAR_PAR_DEFAUT, langue))
        : T.retirerTexteVisite(decrireAvatar(AVATAR_PAR_DEFAUT, langue)),
      [
        { text: T.garderPhoto, style: "cancel" },
        { text: T.retirer, style: "destructive", onPress: retirer },
      ],
    );
  }

  function ouvrirReglagesTelephone() {
    Linking.openSettings().catch(() => signalerErreur(T.reglagesRates));
  }

  const chargement = (source: "camera" | "galerie") => (enCours === source ? <ActivityIndicator color={couleurs.encre} /> : undefined);

  return (
    <EcranReglage titre={T.titre} sousTitre={T.sousTitre}>
      <View ref={refAvatarActuel} accessible accessibilityLabel={T.avatarActuelLu(decrireAvatar(avatar, langue))} className="items-center">
        <ImageAvatar avatar={avatar} taille={140} />
      </View>

      <Text accessibilityRole="header" className="mt-8 font-titre-gras text-xl text-encre">
        {T.unMiami}
      </Text>
      <Text className="mt-1 font-texte text-sm leading-5 text-gris">{T.unMiamiDetail}</Text>
      <GrilleMiamis choisi={avatar.type === "miami" ? avatar.id : null} taille={tailleMiami} ecart={ECART} onChoisir={choisirMiami} />

      <Text accessibilityRole="header" className="mt-8 font-titre-gras text-xl text-encre">
        {T.unEmoji}
      </Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={T.choisirEmojiLu} className="mt-3 flex-row flex-wrap" style={{ gap: ECART }}>
        {avatarsEmoji.map(({ emoji, nom }, i) => {
          const choisi = avatar.type === "emoji" && avatar.emoji === emoji;
          return (
            <Pressable
              key={emoji}
              // Même règle que Pastille et LigneChoixZone : sur iPhone, la radio et « checked » sont lus en anglais
              // (« radio button ») : bouton « sélectionné », avec sa place dans la grille ; radio cochée ou non ailleurs
              accessibilityRole={Platform.OS === "ios" ? "button" : "radio"}
              accessibilityState={Platform.OS === "ios" ? { selected: choisi } : { checked: choisi }}
              accessibilityLabel={Platform.OS === "ios" ? T.emojiLuIos(nom, i + 1, avatarsEmoji.length) : T.emojiLu(nom)}
              onPress={() => {
                vibrerLegerement();
                choisirEmoji(emoji);
              }}
              style={{ width: tailleRond, height: tailleRond, borderRadius: tailleRond / 2 }}
              className={`items-center justify-center border-2 active:opacity-80 ${choisi ? "border-encre bg-choix" : "border-ligne bg-carte"}`}
            >
              <Text allowFontScaling={false} style={{ fontSize: tailleRond * 0.5, lineHeight: tailleRond * 0.64 }}>
                {emoji}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text accessibilityRole="header" className="mt-8 font-titre-gras text-xl text-encre">
        {T.unePhoto}
      </Text>
      <View className="mt-1">
        {/* Sur le web (aperçu de développement), il n'y a pas toujours d'appareil photo */}
        {surLeWeb ? null : (
          <LigneReglage
            emoji="📷"
            titre={T.prendrePhoto}
            detail={T.prendrePhotoDetail}
            onPress={() => void ouvrirSelecteur("camera")}
            droite={chargement("camera")}
          />
        )}
        <LigneReglage
          emoji="🖼️"
          titre={T.choisirGalerie}
          detail={T.choisirGalerieDetail}
          onPress={() => void ouvrirSelecteur("galerie")}
          droite={chargement("galerie")}
        />
        {avatar.type === "photo" ? (
          <LigneReglage
            emoji="🗑️"
            titre={T.retirerPhoto}
            detail={partage === "compte" ? T.retirerPhotoDetailCompte : T.retirerPhotoDetailVisite(decrireAvatar(AVATAR_PAR_DEFAUT, langue))}
            danger
            onPress={retirerPhoto}
          />
        ) : null}
      </View>

      {photoLocale && partage === "compte" && !encartVu ? <EncartPhotoLocale enCours={preparation} onMontrer={() => void montrerPhotoLocale()} onLaisser={laisserPhotoLocale} /> : null}

      {description && partage === "compte" ? <EtatEnvoiPhoto description={description} /> : null}
      {enLigneIci && !description ? (
        <Text accessibilityLiveRegion="polite" className="mt-4 font-texte-semi text-sm leading-5 text-encre">
          {lierPonctuation(T.photoEnLigne)}
        </Text>
      ) : null}

      {cameraRefusee ? (
        <View className="mt-4 gap-3 rounded-carte border-2 border-encre bg-carte p-4">
          <Text accessibilityRole="header" className="font-texte-gras text-base text-encre">
            {T.pasDAcces}
          </Text>
          <Text className="font-texte text-sm leading-5 text-gris">
            {lierPonctuation(T.pasDAccesTexte)}
          </Text>
          <Bouton libelle={T.ouvrirReglages} variante="blanc" petit onPress={ouvrirReglagesTelephone} />
        </View>
      ) : null}

      {erreur ? (
        <Text accessibilityLiveRegion="polite" className="mt-4 font-texte-semi text-sm leading-5 text-rouge-texte">
          {lierPonctuation(erreur)}
        </Text>
      ) : null}

      <MentionPhotoProfil partage={partage} photoLocale={photoLocale && encartVu} />
    </EcranReglage>
  );
}
