import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Platform, Pressable, Text, View } from "react-native";

import { ChampTexte } from "~/composants/interface/ChampTexte";
import { LONGUEUR_MAX_VILLE, LONGUEUR_MIN_VILLE, villesLancement } from "~/contenus/inscription/villes";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { nettoyerNomVille } from "~/fonctions/texte/nettoyer-nom-ville";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";
import { utiliserVilleParPosition, type ResultatVilleParPosition } from "~/hooks/utiliser-ville-par-position";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Ville choisie, ou null */
  valeur: string | null;
  /** La ville mise au propre, ou null tant que ce qui est tapé n'en est pas une */
  onChangeVille: (ville: string | null) => void;
};

const messagesErreur: Record<Extract<ResultatVilleParPosition, { erreur: string }>["erreur"], string> = {
  refus: "Pas de souci, ta position reste à toi : écris ta ville juste en dessous.",
  coupee: "Ta localisation est coupée sur le téléphone : active-la dans ses réglages, ou écris ta ville juste en dessous.",
  introuvable: "On n'a pas réussi à trouver ta ville : écris-la juste en dessous.",
};

// Retrouver une ville à partir d'une position n'existe pas dans le navigateur (aperçu web) : on y tape sa ville
const positionPossible = Platform.OS !== "web";

/** Choix de la ville : avec la position du téléphone (lue une fois, jamais gardée), ou tapée à la main avec des suggestions. */
export function ChoixVille({ valeur, onChangeVille }: Props) {
  const [texte, setTexte] = useState(valeur ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const { chercherVille, recherche } = utiliserVilleParPosition();

  function ecrire(saisie: string) {
    setTexte(saisie);
    setErreur(null);
    const propre = nettoyerNomVille(saisie, villesLancement);
    const valable = propre.length >= LONGUEUR_MIN_VILLE && /\p{L}/u.test(propre);
    onChangeVille(valable ? propre : null);
  }

  function choisir(ville: string) {
    vibrerLegerement();
    setTexte(ville);
    setErreur(null);
    onChangeVille(ville);
  }

  async function utiliserPosition() {
    vibrerLegerement();
    const resultat = await chercherVille();
    if ("ville" in resultat) {
      choisir(resultat.ville);
      AccessibilityInfo.announceForAccessibility(`Ville trouvée : ${resultat.ville}`);
    } else {
      setErreur(messagesErreur[resultat.erreur]);
    }
  }

  // Suggestions : les villes de lancement qui contiennent ce qui est tapé (sauf celle déjà écrite en entier)
  const cherche = normaliserRecherche(texte);
  const suggestions = cherche === "" ? [] : villesLancement.filter((v) => normaliserRecherche(v).includes(cherche) && normaliserRecherche(v) !== cherche);

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
          <Text className="font-texte text-xs leading-4 text-gris">Ta position sert juste à trouver le nom de ta ville : on ne la garde pas.</Text>
          {erreur ? (
            <Text accessibilityLiveRegion="polite" className="font-texte text-sm leading-5 text-rouge-texte">
              {erreur}
            </Text>
          ) : null}
          <Text className="text-center font-texte-semi text-sm text-gris">ou</Text>
        </View>
      ) : null}

      <ChampTexte
        libelle="Écris ta ville"
        valeur={texte}
        onChangeTexte={ecrire}
        placeholder="Montpellier, Sète, Lyon…"
        textContentType="addressCity"
        autoComplete="postal-address-locality"
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={LONGUEUR_MAX_VILLE}
        returnKeyType="done"
      />

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
    </View>
  );
}
