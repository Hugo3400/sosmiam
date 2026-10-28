import { useRouter, type Href } from "expo-router";
import { useEffect } from "react";
import { AccessibilityInfo, Platform, Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { ANNONCES_PROFIL, ANNONCES_PROFIL_PAR_LANGUE, BOUTON_COMPRIS_PAR_LANGUE } from "~/contenus/annonces-profil";
import { TEXTES_ANNONCE_PROFIL_PAR_LANGUE } from "~/contenus/textes-profil-onglet";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { AnnonceSynchro } from "~/stockage/synchro-profil";

/** Les annonces déjà lues au lecteur d'écran pendant ce lancement (l'onglet Profil se rouvre souvent) */
const dejaDites = new Set<string>();

/** Le titre et le texte d'une annonce, prêts à afficher */
function decrire(annonce: AnnonceSynchro, modeles: typeof ANNONCES_PROFIL_PAR_LANGUE.fr): { emoji: string; titre: string; texte: string } {
  const modele = modeles[annonce.type];
  if (annonce.type === "prenom-limite") {
    // « Compte limité jusqu'au 12 octobre 2026 », ou « pour l'instant » sans date (même titre qu'une alerte « compte-limite »)
    const { titre } = decrireEchecVisite("compte-limite", annonce.jusqua ? { jusqua: annonce.jusqua } : undefined);
    return { emoji: modele.emoji, titre, texte: lierPonctuation(modele.texte) };
  }
  return { emoji: modele.emoji, titre: modele.titre, texte: lierPonctuation(modele.texte.replace("{pseudo}", annonce.pseudo)) };
}

/**
 * La carte d'annonce de l'onglet Profil, sous l'en-tête : ton pseudo remplacé par un pseudo neutre (profil retenu par la
 * modération), un pseudo jamais parti de ce téléphone, ou un prénom qui n'a pas pu changer (compte limité). Elle disparaît
 * pour de bon dès qu'on touche un de ses boutons, ou que le pseudo change. Rien à annoncer : rien du tout.
 */
export function AnnonceProfil() {
  const router = useRouter();
  const T = utiliserTextes(TEXTES_ANNONCE_PROFIL_PAR_LANGUE);
  const modeles = utiliserTextes(ANNONCES_PROFIL_PAR_LANGUE);
  const compris = utiliserTextes(BOUTON_COMPRIS_PAR_LANGUE);
  const { annonce, fermerAnnonce } = utiliserProfil();

  // Lue une fois au lecteur d'écran, à sa première apparition
  useEffect(() => {
    const cle = annonce ? JSON.stringify(annonce) : null;
    if (!annonce || !cle || dejaDites.has(cle)) return;
    dejaDites.add(cle);
    const { titre, texte } = decrire(annonce, modeles);
    if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibilityWithOptions(`${titre}. ${texte}`, { queue: true });
    else AccessibilityInfo.announceForAccessibility(`${titre}. ${texte}`);
  }, [annonce, modeles]);

  if (!annonce) return null;
  const description = decrire(annonce, modeles);
  const modele = modeles[annonce.type];

  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-jaune-clair p-4">
      <View className="flex-row gap-3">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-3xl">
          {description.emoji}
        </Text>
        <View className="flex-1 gap-0.5">
          <Text accessibilityRole="header" className="font-texte-gras text-base text-encre">
            {description.titre}
          </Text>
          <Text className="font-texte text-sm leading-5 text-gris">{description.texte}</Text>
        </View>
      </View>
      <View className="flex-row flex-wrap gap-3">
        <Bouton
          libelle={modele.bouton}
          variante="encre"
          petit
          indice={annonce.type === "prenom-limite" ? T.indiceDecisions : T.indicePseudo}
          onPress={() => {
            fermerAnnonce();
            router.push(ANNONCES_PROFIL[annonce.type].vers as Href);
          }}
        />
        <Bouton libelle={compris} variante="blanc" petit indice={T.indiceRanger} onPress={fermerAnnonce} />
      </View>
    </View>
  );
}
