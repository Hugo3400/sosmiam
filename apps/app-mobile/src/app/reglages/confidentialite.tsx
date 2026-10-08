import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Annonce } from "~/composants/interface/Annonce";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { Interrupteur } from "~/composants/interface/Interrupteur";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import { utiliserCompteRequis } from "~/hooks/utiliser-compte-requis";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";
import couleurs from "~/theme/couleurs";

const TEXTE_MINEUR =
  "Entre 15 et 17 ans, ton compte reste privé : c'est la règle, et elle te protège. Tu choisis qui te suit, et seuls les ados de ton âge peuvent te le demander. Tu choisiras à tes 18 ans 🎂";
const ANNONCE_PRIVE = "🔒 Ton compte est privé. Tes abonnés restent ; les prochains devront frapper à la porte.";
const ANNONCE_PUBLIC = "🔓 Ton compte est public : tout le monde peut te suivre sans demander.";
const ANNONCE_VERROUILLE = "Entre 15 et 17 ans, ton compte reste privé : c'est la règle.";

/** « 1 demande en attente sera acceptée », « 3 demandes en attente seront acceptées » */
const decrireDemandes = (nombre: number) =>
  nombre > 1 ? `Les ${nombre} demandes en attente seront acceptées.` : "La demande en attente sera acceptée.";

/**
 * Réglages > Compte privé : en privé, chaque nouvel abonné doit te demander, et ceux qui ne te suivent pas ne voient que ton
 * en-tête. Passer en privé garde tes abonnés ; repasser en public accepte les demandes en attente (après confirmation).
 * Entre 15 et 17 ans, l'interrupteur ne bouge pas : le compte reste privé.
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
    const { resultat, acceptees } = suivis.changerConfidentialite("public");
    if (resultat === "verrouille") return ANNONCE_VERROUILLE;
    if (acceptees === 0) return ANNONCE_PUBLIC;
    return `🔓 Ton compte est public. ${acceptees > 1 ? `${acceptees} demandes acceptées` : "1 demande acceptée"} : bienvenue à tes nouveaux abonnés !`;
  }

  function changer(prive: boolean) {
    if (!exigerCompte("suivre")) return;
    if (prive) {
      const { resultat } = suivis.changerConfidentialite("prive");
      annoncer(resultat === "verrouille" ? ANNONCE_VERROUILLE : ANNONCE_PRIVE);
      return;
    }
    if (suivis.confidentialiteVerrouillee) return annoncer(ANNONCE_VERROUILLE);
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
              desactive={suivis.confidentialiteVerrouillee}
              onChanger={changer}
            />

            {suivis.confidentialiteVerrouillee ? (
              <View className="flex-row gap-3 rounded-carte border-2 border-encre bg-jaune-clair p-4">
                <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-xl">
                  🛡️
                </Text>
                <Text accessibilityLabel={retirerEmoji(TEXTE_MINEUR)} className="flex-1 font-texte text-sm leading-5 text-encre">
                  {lierPonctuation(TEXTE_MINEUR)}
                </Text>
              </View>
            ) : null}

            <View className="gap-3">
              <Text className="font-texte text-sm leading-5 text-gris">
                {lierPonctuation(
                  "En privé, ceux qui ne te suivent pas voient seulement ton avatar, ton prénom, ton @pseudo et tes compteurs. Tes abonnés voient tout, et ta bande aussi, si vous vous êtes ajoutés en vrai (lien ou QR code).",
                )}
              </Text>
              {suivis.confidentialiteVerrouillee ? null : (
                <Text className="font-texte text-sm leading-5 text-gris">
                  {lierPonctuation("Passer en privé ne met personne dehors : tes abonnés restent. Et si tu repasses en public, les demandes en attente seront acceptées.")}
                </Text>
              )}
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
