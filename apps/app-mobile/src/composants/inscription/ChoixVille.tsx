import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Linking, Platform, Pressable, Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { LONGUEUR_MAX_VILLE, villesConnues, villesLancement } from "~/contenus/inscription/villes";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { nettoyerNomVille } from "~/fonctions/texte/nettoyer-nom-ville";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";
import { verifierNomVille } from "~/fonctions/texte/verifier-nom-ville";
import { utiliserVilleParPosition, type ResultatVilleParPosition } from "~/hooks/utiliser-ville-par-position";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Ville choisie, ou null */
  valeur: string | null;
  /** La ville mise au propre, ou null tant que ce qui est tapé n'en est pas une */
  onChangeVille: (ville: string | null) => void;
};

/** Ce qui a coincé avec la position (« reglages-fermes » : les réglages du téléphone n'ont pas voulu s'ouvrir) */
type ErreurPosition = Extract<ResultatVilleParPosition, { erreur: string }>["erreur"] | "reglages-fermes";

const messagesErreur: Record<ErreurPosition, string> = {
  refus: lierPonctuation("Pas de souci, ta position reste à toi : écris ta ville juste en dessous."),
  "refus-definitif": lierPonctuation(
    "Tu avais dit non à ta position, et c'est ton droit ! Si tu changes d'avis, ça se passe dans les réglages du téléphone. Sinon, écris ta ville juste en dessous.",
  ),
  coupee: lierPonctuation("Ta localisation est coupée sur le téléphone : active-la dans ses réglages, ou écris ta ville juste en dessous."),
  introuvable: lierPonctuation("On n'a pas réussi à trouver ta ville : écris-la juste en dessous."),
  "reglages-fermes": lierPonctuation("Les réglages n'ont pas voulu s'ouvrir : tu les trouveras dans l'appli Réglages du téléphone. Ou écris ta ville juste en dessous."),
};

const MESSAGE_CARACTERES = lierPonctuation("Juste des lettres ici : pas de code postal ni de symboles, le nom de ta ville suffit.");
const MESSAGE_INCOMPLET = lierPonctuation("Il manque un petit bout : écris le nom de ta ville en entier.");
const NOTE_POSITION = lierPonctuation("Ta position sert juste à trouver le nom de ta ville : on ne la garde pas.");

// Retrouver une ville à partir d'une position n'existe pas dans le navigateur (aperçu web) : on y tape sa ville
const positionPossible = Platform.OS !== "web";

const MAX_SUGGESTIONS = 6;
// Préparées une fois : comparées sans accents ni majuscules, villes de lancement d'abord (ordre de villesConnues)
const villesComparees = villesConnues.map((ville, ordre) => ({ ville, ordre, cle: normaliserRecherche(ville), lancement: villesLancement.includes(ville) }));

/**
 * Les villes de France qui contiennent ce qui est tapé (sauf celle déjà écrite en entier), 6 au plus : villes de lancement
 * d'abord, puis les autres, et dans chaque groupe celles qui commencent par ce qui est tapé.
 */
function proposerVilles(texte: string): string[] {
  const cherche = normaliserRecherche(texte);
  if (cherche === "") return [];
  const rang = (v: (typeof villesComparees)[number]) => (v.lancement ? 0 : 2) + (v.cle.startsWith(cherche) ? 0 : 1);
  return villesComparees
    .filter((v) => v.cle.includes(cherche) && v.cle !== cherche)
    .sort((a, b) => rang(a) - rang(b) || a.ordre - b.ordre)
    .slice(0, MAX_SUGGESTIONS)
    .map((v) => v.ville);
}

/** Choix de la ville : avec la position du téléphone (lue une fois, jamais gardée), ou tapée à la main avec des suggestions. */
export function ChoixVille({ valeur, onChangeVille }: Props) {
  const [texte, setTexte] = useState(valeur ?? "");
  // Le champ a été quitté au moins une fois depuis la dernière saisie : on peut dire s'il manque un bout
  const [quitte, setQuitte] = useState(false);
  const [erreurPosition, setErreurPosition] = useState<ErreurPosition | null>(null);
  const { chercherVille, recherche } = utiliserVilleParPosition();

  // Chaque saisie, chaque choix et chaque départ de l'écran ouvre une nouvelle « génération » : une ville trouvée
  // par la position après coup est ignorée, pour ne pas écraser ce qui vient d'être tapé ni changer un écran qu'on a quitté
  const generation = useRef(0);
  useFocusEffect(
    useCallback(
      () => () => {
        generation.current += 1;
      },
      [],
    ),
  );

  const suggestions = proposerVilles(texte);

  // Ce qui est tapé et refusé (pas de ville retenue) : chiffres et symboles signalés tout de suite, un nom incomplet seulement en quittant le champ
  const verdict = valeur === null && texte.trim() !== "" ? verifierNomVille(nettoyerNomVille(texte)) : "valable";
  const erreurSaisie = verdict === "caracteres-refuses" ? MESSAGE_CARACTERES : verdict === "incomplet" && quitte ? MESSAGE_INCOMPLET : null;

  function ecrire(saisie: string) {
    generation.current += 1;
    setTexte(saisie);
    setQuitte(false);
    setErreurPosition(null);
    const propre = nettoyerNomVille(saisie);
    onChangeVille(verifierNomVille(propre) === "valable" ? propre : null);

    // Les suggestions s'affichent au-dessus du champ : on prévient le lecteur d'écran quand elles apparaissent
    const nouvelles = proposerVilles(saisie);
    if (suggestions.length === 0 && nouvelles.length > 0 && Platform.OS !== "web") {
      const annonce = nouvelles.length === 1 ? "1 ville proposée, juste au-dessus du champ" : `${nouvelles.length} villes proposées, juste au-dessus du champ`;
      AccessibilityInfo.announceForAccessibilityWithOptions(annonce, { queue: true });
    }
  }

  function choisir(ville: string) {
    generation.current += 1;
    vibrerLegerement();
    setTexte(ville);
    setQuitte(false);
    setErreurPosition(null);
    onChangeVille(ville);
  }

  // Sur iPhone, VoiceOver ignore la « live region » d'Android : l'erreur y est annoncée à la main
  function signalerErreurPosition(code: ErreurPosition) {
    setErreurPosition(code);
    if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibility(messagesErreur[code]);
  }

  async function utiliserPosition() {
    vibrerLegerement();
    setErreurPosition(null);
    const appel = ++generation.current;
    const resultat = await chercherVille();
    if (appel !== generation.current) return;
    if ("ville" in resultat) {
      choisir(resultat.ville);
      AccessibilityInfo.announceForAccessibility(`Ville trouvée : ${resultat.ville}`);
    } else {
      signalerErreurPosition(resultat.erreur);
    }
  }

  function ouvrirReglagesTelephone() {
    Linking.openSettings().catch(() => signalerErreurPosition("reglages-fermes"));
  }

  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text accessibilityRole="header" className="font-texte-semi text-base text-encre">
          Ta ville
        </Text>
        <Text className="font-texte text-sm leading-5 text-gris">Pour te montrer les bons plans près de chez toi.</Text>
      </View>

      {positionPossible ? (
        <View className="gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Utiliser ma position"
            accessibilityHint="Trouve ta ville avec la position du téléphone, lue une seule fois"
            accessibilityState={{ busy: recherche, disabled: recherche }}
            disabled={recherche}
            onPress={utiliserPosition}
            className="min-h-12 flex-row items-center justify-center gap-2 rounded-full border-2 border-encre bg-white px-5 active:opacity-80"
          >
            {recherche ? <ActivityIndicator color={couleurs.encre} /> : <Ionicons name="navigate" size={18} color={couleurs.encre} />}
            <Text className="font-texte-gras text-base text-encre">{recherche ? "On cherche ta ville…" : "Utiliser ma position"}</Text>
          </Pressable>
          <Text className="font-texte text-xs leading-4 text-gris">{NOTE_POSITION}</Text>
          {erreurPosition ? (
            <View className="gap-3">
              <Text accessibilityLiveRegion="polite" className="font-texte text-sm leading-5 text-rouge-texte">
                {messagesErreur[erreurPosition]}
              </Text>
              {/* Le téléphone ne redemandera plus : seuls ses réglages permettent de changer d'avis */}
              {erreurPosition === "refus-definitif" ? (
                <Bouton libelle="Ouvrir les réglages du téléphone" variante="blanc" petit onPress={ouvrirReglagesTelephone} />
              ) : null}
            </View>
          ) : null}
          <Text className="text-center font-texte-semi text-sm text-gris">ou</Text>
        </View>
      ) : null}

      {/* Au-dessus du champ, pour rester visibles quand le clavier est ouvert (le champ est souvent tout en bas de l'écran) */}
      {suggestions.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {suggestions.map((ville) => (
            <Pressable
              key={ville}
              accessibilityRole="button"
              accessibilityLabel={ville}
              accessibilityHint="Choisit cette ville"
              onPress={() => choisir(ville)}
              className="min-h-11 flex-row items-center gap-1.5 rounded-full border-2 border-encre bg-white px-4 py-2 active:opacity-80"
            >
              <Text className="text-sm">📍</Text>
              <Text className="font-texte-semi text-[15px] text-encre">{ville}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <ChampTexte
        libelle="Écris ta ville"
        valeur={texte}
        onChangeTexte={ecrire}
        onBlur={() => setQuitte(true)}
        erreur={erreurSaisie}
        placeholder="Lyon, Lille, Sète…"
        textContentType="addressCity"
        autoComplete="postal-address-locality"
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={LONGUEUR_MAX_VILLE}
        returnKeyType="done"
      />
    </View>
  );
}
