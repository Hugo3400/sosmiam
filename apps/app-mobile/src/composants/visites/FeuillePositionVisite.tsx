import { useEffect, useRef, useState } from "react";

import { RAYON_VALIDATION_M } from "@sos-miam/commun/regles/visites";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { TEXTES_DEMANDE_ADDITION_PAR_LANGUE } from "~/contenus/textes-demande-addition";
import { direChezLieuLangue } from "~/fonctions/langue/dire-chez-lieu-langue";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  visible: boolean;
  /** Le lieu où l'on vérifie que tu es (« Chez Nonna Lia ») ; null quand on ne le connaît pas encore (« Tu es chez qui ? ») */
  lieuNom: string | null;
  /**
   * « OK, vérifie » : appelé une fois la feuille refermée, pour qu'on puisse lire la position (la demande d'accès du téléphone)
   * puis ouvrir l'écran suivant sans buter sur une feuille encore en train de descendre.
   */
  onAccepter: () => void;
  /** « Pas maintenant », fond assombri, retour Android ou geste d'échappement de VoiceOver : rien n'est lu */
  onRefuser: () => void;
};

/**
 * « Petite vérif' de position » : avant la toute première lecture de la position pour une visite, on dit pourquoi
 * (vérifier que tu es sur place, une seule fois, rien n'est gardé). Feuille qui monte du bas, comme les autres confirmations.
 */
export function FeuillePositionVisite({ visible, lieuNom, onAccepter, onRefuser }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_DEMANDE_ADDITION_PAR_LANGUE);
  // « OK, vérifie » touché : la feuille descend d'elle-même, et onAccepter part quand elle a fini
  const [acceptee, setAcceptee] = useState(false);
  const accepteeMaintenant = useRef(false);

  // Feuille fermée par l'écran : prête pour la prochaine fois
  useEffect(() => {
    if (visible) return;
    accepteeMaintenant.current = false;
    setAcceptee(false);
  }, [visible]);

  const ou = lieuNom ? direChezLieuLangue(lieuNom, langue) : T.positionSurPlace;
  const detail = T.positionDetail(ou, RAYON_VALIDATION_M);
  return (
    <FeuilleConfirmation
      visible={visible && !acceptee}
      emoji="📍"
      titre={T.positionTitre}
      detail={detail}
      libelleConfirmer={T.positionConfirmer}
      libelleRester={T.positionRester}
      indiceRester={T.positionResterIndice}
      onConfirmer={() => {
        accepteeMaintenant.current = true;
        setAcceptee(true);
      }}
      onRefermee={onAccepter}
      onFermer={() => {
        // Appelé aussi juste après « OK, vérifie » : ce n'est pas un refus
        if (!accepteeMaintenant.current) onRefuser();
      }}
    />
  );
}
