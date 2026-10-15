import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LONGUEUR_MAX_MOT_RECOMMANDATION } from "@sos-miam/commun/regles/potes";
import { VignetteLieu } from "~/composants/explorer/VignetteLieu";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { RondPote } from "~/composants/potes/RondPote";
import { REFUS_LIMITATION } from "~/contenus/limitation-compte";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { ecrireQuartierVille } from "~/fonctions/lieux/ecrire-quartier-ville";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute, type ResultatTexte } from "~/hooks/utiliser-communaute";
import { utiliserInscriptionFeuille } from "~/hooks/utiliser-inscription-feuille";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserPublications } from "~/hooks/utiliser-publications";

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
 * un petit mot facultatif, « Envoyer », puis la confirmation.
 */
export function EnvoyerAPote({ visible, lieuId, onFermer }: Props) {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  // demo : les potes d'exemple, et l'envoi qui reste sur le téléphone (on le dit) ; avec un compte, il part pour de vrai
  const { potes, envoyerLieu, demo } = utiliserCommunaute();
  const { lieux: tousLesLieux } = utiliserLieux();
  const { publications: toutesLesPublications } = utiliserPublications();
  const [choisis, setChoisis] = useState<string[]>([]);
  const [mot, setMot] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  // Le serveur a refusé l'envoi (compte limité, réseau) : dit au-dessus d'« Envoyer », pas comme une faute du petit mot
  const [refus, setRefus] = useState<string | null>(null);
  const [envoyesA, setEnvoyesA] = useState<string[] | null>(null);
  // Le dernier envoi : un refus arrivé pour un envoi plus ancien (feuille rouverte depuis) ne touche à rien
  const envoiCourant = useRef(0);
  useEffect(() => {
    if (visible) envoiCourant.current++;
  }, [visible]);
  utiliserInscriptionFeuille(visible, onFermer);
  // À chaque ouverture, on repart d'une feuille vierge (sans montrer l'ancien envoi le temps d'un rendu)
  const [ouvert, setOuvert] = useState(visible);
  if (visible !== ouvert) {
    setOuvert(visible);
    if (visible) {
      setChoisis([]);
      setMot("");
      setErreur(null);
      setRefus(null);
      setEnvoyesA(null);
    }
  }

  const lieu = tousLesLieux.find((l) => l.id === lieuId) ?? null;

  function basculer(id: string) {
    vibrerLegerement();
    setErreur(null);
    setRefus(null);
    setChoisis((avant) => (avant.includes(id) ? avant.filter((x) => x !== id) : [...avant, id]));
  }

  function envoyer() {
    if (!lieu || choisis.length === 0) return;
    // Dernière vérification : seulement des potes de la bande
    const ids = choisis.filter((id) => potes.some((p) => p.id === id));
    if (ids.length === 0) return;
    const numero = ++envoiCourant.current;
    // Compte connecté : « C'est envoyé ! » s'affiche tout de suite ; si le serveur refuse, on revient au choix des potes et on dit pourquoi
    const resultat = envoyerLieu(lieu.id, ids, mot.trim() || undefined, (refus) => {
      if (numero !== envoiCourant.current) return;
      const texte = refus === "compte-limite" ? REFUS_LIMITATION.lieuEnvoye : "Ton lieu n'est pas parti : réessaie dans un instant.";
      setEnvoyesA(null);
      setRefus(texte);
      AccessibilityInfo.announceForAccessibility(texte);
    });
    setRefus(null);
    if (resultat !== "ok") return setErreur(ERREURS_MOT[resultat]);
    const prenoms = potes.filter((p) => ids.includes(p.id)).map((p) => p.prenom);
    setEnvoyesA(prenoms);
    AccessibilityInfo.announceForAccessibility(`C'est envoyé à ${joindrePrenoms(prenoms)} !`);
  }

  const nomsChoisis = joindrePrenoms(potes.filter((p) => choisis.includes(p.id)).map((p) => p.prenom));

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
      {demo ? (
        <Text className="text-center font-texte text-sm leading-5 text-gris">
          {lierPonctuation("Démo : l'envoi reste sur ton téléphone, tes potes d'exemple ne le reçoivent pas pour de vrai. Quitte la démo pour l'envoyer à ta vraie bande.")}
        </Text>
      ) : null}
      <Bouton libelle="Fermer" onPress={onFermer} className="mt-2 self-stretch" />
    </View>
  ) : (
    <View className="gap-4">
      <View className="flex-row items-center gap-3">
        <VignetteLieu lieu={lieu} image={trouverVignetteLieu(lieu.id, toutesLesPublications)} hauteur={52} />
        <View className="flex-1">
          <Text accessibilityRole="header" className="font-titre text-2xl text-encre">
            Envoyer à un pote
          </Text>
          <Text numberOfLines={1} className="font-texte text-sm text-gris">
            {lieu.nom} · {ecrireQuartierVille(lieu)}
          </Text>
        </View>
      </View>

      {demo ? (
        <View className="flex-row items-center gap-2.5 rounded-2xl border-2 border-dashed border-gris/40 bg-white/70 px-3.5 py-2.5">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-lg">
            🧪
          </Text>
          <Text className="flex-1 font-texte text-[13px] leading-5 text-gris">
            <Text className="font-texte-gras text-encre">Potes d'exemple</Text>
            {lierPonctuation(" : quitte la démo pour retrouver ta vraie bande.")}
          </Text>
        </View>
      ) : null}

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
          {potes.map((pote, i) => {
            const choisi = choisis.includes(pote.id);
            return (
              <Pressable
                key={pote.id}
                // Plusieurs choix possibles : case à cocher sur Android ; sur iPhone, bouton « sélectionné » (l'état « coché » y est lu en anglais), avec la position dans le libellé
                accessibilityRole={Platform.OS === "ios" ? "button" : "checkbox"}
                accessibilityState={Platform.OS === "ios" ? { selected: choisi } : { checked: choisi }}
                accessibilityLabel={`${pote.prenom}, @${pote.pseudo}${Platform.OS === "ios" ? `, ${i + 1} sur ${potes.length}` : ""}`}
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
        </View>
      )}

      {potes.length > 0 ? (
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
          {refus ? (
            <Text className="overflow-hidden rounded-2xl bg-rose-alerte px-4 py-2.5 font-texte-semi text-sm leading-5 text-rouge-texte">{lierPonctuation(refus)}</Text>
          ) : null}
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
