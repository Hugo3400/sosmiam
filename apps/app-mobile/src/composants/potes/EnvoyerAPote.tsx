import { useRouter } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { LONGUEUR_MAX_MOT_RECOMMANDATION } from "@sos-miam/commun/regles/potes";
import { VignetteLieu } from "~/composants/explorer/VignetteLieu";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { RondPote } from "~/composants/potes/RondPote";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { publicationsExemples } from "~/contenus/publications-exemples";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute, type ResultatTexte } from "~/hooks/utiliser-communaute";
import { utiliserProfil } from "~/hooks/utiliser-profil";

type Props = {
  visible: boolean;
  lieuId: number;
  onFermer: () => void;
};

const ERREURS_MOT: Record<Exclude<ResultatTexte, "ok">, string> = {
  vide: "Ton mot est vide : écris quelque chose, ou laisse-le de côté.",
  "trop-long": `${LONGUEUR_MAX_MOT_RECOMMANDATION} caractères maximum : la version courte, c'est la meilleure !`,
  "mot-interdit": "Un mot de ton message ne passe pas chez nous. Tu le reformules gentiment ?",
};

/** « Léa », « Léa et Karim », « Léa, Karim et Tom » */
const joindrePrenoms = (prenoms: string[]) => (prenoms.length <= 1 ? (prenoms[0] ?? "") : `${prenoms.slice(0, -1).join(", ")} et ${prenoms[prenoms.length - 1]}`);

/**
 * Envoyer un lieu à des potes de ta bande, dans une feuille qui monte du bas : choisir un ou plusieurs potes,
 * un petit mot facultatif, « Envoyer », puis la confirmation. Un pote de moins de 18 ans ne reçoit pas un bar (il n'est pas proposé).
 */
export function EnvoyerAPote({ visible, lieuId, onFermer }: Props) {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const { profil } = utiliserProfil();
  const { potes, envoyerLieu } = utiliserCommunaute();
  const [choisis, setChoisis] = useState<string[]>([]);
  const [mot, setMot] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoyesA, setEnvoyesA] = useState<string[] | null>(null);
  // À chaque ouverture, on repart d'une feuille vierge (sans montrer l'ancien envoi le temps d'un rendu)
  const [ouvert, setOuvert] = useState(visible);
  if (visible !== ouvert) {
    setOuvert(visible);
    if (visible) {
      setChoisis([]);
      setMot("");
      setErreur(null);
      setEnvoyesA(null);
    }
  }

  const age = profil ? calculerAge(profil.dateNaissance) : null;
  // Sous 18 ans, les bars n'existent pas pour toi : rien à envoyer
  const lieu = filtrerLieuxSelonAge(lieuxExemples, age).find((l) => l.id === lieuId) ?? null;
  const pourUnBar = lieu?.type === "bar";
  const destinataires = potes.filter((p) => !(pourUnBar && p.mineur));
  const mineursEcartes = destinataires.length < potes.length;

  function basculer(id: string) {
    vibrerLegerement();
    setErreur(null);
    setChoisis((avant) => (avant.includes(id) ? avant.filter((x) => x !== id) : [...avant, id]));
  }

  function envoyer() {
    if (!lieu || choisis.length === 0) return;
    // Dernière vérification : seulement des potes de la bande, et pas de bar pour un mineur
    const ids = choisis.filter((id) => destinataires.some((p) => p.id === id));
    if (ids.length === 0) return;
    const resultat = envoyerLieu(lieu.id, ids, mot.trim() || undefined);
    if (resultat !== "ok") return setErreur(ERREURS_MOT[resultat]);
    const prenoms = destinataires.filter((p) => ids.includes(p.id)).map((p) => p.prenom);
    setEnvoyesA(prenoms);
    AccessibilityInfo.announceForAccessibility(`C'est envoyé à ${joindrePrenoms(prenoms)} !`);
  }

  const nomsChoisis = joindrePrenoms(destinataires.filter((p) => choisis.includes(p.id)).map((p) => p.prenom));

  const contenu = !lieu ? (
    <View className="items-center gap-3 py-4">
      <Text className="text-center font-titre text-2xl text-encre">Ce lieu n'est pas disponible</Text>
      <Bouton libelle="Fermer" variante="blanc" onPress={onFermer} className="self-stretch" />
    </View>
  ) : envoyesA ? (
    <View className="items-center gap-3 pb-2 pt-1">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-5xl">
        📬
      </Text>
      <Text accessibilityRole="header" className="text-center font-titre text-2xl text-encre">
        C'est envoyé !
      </Text>
      <Text className="text-center font-texte text-base leading-6 text-encre">
        {lierPonctuation(`${joindrePrenoms(envoyesA)} ${envoyesA.length > 1 ? "vont" : "va"} saliver devant ${lieu.nom}.`)}
      </Text>
      <Text className="text-center font-texte text-sm leading-5 text-gris">
        {lierPonctuation("Démo : l'envoi reste sur ton téléphone, tes potes d'exemple ne le reçoivent pas pour de vrai. Avec les comptes, il partira chez eux.")}
      </Text>
      <Bouton libelle="Fermer" onPress={onFermer} className="mt-2 self-stretch" />
    </View>
  ) : (
    <View className="gap-4">
      <View className="flex-row items-center gap-3">
        <VignetteLieu lieu={lieu} image={trouverVignetteLieu(lieu.id, publicationsExemples)} hauteur={52} />
        <View className="flex-1">
          <Text accessibilityRole="header" className="font-titre text-2xl text-encre">
            Envoyer à un pote
          </Text>
          <Text numberOfLines={1} className="font-texte text-sm text-gris">
            {lieu.nom} · {lieu.quartier}, {lieu.ville}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2.5 rounded-2xl border-2 border-dashed border-gris/40 bg-white/70 px-3.5 py-2.5">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-lg">
          🧪
        </Text>
        <Text className="flex-1 font-texte text-[13px] leading-5 text-gris">
          <Text className="font-texte-gras text-encre">Potes d'exemple</Text>
          {lierPonctuation(" : tes vrais potes arriveront avec les comptes.")}
        </Text>
      </View>

      {potes.length === 0 ? (
        <View className="items-center gap-3 rounded-carte border-2 border-dashed border-ligne px-5 py-6">
          <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation("Ta bande est vide pour l'instant. Ajoute un pote, et les bons plans voyageront !")}</Text>
          <Bouton
            libelle="Ajouter un pote"
            petit
            onPress={() => {
              onFermer();
              router.push("/potes/ajouter");
            }}
          />
        </View>
      ) : (
        <View>
          <Text className="mb-1 font-texte-semi text-base text-encre">À qui ?</Text>
          {destinataires.map((pote, i) => {
            const choisi = choisis.includes(pote.id);
            return (
              <Pressable
                key={pote.id}
                // Plusieurs choix possibles : case à cocher sur Android ; sur iPhone, bouton « sélectionné » (l'état « coché » y est lu en anglais), avec la position dans le libellé
                accessibilityRole={Platform.OS === "ios" ? "button" : "checkbox"}
                accessibilityState={Platform.OS === "ios" ? { selected: choisi } : { checked: choisi }}
                accessibilityLabel={`${pote.prenom}, @${pote.pseudo}${Platform.OS === "ios" ? `, ${i + 1} sur ${destinataires.length}` : ""}`}
                onPress={() => basculer(pote.id)}
                className="min-h-14 flex-row items-center gap-3 border-b border-ligne py-2.5 active:opacity-70"
              >
                <RondPote pote={pote} taille={44} />
                <View className="flex-1">
                  <Text numberOfLines={1} className="font-texte-gras text-base text-encre">
                    {pote.prenom}
                  </Text>
                  <Text numberOfLines={1} className="font-texte text-sm text-gris">
                    @{pote.pseudo}
                  </Text>
                </View>
                <View className={`h-7 w-7 items-center justify-center rounded-full border-2 border-encre ${choisi ? "bg-encre" : "bg-white"}`}>
                  {choisi ? <Text className="font-texte-gras text-sm text-jaune">✓</Text> : null}
                </View>
              </Pressable>
            );
          })}
          {mineursEcartes ? (
            <Text className="mt-2 font-texte text-sm leading-5 text-gris">{lierPonctuation("Pas de bar pour les moins de 18 ans : ces potes-là ne sont pas proposés ici.")}</Text>
          ) : null}
        </View>
      )}

      {destinataires.length > 0 ? (
        <>
          <ChampTexte
            libelle="Un petit mot"
            mention="facultatif"
            valeur={mot}
            onChangeTexte={(texte) => {
              setMot(texte);
              setErreur(null);
            }}
            placeholder="Leurs pâtes vont te faire pleurer de joie"
            multiline
            maxLength={LONGUEUR_MAX_MOT_RECOMMANDATION}
            aide={`${mot.length}/${LONGUEUR_MAX_MOT_RECOMMANDATION}`}
            erreur={erreur}
          />
          <Bouton
            libelle="Envoyer"
            desactive={choisis.length === 0}
            indice={choisis.length === 0 ? "Choisis d'abord au moins un pote" : `Envoie ${lieu.nom} à ${nomsChoisis}`}
            onPress={envoyer}
          />
        </>
      ) : null}

      <Pressable accessibilityRole="button" onPress={onFermer} className="min-h-12 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80">
        <Text className="font-texte-gras text-base text-encre">Annuler</Text>
      </Pressable>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={onFermer}>
      {/* La feuille remonte au-dessus du clavier quand on écrit le petit mot */}
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={onFermer}
          // flexShrink : clavier ouvert, la feuille rétrécit et son contenu défile jusqu'au bouton « Envoyer »
          style={{ paddingBottom: marges.bottom + 12, maxHeight: hauteurEcran * 0.88, flexShrink: 1 }}
          className="rounded-t-3xl border-t-2 border-encre bg-creme pt-3"
        >
          <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-ligne" />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-5">
            {contenu}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
