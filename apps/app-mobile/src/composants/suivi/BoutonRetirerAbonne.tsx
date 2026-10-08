import { useRef, useState } from "react";
import { Pressable, Text } from "react-native";

import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCompteRequis } from "~/hooks/utiliser-compte-requis";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";

type Props = {
  /** Identifiant de l'abonné à retirer */
  id: string;
  prenom: string;
  /**
   * L'abonné est retiré et la feuille s'est refermée : la ligne peut afficher « Ne te suit plus » et ôter ce bouton
   * (plus tôt, la feuille disparaîtrait d'un coup, sans se refermer).
   */
  onRetire: () => void;
  onAnnoncer: (texte: string) => void;
};

// Deux appuis plus rapprochés que ça comptent pour un seul : un double toucher n'ouvre pas deux fois la feuille
const DELAI_ANTI_DOUBLE_APPUI = 700;

/** La feuille de confirmation : pas encore ouverte (donc pas encore préparée), ouverte, ou refermée */
type EtatFeuille = "jamais" | "ouverte" | "fermee";

/**
 * « Retirer », à droite d'un de tes abonnés : une feuille demande confirmation, puis il ne te suit plus, sans que personne
 * ne le prévienne. Il pourra te suivre à nouveau (ou devra te refaire une demande si ton compte est privé).
 */
export function BoutonRetirerAbonne({ id, prenom, onRetire, onAnnoncer }: Props) {
  const { retirerAbonne, comptePrive } = utiliserSuivisPersonnes();
  const exiger = utiliserCompteRequis();
  const [feuille, setFeuille] = useState<EtatFeuille>("jamais");
  const dernierAppui = useRef(0);

  function toucher() {
    const maintenant = Date.now();
    if (maintenant - dernierAppui.current < DELAI_ANTI_DOUBLE_APPUI) return;
    dernierAppui.current = maintenant;
    vibrerLegerement();
    if (!exiger("suivre")) return;
    setFeuille("ouverte");
  }

  // Annoncé une fois la feuille refermée : VoiceOver, revenu sur la ligne, ne coupe pas l'annonce
  function finir() {
    onRetire();
    onAnnoncer(`${prenom} ne te suit plus. En toute discrétion 🤫`);
  }

  const suite = comptePrive ? `${prenom} devra te refaire une demande pour te suivre.` : `${prenom} pourra te suivre à nouveau.`;

  return (
    <>
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
