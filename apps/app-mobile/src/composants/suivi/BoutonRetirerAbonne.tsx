import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { peutSuivre } from "@sos-miam/commun/regles/peut-suivre";
import { ID_MOI } from "@sos-miam/commun/regles/potes";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { SANS_RETOUR_AGE } from "~/contenus/sans-retour-age";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { construireCibleSuivi } from "~/fonctions/suivi/construire-cible-suivi";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserCompteRequis } from "~/hooks/utiliser-compte-requis";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";

type Props = {
  /** Identifiant de l'abonné à retirer */
  id: string;
  prenom: string;
  /**
   * Facultatif : l'abonné est retiré et la feuille s'est refermée. Le bouton, lui, reste en place et devient « Retiré »
   * (VoiceOver s'y pose : il ne perd pas sa place dans la liste).
   */
  onRetire?: () => void;
  onAnnoncer: (texte: string) => void;
};

// Deux appuis plus rapprochés que ça comptent pour un seul : un double toucher n'ouvre pas deux fois la feuille
const DELAI_ANTI_DOUBLE_APPUI = 700;
// Le temps que « Retiré » remplace le bouton avant d'y poser VoiceOver
const DELAI_FOCUS = 250;

/** La feuille de confirmation : pas encore ouverte (donc pas encore préparée), ouverte, ou refermée */
type EtatFeuille = "jamais" | "ouverte" | "fermee";

/**
 * « Retirer », à droite d'un de tes abonnés : une feuille demande confirmation, puis il ne te suit plus, sans que personne
 * ne le prévienne, et le bouton devient « Retiré ». Il pourra te suivre à nouveau (ou devra te refaire une demande si ton
 * compte est privé) ; sauf si la règle d'âge ne le permet plus (un abonné de 15-17 ans gardé à tes 18 ans) : c'est sans retour.
 */
export function BoutonRetirerAbonne({ id, prenom, onRetire, onAnnoncer }: Props) {
  const { retirerAbonne, comptePrive } = utiliserSuivisPersonnes();
  const { trouverPote, moiMineur } = utiliserCommunaute();
  const exiger = utiliserCompteRequis();
  const [feuille, setFeuille] = useState<EtatFeuille>("jamais");
  const [retire, setRetire] = useState(false);
  const dernierAppui = useRef(0);
  const texteRetire = useRef<View>(null);

  useEffect(() => {
    if (!retire) return;
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(texteRetire.current), DELAI_FOCUS);
    return () => clearTimeout(minuterie);
  }, [retire]);

  function toucher() {
    const maintenant = Date.now();
    if (maintenant - dernierAppui.current < DELAI_ANTI_DOUBLE_APPUI) return;
    dernierAppui.current = maintenant;
    vibrerLegerement();
    if (!exiger("suivre")) return;
    setFeuille("ouverte");
  }

  // Une fois la feuille refermée : « Retiré » prend la place du bouton (sans couper la sortie de la feuille), puis l'annonce
  function finir() {
    setRetire(true);
    onRetire?.();
    onAnnoncer(`${prenom} ne te suit plus. En toute discrétion 🤫`);
  }

  // Pourrait-il te suivre de nouveau ? (lui → toi : la règle d'âge, revérifiée comme pour une nouvelle demande)
  const pote = trouverPote(id);
  const retour = pote ? peutSuivre(construireCibleSuivi(pote), { id: ID_MOI, mineur: moiMineur, prive: comptePrive, createur: false }, { bloque: false }) : null;
  const suite =
    retour && !retour.permis && retour.raison === "age"
      ? SANS_RETOUR_AGE
      : comptePrive
        ? `${prenom} devra te refaire une demande pour te suivre.`
        : `${prenom} pourra te suivre à nouveau.`;

  return (
    <>
      {retire ? (
        <View ref={texteRetire} accessible accessibilityLabel="Retiré de tes abonnés" className="h-9 min-w-24 items-center justify-center px-3">
          <Text className="font-texte-semi text-[13px] text-gris">Retiré</Text>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          // Commence par le mot affiché : Commande vocale trouve le bouton (« Toucher Retirer »)
          accessibilityLabel={`Retirer ${prenom} de tes abonnés`}
          accessibilityHint="Ouvre une confirmation. On ne prévient personne."
          // 36 pt de haut à l'écran, 48 pt sous le doigt
          hitSlop={6}
          onPress={toucher}
          className="h-9 min-w-24 flex-row items-center justify-center rounded-full border-2 border-encre bg-white px-3 active:opacity-70"
        >
          <Text className="font-texte-gras text-[13px] text-encre">Retirer</Text>
        </Pressable>
      )}
      {/* Préparée seulement au premier toucher : rien de plus à dessiner pour chaque ligne de la liste */}
      {feuille === "jamais" ? null : (
        <FeuilleConfirmation
          visible={feuille === "ouverte"}
          emoji="🤫"
          titre={`Retirer ${prenom} de tes abonnés ?`}
          detail={`On ne prévient pas ${prenom} (promis, on ne cafte pas). ${suite}`}
          libelleConfirmer="Retirer"
          libelleRester="Finalement non"
          indiceRester={`${prenom} reste dans tes abonnés`}
          onConfirmer={() => retirerAbonne(id)}
          onRefermee={finir}
          onFermer={() => setFeuille("fermee")}
        />
      )}
    </>
  );
}
