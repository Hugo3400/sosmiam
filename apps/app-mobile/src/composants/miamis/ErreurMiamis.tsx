import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { EtatMiamis } from "~/composants/miamis/EtatMiamis";
import { TEXTES_ACCES_MIAMIS } from "~/contenus/textes-miamis";

type Props = {
  erreur: ErreurService;
  onReessayer: () => void;
};

export function ErreurMiamis({ erreur, onReessayer }: Props) {
  const message = erreur === "introuvable" ? TEXTES_ACCES_MIAMIS.bientot : MESSAGES_SERVICE[erreur];
  return <EtatMiamis emoji={message.emoji} titre={message.titre} texte={message.texte} action={{ libelle: TEXTES_ACCES_MIAMIS.reessayer, onPress: onReessayer }} />;
}
