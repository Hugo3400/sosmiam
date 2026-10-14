import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Annonce } from "~/composants/interface/Annonce";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { Interrupteur } from "~/composants/interface/Interrupteur";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCompteRequis } from "~/hooks/utiliser-compte-requis";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";
import couleurs from "~/theme/couleurs";

const ANNONCE_PRIVE = "🔒 Ton compte est privé. Tes abonnés restent ; les prochains devront frapper à la porte.";
const ANNONCE_PUBLIC = "🔓 Ton compte est public : tout le monde peut te suivre sans demander.";

/** « 1 demande en attente sera acceptée », « 3 demandes en attente seront acceptées » */
const decrireDemandes = (nombre: number) =>
  nombre > 1 ? `Les ${nombre} demandes en attente seront acceptées.` : "La demande en attente sera acceptée.";

/**
 * Réglages > Compte privé : en privé, chaque nouvel abonné doit te demander, et ceux qui ne te suivent pas ne voient que ton
 * en-tête. Passer en privé garde tes abonnés ; repasser en public accepte les demandes en attente (après confirmation).
 */
export default function ReglagesConfidentialite() {
  const marges = useSafeAreaInsets();
  const suivis = utiliserSuivisPersonnes();
  const exigerCompte = utiliserCompteRequis();
  const [feuillePublic, setFeuillePublic] = useState(false);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  // Le message à dire une fois la feuille refermée (plus tôt, VoiceOver le couperait en revenant sur l'interrupteur)
  const annonceEnAttente = useRef<string | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const annoncer = useCallback((texte: string) => setAnnonce({ texte, numero: Date.now() }), []);

  const nombreDemandes = suivis.demandesRecues.length;

  function passerEnPublic(): string {
    const { acceptees } = suivis.changerConfidentialite("public");
    if (acceptees === 0) return ANNONCE_PUBLIC;
    return `🔓 Ton compte est public. ${acceptees > 1 ? `${acceptees} demandes acceptées` : "1 demande acceptée"} : bienvenue à tes nouveaux abonnés !`;
  }

  function changer(prive: boolean) {
    if (!exigerCompte("suivre")) return;
    if (prive) {
      suivis.changerConfidentialite("prive");
      annoncer(ANNONCE_PRIVE);
      return;
    }
    // Des gens attendent à la porte : on confirme avant de tous les faire entrer
    if (nombreDemandes > 0) return setFeuillePublic(true);
    annoncer(passerEnPublic());
  }

  return (
    <View style={{ flex: 1, backgroundColor: couleurs.creme }}>
      <EcranReglage titre="Compte privé" sousTitre="Qui peut te suivre, et ce que voient ceux qui ne te suivent pas.">
        {!suivis.pret ? (
          <View className="mt-4 items-center">
            <ActivityIndicator color={couleurs.encre} accessibilityLabel="Chargement de tes réglages" />
          </View>
        ) : (
          <View className="gap-6">
            <Interrupteur
              emoji="🔒"
              titre="Compte privé"
              detail="Chaque nouvel abonné devra te demander"
              valeur={suivis.comptePrive}
              onChanger={changer}
            />

            <View className="gap-3">
              <Text className="font-texte text-sm leading-5 text-gris">
                {lierPonctuation(
                  "En privé, ceux qui ne te suivent pas voient seulement ton avatar, ton prénom, ton @pseudo et tes compteurs. Tes abonnés voient tout, et ta bande aussi, si vous vous êtes ajoutés en vrai (lien ou QR code).",
                )}
              </Text>
              <Text className="font-texte text-sm leading-5 text-gris">
                {lierPonctuation("Passer en privé ne met personne dehors : tes abonnés restent. Et si tu repasses en public, les demandes en attente seront acceptées.")}
              </Text>
            </View>
          </View>
        )}
      </EcranReglage>

      <FeuilleConfirmation
        visible={feuillePublic}
        emoji="🔓"
        titre="Passer ton compte en public ?"
        detail={`Tout le monde pourra te suivre sans demander. ${decrireDemandes(nombreDemandes)}`}
        libelleConfirmer="Passer en public"
        libelleRester="Je reste en privé"
        indiceRester="Ton compte reste privé, les demandes attendent"
        onConfirmer={() => {
          if (!exigerCompte("suivre")) return;
          annonceEnAttente.current = passerEnPublic();
        }}
        onRefermee={() => {
          if (annonceEnAttente.current) annoncer(annonceEnAttente.current);
          annonceEnAttente.current = null;
        }}
        onFermer={() => setFeuillePublic(false)}
      />

      <Annonce annonce={annonce} haut={marges.top + 60} onFin={finAnnonce} />
    </View>
  );
}
