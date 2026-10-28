import { MESSAGES_SERVICE_PAR_LANGUE } from "@sos-miam/commun/contenus/messages-services";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { EtatMiamis } from "~/composants/miamis/EtatMiamis";
import { TEXTES_ACCES_MIAMIS_PAR_LANGUE } from "~/contenus/textes-miamis";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  erreur: ErreurService;
  onReessayer: () => void;
};

export function ErreurMiamis({ erreur, onReessayer }: Props) {
  const T = utiliserTextes(TEXTES_ACCES_MIAMIS_PAR_LANGUE);
  const messagesService = utiliserTextes(MESSAGES_SERVICE_PAR_LANGUE);
  const message = erreur === "introuvable" ? T.bientot : messagesService[erreur];
  return <EtatMiamis emoji={message.emoji} titre={message.titre} texte={message.texte} action={{ libelle: T.reessayer, onPress: onReessayer }} />;
}
