import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { PRECISIONS_BADGES } from "~/contenus/precisions-badges";

export const PRECISIONS_BADGES_ANGLAIS: Traduction<typeof PRECISIONS_BADGES> = {
  "coeur-sur-la-main": { possible: true, texte: "A place that's sent out an SOS has tables to fill: get your visit confirmed during its SOS and the Brigade will thank you!" },
  "bonne-etoile": { possible: true, texte: "An SOS here, an SOS there: get a visit confirmed at 3 different places during their SOS. They won't forget it!" },
  vigie: { possible: true, texte: "A place stays brand new for 30 days after it joins: be the first to give it a rescue!" },
  "deniche-par-toi": { possible: true, texte: "It all happens on ambassadeur.sosmiam.fr: suggest your favourite place!" },
  fondateur: { possible: true, texte: "Founding spots are up for grabs on ambassadeur.sosmiam.fr." },
  iode: { possible: false, texte: "It'll arrive once the app knows what's on your plate. The oysters can wait!" },
  bande: { possible: false, texte: "Get-togethers with friends are here, but we can't count group visits yet. Keep your crew on standby – it's coming soon!" },
};
