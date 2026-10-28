import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, Text, View } from "react-native";

import { MESSAGES_SERVICE_PAR_LANGUE } from "@sos-miam/commun/contenus/messages-services";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { LigneReglage } from "~/composants/reglages/LigneReglage";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { TEXTES_PARAMETRES_PAR_LANGUE } from "~/contenus/textes-parametres";
import { TEXTES_REGLAGES_DONNEES_PAR_LANGUE } from "~/contenus/textes-reglages-donnees";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserExportSocial } from "~/hooks/utiliser-export-social";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** Un compte est connecté (le texte sur ce qui est gardé où change) */
  connecte: boolean;
  /** « Effacer mes données et recommencer » touché */
  onEffacer: () => void;
  /** Dit le résultat du téléchargement (petit message en haut de l'écran, lu par VoiceOver) */
  onAnnoncer: (texte: string) => void;
};

/** Ce qu'on dit après « Télécharger mes données sociales » */
function annoncerExport(resultat: "ok" | "indisponible" | ErreurService, langue: Langue): string {
  const T = choisirTextes(TEXTES_REGLAGES_DONNEES_PAR_LANGUE, langue);
  switch (resultat) {
    case "ok":
      return T.exportPret;
    case "indisponible":
      return T.exportIndisponible;
    // Tant que le serveur n'a pas la route (lot L7), il répond « introuvable »
    case "introuvable":
      return T.exportBientot;
    case "trop-de-demandes":
      return T.exportTropDeDemandes;
    case "hors-ligne":
      return T.exportHorsLigne;
    default: {
      const message = choisirTextes(MESSAGES_SERVICE_PAR_LANGUE, langue)[resultat];
      return T.exportErreur(message.emoji, message.titre, message.texte);
    }
  }
}

export function SectionTesDonnees({ connecte, onEffacer, onAnnoncer }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_REGLAGES_DONNEES_PAR_LANGUE);
  const TP = utiliserTextes(TEXTES_PARAMETRES_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const exportSocial = utiliserExportSocial();

  async function telecharger() {
    if (exportSocial.enCours) return;
    onAnnoncer(annoncerExport(await exportSocial.exporter(), langue));
  }

  return (
    <SectionReglages
      titre={TP.donnees.titre}
      section="parametres-donnees"
      resume={exportSocial.disponible ? TP.donnees.resume : TP.donnees.resumeSansExport}
    >
      {exportSocial.disponible ? (
        <LigneReglage
          emoji="📦"
          titre={T.telecharger}
          detail={exportSocial.enCours ? T.telechargerEnCours : T.telechargerDetail}
          onPress={() => void telecharger()}
          droite={
            exportSocial.enCours ? (
              <ActivityIndicator color={couleurs.encre} />
            ) : (
              <Ionicons name="download-outline" size={20} color={couleurs.gris} />
            )
          }
        />
      ) : null}
      <View className="border-b border-ligne py-3">
        <Text className="font-texte text-sm leading-5 text-gris">
          {lierPonctuation(connecte ? T.ouSontElles : T.ouSontEllesSansCompte)}
        </Text>
      </View>
      <LigneReglage emoji="🧽" titre={T.effacer} detail={T.effacerDetail} danger onPress={onEffacer} />
    </SectionReglages>
  );
}
