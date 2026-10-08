import { useCallback, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Annonce } from "~/composants/interface/Annonce";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { LigneReglage } from "~/composants/reglages/LigneReglage";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { SectionRolesDemo } from "~/composants/reglages/SectionRolesDemo";
import { SectionSimulationDemo } from "~/composants/reglages/SectionSimulationDemo";
import { BandeauDemoVisites } from "~/composants/scan/BandeauDemoVisites";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserOutilsDemo } from "~/hooks/utiliser-services";
import couleurs from "~/theme/couleurs";

/**
 * Réglages > Coulisses de la démo (en développement seulement) : les rôles joués (équipe de Chez Nonna Lia, ambassadeur),
 * la simulation (vraie position, lieux qui répondent seuls, avis en accéléré, pépin) et la remise à zéro.
 * Dans une version publiée, il n'y a pas de démo : l'écran le dit, sans rien proposer.
 */
export default function CoulissesDemo() {
  const marges = useSafeAreaInsets();
  const outilsDemo = utiliserOutilsDemo();
  const [feuilleZero, setFeuilleZero] = useState(false);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const annoncer = useCallback((texte: string) => setAnnonce({ texte, numero: Date.now() }), []);
  // Le message à dire une fois la feuille refermée (plus tôt, VoiceOver le couperait en revenant sur la ligne)
  const annonceEnAttente = useRef<string | null>(null);

  if (!outilsDemo) {
    return (
      <EcranReglage titre="Coulisses de la démo" sousTitre="Pas de coulisses ici : la démo des visites n'existe que sur les téléphones de l'équipe, en développement.">
        <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation("Tes vraies visites arriveront avec les comptes. Promis, on garde les confettis pour ce jour-là.")}</Text>
      </EcranReglage>
    );
  }

  async function remettreAZero() {
    try {
      await outilsDemo?.remettreAZero();
      annonceEnAttente.current = "🧽 Démo remise à zéro : Chez Nonna Lia t'attend avec ta carte à 4 tampons.";
    } catch {
      annonceEnAttente.current = "Oups, la démo n'a pas pu repartir à zéro. Réessaie dans un instant.";
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: couleurs.creme }}>
      <EcranReglage titre="Coulisses de la démo" sousTitre="Joue le lieu, l'ambassadeur et les pépins. Tout reste sur ce téléphone, rien ne compte pour de vrai.">
        <View className="mb-8">
          <BandeauDemoVisites />
        </View>

        <SectionRolesDemo onAnnoncer={annoncer} />
        <SectionSimulationDemo onAnnoncer={annoncer} />

        <SectionReglages titre="Tout recommencer">
          <LigneReglage
            emoji="🧽"
            titre="Remettre la démo à zéro"
            detail="Visites, cartes, réservations et avis de démo repartent comme au premier jour"
            danger
            onPress={() => setFeuilleZero(true)}
          />
        </SectionReglages>
      </EcranReglage>

      <FeuilleConfirmation
        visible={feuilleZero}
        emoji="🧽"
        titre="Remettre la démo à zéro ?"
        detail="Tes visites, tes tampons, tes réservations et tes avis de démo s'effacent, et les exemples reviennent comme au premier jour. Tes rôles et tes réglages de simulation ne bougent pas."
        libelleConfirmer="Remettre à zéro"
        libelleRester="Finalement non"
        indiceRester="La démo reste comme elle est"
        onConfirmer={() => {
          annonceEnAttente.current = null;
          void remettreAZero();
        }}
        onRefermee={() => {
          // La remise à zéro est très courte ; si elle n'a pas encore répondu, on annonce le résultat attendu
          annoncer(annonceEnAttente.current ?? "🧽 Démo remise à zéro.");
          annonceEnAttente.current = null;
        }}
        onFermer={() => setFeuilleZero(false)}
      />

      <Annonce annonce={annonce} haut={marges.top + 60} onFin={finAnnonce} />
    </View>
  );
}
