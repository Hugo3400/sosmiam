import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";

type Props = {
  visible: boolean;
  /** Qui on arrête de suivre : « @lea.mange », le nom du lieu ou le prénom d'une personne */
  nom: string;
  /** Son emoji (🎬 pour un créateur, celui du lieu, l'avatar d'une personne), dans le rond jaune */
  emoji: string;
  /** Ce qui va se passer ; par défaut, le texte des lieux et des créateurs (« Ses publications ne passeront plus en tête de ton fil… ») */
  detail?: string;
  /** « Ne plus suivre » touché : arrête le suivi tout de suite (une seule fois, même sur un double appui). La feuille appelle ensuite onFermer. */
  onConfirmer: () => void;
  /**
   * La feuille a fini de se refermer après « Ne plus suivre » : c'est le moment de l'annoncer. Plus tôt, VoiceOver, qui revient
   * sur le bouton à la fermeture, couperait l'annonce.
   */
  onRefermee: () => void;
  /** « Je reste », fond assombri, retour Android ou geste d'échappement de VoiceOver : on ne touche à rien */
  onFermer: () => void;
};

const DETAIL_PAR_DEFAUT = "Ses publications ne passeront plus en tête de ton fil. Pas de drame, pas de porte qui claque : tu pourras revenir quand tu veux.";

/**
 * Petite feuille qui monte du bas avant d'arrêter de suivre un lieu, un créateur ou une personne (comme Instagram ou TikTok) :
 * on ne désabonne jamais sur un seul toucher. « Ne plus suivre » ou « Je reste » (la feuille générique FeuilleConfirmation).
 */
export function FeuilleNePlusSuivre({ visible, nom, emoji, detail = DETAIL_PAR_DEFAUT, onConfirmer, onRefermee, onFermer }: Props) {
  return (
    <FeuilleConfirmation
      visible={visible}
      emoji={emoji}
      titre={`Ne plus suivre ${nom} ?`}
      detail={detail}
      libelleConfirmer="Ne plus suivre"
      libelleRester="Je reste"
      indiceRester={`Tu continues de suivre ${nom}`}
      onConfirmer={onConfirmer}
      onRefermee={onRefermee}
      onFermer={onFermer}
    />
  );
}
