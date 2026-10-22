import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Annonce } from "~/composants/interface/Annonce";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { Interrupteur } from "~/composants/interface/Interrupteur";
import { BlocTaBande } from "~/composants/reglages/BlocTaBande";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCompteRequis } from "~/hooks/utiliser-compte-requis";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";

const ANNONCE_PRIVE = "🔒 Ton compte est privé. Tes abonnés restent ; les prochains devront frapper à la porte.";
const ANNONCE_PUBLIC = "🔓 Ton compte est public : tout le monde peut te suivre sans demander.";
const ANNONCE_RATEE = "Ça n'a pas marché cette fois : ton compte n'a pas changé. Réessaie dans un instant.";

/** « 1 demande en attente sera acceptée », « 3 demandes en attente seront acceptées » */
const decrireDemandes = (nombre: number) =>
  nombre > 1 ? `Les ${nombre} demandes en attente seront acceptées.` : "La demande en attente sera acceptée.";

/**
 * Réglages > Compte privé (« Confidentialité » avec un compte) : en privé, chaque nouvel abonné doit te demander, et ceux qui
 * ne te suivent pas ne voient que ton en-tête. Passer en privé garde tes abonnés ; repasser en public accepte les demandes
 * en attente (après confirmation). Avec un compte, en plus, le bloc « Ta bande » : qui te trouve et ce que voit ta bande.
 */
export default function ReglagesConfidentialite() {
  const couleurs = utiliserCouleurs();
  const marges = useSafeAreaInsets();
  const suivis = utiliserSuivisPersonnes();
  const exigerCompte = utiliserCompteRequis();
  const [feuillePublic, setFeuillePublic] = useState(false);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  // Le message à dire une fois la feuille refermée (plus tôt, VoiceOver le couperait en revenant sur l'interrupteur)
  const annonceEnAttente = useRef<string | null>(null);
  // La feuille est déjà refermée quand la réponse arrive (compte connecté) : on l'annonce tout de suite
  const feuilleRefermee = useRef(true);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const annoncer = useCallback((texte: string) => setAnnonce({ texte, numero: Date.now() }), []);

  const nombreDemandes = suivis.demandesRecues.length;
  const avecTaBande = suivis.source === "compte";

  async function passerEnPublic(): Promise<string> {
    const fait = await suivis.changerConfidentialite("public");
    if (!fait) return ANNONCE_RATEE;
    const { acceptees } = fait;
    if (acceptees === 0) return ANNONCE_PUBLIC;
    return `🔓 Ton compte est public. ${acceptees > 1 ? `${acceptees} demandes acceptées` : "1 demande acceptée"} : bienvenue à tes nouveaux abonnés !`;
  }

  function changer(prive: boolean) {
    if (!exigerCompte("suivre")) return;
    if (prive) {
      void suivis.changerConfidentialite("prive").then((fait) => annoncer(fait ? ANNONCE_PRIVE : ANNONCE_RATEE));
      return;
    }
    // Des gens attendent à la porte : on confirme avant de tous les faire entrer
    if (nombreDemandes > 0) return setFeuillePublic(true);
    void passerEnPublic().then(annoncer);
  }

  return (
    <View style={{ flex: 1, backgroundColor: couleurs.creme }}>
      <EcranReglage
        titre={avecTaBande ? "Confidentialité" : "Compte privé"}
        sousTitre={avecTaBande ? "Qui peut te suivre, qui peut te trouver, et ce que voit ta bande." : "Qui peut te suivre, et ce que voient ceux qui ne te suivent pas."}
      >
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
                  suivis.source === "compte"
                    ? "En privé, ceux qui ne te suivent pas voient seulement ton avatar, ton prénom, ton @pseudo et tes compteurs. Tes abonnés voient tes listes et tes badges, et ta bande voit tout."
                    : "En privé, ceux qui ne te suivent pas voient seulement ton avatar, ton prénom, ton @pseudo et tes compteurs. Tes abonnés voient tout, et ta bande aussi, si vous vous êtes ajoutés en vrai (lien ou QR code).",
                )}
              </Text>
              <Text className="font-texte text-sm leading-5 text-gris">
                {lierPonctuation("Passer en privé ne met personne dehors : tes abonnés restent. Et si tu repasses en public, les demandes en attente seront acceptées.")}
              </Text>
            </View>

            <BlocTaBande onAnnoncer={annoncer} />
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
          feuilleRefermee.current = false;
          void passerEnPublic().then((texte) => {
            if (feuilleRefermee.current) annoncer(texte);
            else annonceEnAttente.current = texte;
          });
        }}
        onRefermee={() => {
          feuilleRefermee.current = true;
          if (annonceEnAttente.current) annoncer(annonceEnAttente.current);
          annonceEnAttente.current = null;
        }}
        onFermer={() => setFeuillePublic(false)}
      />

      <Annonce annonce={annonce} haut={marges.top + 60} onFin={finAnnonce} />
    </View>
  );
}
