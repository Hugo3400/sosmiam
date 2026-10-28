import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_INVITER_LIEU_ANGLAIS } from "~/contenus/anglais/textes-inviter-lieu";

export const TEXTES_INVITER_LIEU = {
  message: (nom: string, adresse: string) =>
    `Coucou ${nom} ! Je t'ai trouvé sur SOS Miam, l'app qui fait découvrir les lieux indépendants près de chez soi. Inscris ton lieu, c'est gratuit, et tes clients pourront valider leurs visites chez toi : ${adresse}`,
};

export const TEXTES_INVITER_LIEU_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_INVITER_LIEU>> = { fr: TEXTES_INVITER_LIEU, en: TEXTES_INVITER_LIEU_ANGLAIS };
