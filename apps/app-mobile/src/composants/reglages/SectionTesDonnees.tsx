import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { LigneReglage } from "~/composants/reglages/LigneReglage";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserExportSocial } from "~/hooks/utiliser-export-social";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Un compte est connecté (le texte sur ce qui est gardé où change) */
  connecte: boolean;
  /** « Effacer mes données et recommencer » touché */
  onEffacer: () => void;
  /** Dit le résultat du téléchargement (petit message en haut de l'écran, lu par VoiceOver) */
  onAnnoncer: (texte: string) => void;
};

/** Ce qu'on dit après « Télécharger mes données sociales » */
function annoncerExport(resultat: "ok" | "indisponible" | ErreurService): string {
  switch (resultat) {
    case "ok":
      return "📦 Tes données sont prêtes. Garde ce fichier rien que pour toi !";
    case "indisponible":
      return "📱 Pas moyen d'enregistrer un fichier ici : télécharge tes données depuis l'app, sur ton téléphone.";
    // Tant que le serveur n'a pas la route (lot L7), il répond « introuvable »
    case "introuvable":
      return "🍳 Bientôt dispo : le téléchargement de tes données mijote encore en cuisine.";
    case "trop-de-demandes":
      return "🐢 Deux téléchargements par jour au plus : réessaie un peu plus tard.";
    case "hors-ligne":
      return "📶 Pas de réseau : rien n'est parti. Réessaie dans un instant.";
    default: {
      const message = MESSAGES_SERVICE[resultat];
      return `${message.emoji} ${message.titre} : ${message.texte}`;
    }
  }
}

/**
 * Réglages › Tes données : avec un compte, « Télécharger mes données sociales » (2 fois par jour au plus) et « Décisions de
 * la modération » ; puis ce qui est gardé où, et « Effacer mes données et recommencer ».
 */
export function SectionTesDonnees({ connecte, onEffacer, onAnnoncer }: Props) {
  const router = useRouter();
  const exportSocial = utiliserExportSocial();

  async function telecharger() {
    if (exportSocial.enCours) return;
    onAnnoncer(annoncerExport(await exportSocial.exporter()));
  }

  return (
    <SectionReglages titre="Tes données">
      {exportSocial.disponible ? (
        <>
          <LigneReglage
            emoji="📦"
            titre="Télécharger mes données sociales"
            detail={
              exportSocial.enCours
                ? "On rassemble tout ça…"
                : "Tes potes, tes listes, tes sorties et tes messages, rien que pour toi. Deux fois par jour au plus."
            }
            onPress={() => void telecharger()}
            droite={
              exportSocial.enCours ? (
                <ActivityIndicator color={couleurs.encre} />
              ) : (
                <Ionicons name="download-outline" size={20} color={couleurs.gris} />
              )
            }
          />
          <LigneReglage
            emoji="🛡️"
            titre="Décisions de la modération"
            detail="Ce que l'équipe a décidé sur tes contenus et tes signalements"
            onPress={() => router.push("/reglages/decisions-moderation")}
          />
        </>
      ) : null}
      <View className="flex-row gap-3 py-3">
        <Text accessibilityElementsHidden importantForAccessibility="no" className="text-base leading-5">
          🔒
        </Text>
        <Text className="flex-1 font-texte text-sm leading-5 text-gris">
          {lierPonctuation(
            connecte
              ? "Ton compte et ton profil sont gardés sur notre serveur (ton nom et ta date de naissance y sont chiffrés). Ta photo et ton régime particulier restent sur ce téléphone. Effacer ici ne touche que ce téléphone : pour supprimer ton compte, passe par « Mon compte »."
              : "Tout reste sur ce téléphone : ton profil dans son coffre-fort chiffré, ton activité, ton avatar et tes préférences dans l'app. Rien n'est envoyé à notre serveur pour l'instant. Et quand ton compte arrivera, ta photo et ton régime particulier ne partiront pas sans ton accord.",
          )}
        </Text>
      </View>
      <LigneReglage emoji="🧽" titre="Effacer mes données et recommencer" detail="Profil, avatar, rescousses, lieux gardés… tout repart à zéro" danger onPress={onEffacer} />
    </SectionReglages>
  );
}
