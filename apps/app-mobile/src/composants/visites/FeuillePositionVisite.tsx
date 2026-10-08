import { useEffect, useRef, useState } from "react";

import { RAYON_VALIDATION_M } from "@sos-miam/commun/regles/visites";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { direChezLieu } from "~/fonctions/visites/dire-chez-lieu";

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
  // « OK, vérifie » touché : la feuille descend d'elle-même, et onAccepter part quand elle a fini
  const [acceptee, setAcceptee] = useState(false);
  const accepteeMaintenant = useRef(false);

  // Feuille fermée par l'écran : prête pour la prochaine fois
  useEffect(() => {
    if (visible) return;
    accepteeMaintenant.current = false;
    setAcceptee(false);
  }, [visible]);

  const ou = lieuNom ? direChezLieu(lieuNom) : "sur place";
  const detail = `Pour que ta visite compte, on vérifie que tu es bien ${ou} (à ${RAYON_VALIDATION_M} m près). Ta position sert à ça, une seule fois, et on ne la garde pas.`;
  return (
    <FeuilleConfirmation
      visible={visible && !acceptee}
      emoji="📍"
      titre="Petite vérif' de position"
      detail={detail}
      libelleConfirmer="OK, vérifie"
      libelleRester="Pas maintenant"
      indiceRester="Ta position n'est pas lue, et ta visite n'est pas demandée"
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
