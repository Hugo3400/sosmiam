import { useCallback } from "react";
import { Share } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { TEXTES_INVITER_LIEU_PAR_LANGUE } from "~/contenus/textes-inviter-lieu";
import { utiliserCompteRequis } from "~/hooks/utiliser-compte-requis";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const ADRESSE_INSCRIPTION_LIEU = "https://sosmiam.fr/inscrire-mon-lieu";

/**
 * Renvoie de quoi inviter un lieu non vérifié à rejoindre SOS Miam : la feuille de partage du téléphone, avec un petit mot
 * et le lien d'inscription (gratuite). Partager demande un compte (visite sans compte : la feuille « Crée ton compte »).
 */
export function utiliserInviterLieu(): (lieu: Pick<Lieu, "nom">) => void {
  const exigerCompte = utiliserCompteRequis();
  const T = utiliserTextes(TEXTES_INVITER_LIEU_PAR_LANGUE);
  return useCallback(
    (lieu) => {
      if (!exigerCompte("partager")) return;
      const message = T.message(lieu.nom, ADRESSE_INSCRIPTION_LIEU);
      Share.share({ message }).catch(() => {});
    },
    [exigerCompte, T],
  );
}
