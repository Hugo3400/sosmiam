import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import type { Visite } from "@sos-miam/commun/types/visite";
import { Bouton } from "~/composants/interface/Bouton";
import { eliderDe } from "~/fonctions/texte/elider-de";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserReglagesDemo } from "~/hooks/utiliser-reglages-demo";
import { utiliserOutilsDemo } from "~/hooks/utiliser-services";

type Props = {
  /** L'addition en attente (rien ne s'affiche pour une autre étape) */
  visite: Visite;
};

// Le temps que l'écran de la visite finisse de descendre avant d'ouvrir le mode pro
const DELAI_MODE_PRO = 400;

/**
 * Démo seulement : sous le code d'une addition en attente, de quoi jouer le lieu (« Le lieu marque réglée », « Le lieu
 * refuse »). Si c'est toi qui joues ce lieu dans les Coulisses, on t'envoie plutôt au Comptoir du mode pro. Rien hors démo.
 */
export function PanneauSimulationLieu({ visite }: Props) {
  const router = useRouter();
  const outils = utiliserOutilsDemo();
  const { reglages } = utiliserReglagesDemo();
  const { entrerEnModePro, modesOuverts } = utiliserModes();
  const [occupe, setOccupe] = useState(false);

  if (!outils || visite.statut !== "demandee") return null;
  const lieu = visite.lieu;
  const joueParMoi = outils.lieuJoueParMoi(lieu.id);

  async function repondre(reponse: Parameters<typeof outils.repondreCommeLeLieu>[1]) {
    if (!outils || occupe) return;
    setOccupe(true);
    try {
      await outils.repondreCommeLeLieu(visite.id, reponse);
    } catch {
      // La démo n'a pas pu écrire : l'écran reste tel quel, on peut retoucher le bouton
    } finally {
      setOccupe(false);
    }
  }

  function passerEnModePro() {
    if (router.canGoBack()) router.back();
    setTimeout(() => entrerEnModePro(lieu.id), DELAI_MODE_PRO);
  }

  return (
    <View className="gap-3 rounded-carte border-2 border-dashed border-encre bg-jaune-clair p-4">
      <View accessible className="flex-row items-start gap-3">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-xl">
          🧪
        </Text>
        <View className="flex-1 gap-1">
          <Text className="font-texte-gras text-base text-encre">{joueParMoi ? "Démo : c'est toi, le lieu" : "Démo : joue le lieu"}</Text>
          <Text className="font-texte text-sm leading-5 text-encre">
            {lierPonctuation(
              joueParMoi
                ? `C'est toi qui joues l'équipe ${eliderDe(lieu.nom)} : passe en mode pro pour marquer l'addition réglée.`
                : reglages.lieuxRepondentSeuls
                  ? "Les lieux répondent tout seuls (Coulisses) : réponse dans quelques secondes. Ou réponds à leur place :"
                  : "En vrai, c'est l'équipe qui répond depuis son comptoir. Ici, tu peux le faire à sa place :",
            )}
          </Text>
        </View>
      </View>
      {joueParMoi ? (
        modesOuverts.includes("pro") ? (
          <Bouton libelle="Passer en mode pro" variante="encre" petit indice="Ferme cet écran et ouvre le Comptoir du lieu" onPress={passerEnModePro} />
        ) : null
      ) : (
        <View className="gap-2.5">
          <Bouton
            libelle="Le lieu marque réglée"
            petit
            desactive={occupe}
            indice="Fait comme si l'équipe avait validé ton addition"
            onPress={() => void repondre({ regler: true })}
          />
          <Bouton
            libelle="Le lieu refuse"
            variante="blanc"
            petit
            desactive={occupe}
            indice="Fait comme si l'équipe n'avait pas retrouvé ton addition"
            onPress={() => void repondre({ regler: false, motif: "introuvable" })}
          />
        </View>
      )}
    </View>
  );
}
