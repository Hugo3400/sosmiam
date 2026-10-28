import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Linking, Platform, Pressable, Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { LONGUEUR_MAX_VILLE, villesConnues, villesLancement } from "~/contenus/inscription/villes";
import { TEXTES_INSCRIPTION_VILLE_PAR_LANGUE } from "~/contenus/textes-inscription-ville";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { nettoyerNomVille } from "~/fonctions/texte/nettoyer-nom-ville";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";
import { verifierNomVille } from "~/fonctions/texte/verifier-nom-ville";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { utiliserVilleParPosition, type ResultatVilleParPosition } from "~/hooks/utiliser-ville-par-position";

type Props = {
  /** Ville choisie, ou null */
  valeur: string | null;
  /** La ville mise au propre, ou null tant que ce qui est tapé n'en est pas une */
  onChangeVille: (ville: string | null) => void;
};

/** Ce qui a coincé avec la position (« reglages-fermes » : les réglages du téléphone n'ont pas voulu s'ouvrir) */
type ErreurPosition = Extract<ResultatVilleParPosition, { erreur: string }>["erreur"] | "reglages-fermes";

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
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_INSCRIPTION_VILLE_PAR_LANGUE);
  const messageErreur = (code: ErreurPosition) => lierPonctuation(T.erreurs[code]);
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
  const erreurSaisie = verdict === "caracteres-refuses" ? lierPonctuation(T.caracteres) : verdict === "incomplet" && quitte ? lierPonctuation(T.incomplet) : null;

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
      AccessibilityInfo.announceForAccessibilityWithOptions(T.villesProposees(nouvelles.length), { queue: true });
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
    if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibility(messageErreur(code));
  }

  async function utiliserPosition() {
    vibrerLegerement();
    setErreurPosition(null);
    const appel = ++generation.current;
    const resultat = await chercherVille();
    if (appel !== generation.current) return;
    if ("ville" in resultat) {
      choisir(resultat.ville);
      AccessibilityInfo.announceForAccessibility(T.villeTrouvee(resultat.ville));
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
          {T.titre}
        </Text>
        <Text className="font-texte text-sm leading-5 text-gris">{T.sousTitre}</Text>
      </View>

      {positionPossible ? (
        <View className="gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={T.utiliserPosition}
            accessibilityHint={T.indicePosition}
            accessibilityState={{ busy: recherche, disabled: recherche }}
            disabled={recherche}
            onPress={utiliserPosition}
            className="min-h-12 flex-row items-center justify-center gap-2 rounded-full border-2 border-encre bg-carte px-5 active:opacity-80"
          >
            {recherche ? <ActivityIndicator color={couleurs.encre} /> : <Ionicons name="navigate" size={18} color={couleurs.encre} />}
            <Text className="font-texte-gras text-base text-encre">{recherche ? T.rechercheEnCours : T.utiliserPosition}</Text>
          </Pressable>
          <Text className="font-texte text-xs leading-4 text-gris">{lierPonctuation(T.notePosition)}</Text>
          {erreurPosition ? (
            <View className="gap-3">
              <Text accessibilityLiveRegion="polite" className="font-texte text-sm leading-5 text-rouge-texte">
                {messageErreur(erreurPosition)}
              </Text>
              {/* Le téléphone ne redemandera plus : seuls ses réglages permettent de changer d'avis */}
              {erreurPosition === "refus-definitif" ? (
                <Bouton libelle={T.ouvrirReglages} variante="blanc" petit onPress={ouvrirReglagesTelephone} />
              ) : null}
            </View>
          ) : null}
          <Text className="text-center font-texte-semi text-sm text-gris">{T.ou}</Text>
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
              accessibilityHint={T.indiceVille}
              onPress={() => choisir(ville)}
              className="min-h-11 flex-row items-center gap-1.5 rounded-full border-2 border-encre bg-carte px-4 py-2 active:opacity-80"
            >
              <Text className="text-sm">📍</Text>
              <Text className="font-texte-semi text-[15px] text-encre">{ville}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <ChampTexte
        libelle={T.ecrisTaVille}
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
