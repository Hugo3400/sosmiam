import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Annonce } from "~/composants/interface/Annonce";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { Interrupteur } from "~/composants/interface/Interrupteur";
import { BlocTaBande } from "~/composants/reglages/BlocTaBande";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { TEXTES_REGLAGES_CONFIDENTIALITE_PAR_LANGUE } from "~/contenus/textes-reglages-confidentialite";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCompteRequis } from "~/hooks/utiliser-compte-requis";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * Réglages > Compte privé (« Confidentialité » avec un compte) : en privé, chaque nouvel abonné doit te demander, et ceux qui
 * ne te suivent pas ne voient que ton en-tête. Passer en privé garde tes abonnés ; repasser en public accepte les demandes
 * en attente (après confirmation). Avec un compte, en plus, le bloc « Ta bande » : qui te trouve et ce que voit ta bande.
 */
export default function ReglagesConfidentialite() {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_REGLAGES_CONFIDENTIALITE_PAR_LANGUE);
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
    if (!fait) return T.annonceRatee;
    const { acceptees } = fait;
    if (acceptees === 0) return T.annoncePublic;
    return T.publicAvecDemandes(acceptees);
  }

  function changer(prive: boolean) {
    if (!exigerCompte("suivre")) return;
    if (prive) {
      void suivis.changerConfidentialite("prive").then((fait) => annoncer(fait ? T.annoncePrive : T.annonceRatee));
      return;
    }
    // Des gens attendent à la porte : on confirme avant de tous les faire entrer
    if (nombreDemandes > 0) return setFeuillePublic(true);
    void passerEnPublic().then(annoncer);
  }

  return (
    <View style={{ flex: 1, backgroundColor: couleurs.creme }}>
      <EcranReglage
        titre={avecTaBande ? T.titreAvecBande : T.titreSansBande}
        sousTitre={avecTaBande ? T.sousTitreAvecBande : T.sousTitreSansBande}
      >
        {!suivis.pret ? (
          <View className="mt-4 items-center">
            <ActivityIndicator color={couleurs.encre} accessibilityLabel={T.chargement} />
          </View>
        ) : (
          <View className="gap-6">
            <Interrupteur
              emoji="🔒"
              titre={T.comptePrive}
              detail={T.comptePriveDetail}
              valeur={suivis.comptePrive}
              onChanger={changer}
            />

            <View className="gap-3">
              <Text className="font-texte text-sm leading-5 text-gris">
                {lierPonctuation(suivis.source === "compte" ? T.explicationCompte : T.explicationTelephone)}
              </Text>
              <Text className="font-texte text-sm leading-5 text-gris">
                {lierPonctuation(T.passerPrive)}
              </Text>
            </View>

            <BlocTaBande onAnnoncer={annoncer} />
          </View>
        )}
      </EcranReglage>

      <FeuilleConfirmation
        visible={feuillePublic}
        emoji="🔓"
        titre={T.feuilleTitre}
        detail={T.feuilleDetail(T.demandes(nombreDemandes))}
        libelleConfirmer={T.passerPublic}
        libelleRester={T.resterPrive}
        indiceRester={T.resterPriveIndice}
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
