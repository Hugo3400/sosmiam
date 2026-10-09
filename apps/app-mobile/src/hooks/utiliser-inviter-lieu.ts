import { useCallback } from "react";
import { Share } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { utiliserCompteRequis } from "~/hooks/utiliser-compte-requis";

const ADRESSE_INSCRIPTION_LIEU = "https://sosmiam.fr/inscrire-mon-lieu";

/**
 * Renvoie de quoi inviter un lieu non vérifié à rejoindre SOS Miam : la feuille de partage du téléphone, avec un petit mot
 * et le lien d'inscription (gratuite). Partager demande un compte (visite sans compte : la feuille « Crée ton compte »).
 */
export function utiliserInviterLieu(): (lieu: Pick<Lieu, "nom">) => void {
  const exigerCompte = utiliserCompteRequis();
  return useCallback(
    (lieu) => {
      if (!exigerCompte("partager")) return;
      const message = `Coucou ${lieu.nom} ! Je t'ai trouvé sur SOS Miam, l'app qui fait découvrir les lieux indépendants près de chez soi. Inscris ton lieu, c'est gratuit, et tes clients pourront valider leurs visites chez toi : ${ADRESSE_INSCRIPTION_LIEU}`;
      Share.share({ message }).catch(() => {});
    },
    [exigerCompte],
  );
}
