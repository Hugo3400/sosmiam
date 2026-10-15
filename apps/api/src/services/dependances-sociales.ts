// Les dépendances de la partie sociale de l'app, version Prisma (spécification sociale D.1), créées une fois par
// demarrer.ts. Le chiffrement social est tiré de l'objet `chiffrement` de la session Site (sous-clés HKDF, version de clé
// dans chaque chiffré) ; sans clé des données, il vaut null et les routes 🔐 répondent 503. Un domaine par ligne, à la fin
// (lots L3 à L7), avec ce qu'il lui faut du socle (relations, cloche, chiffrement, médias, tirer).
import type { DependancesSocialApp } from "../routes/social-app.ts";
import type { ChiffrementDonnees } from "./chiffrement-donnees.ts";
import { creerChiffrementSocial } from "./chiffrement-social.ts";
import { creerCloche } from "./cloche.ts";
import { creerRelationsSociales } from "./relations-sociales.ts";
import { creerSocial } from "./social.ts";
import { creerStockageMediasChat, DOSSIER_MEDIAS_CHAT } from "./stockage-medias-chat.ts";
import { creerBande } from "./bande.ts";
import { creerSuivisPersonnes } from "./suivis-personnes.ts";
import { creerMessagerie } from "./messagerie.ts";
import { creerDepotMessagerie } from "./messagerie-tables.ts";
import { creerSorties } from "./sorties.ts";
import { creerListes } from "./listes.ts";
import { creerCommentaires } from "./commentaires.ts";
import { creerDecisionsModerationApp } from "./decisions-moderation-app.ts";
import { creerSignalementsSociaux } from "./signalements-sociaux.ts";
import { creerExportSocial } from "./export-social.ts";
import { creerCommunaute } from "./communaute.ts";
import { creerDepotCommunaute } from "./communaute-tables.ts";

export type OptionsDependancesSociales = {
  /** La clé des données (chargerChiffrementDonnees) ; null : pas de clé */
  chiffrement: ChiffrementDonnees | null;
  prevenirCompte: DependancesSocialApp["prevenirCompte"];
  contesterSignalement: DependancesSocialApp["contesterSignalement"];
  lireRole: DependancesSocialApp["lireRole"];
  /** Un entier de 0 à max − 1, tiré au hasard (randomInt de node:crypto) : identifiants publics, codes d'invitation */
  tirer: (max: number) => number;
  /** Dossier des photos et notes vocales chiffrées ; par défaut DOSSIER_MEDIAS_CHAT */
  dossierMediasChat?: string;
  /** Le disque des médias passe sous 15 % libres (une fois par heure au plus) : une ligne au journal du logiciel (B.12) ;
   *  absente : rien de plus que le 503 stockage-plein */
  quandDisquePresquePlein?: (partLibre: number) => void;
  /** limitations.estLimite (session Site) : un compte limité par l'équipe ne peut plus écrire ce que les autres voient ;
   *  absente : rien n'est refusé */
  estLimite?: DependancesSocialApp["estLimite"];
};

export function creerDependancesSociales(o: OptionsDependancesSociales): DependancesSocialApp {
  const chiffrement = creerChiffrementSocial(o.chiffrement);
  const medias = creerStockageMediasChat(o.dossierMediasChat ?? DOSSIER_MEDIAS_CHAT, { quandDisquePresquePlein: o.quandDisquePresquePlein });
  const relations = creerRelationsSociales();
  const cloche = creerCloche(relations);
  // Sans état : le même service sert aux domaines qui lisent un profil (suivis, commentaires)
  const social = creerSocial({ relations, tirer: o.tirer });
  const communaute = creerCommunaute({ depot: creerDepotCommunaute({ relations, medias }), relations, chiffrementDonnees: o.chiffrement, estLimite: o.estLimite });
  const voitLaSortieMiamis = async (compteId: number, sortieId: number, maintenant: Date) => (await communaute.sorties.lire(compteId, sortieId, maintenant)) !== null;
  return {
    chiffrement,
    medias,
    relations,
    cloche,
    prevenirCompte: o.prevenirCompte,
    contesterSignalement: o.contesterSignalement,
    lireRole: o.lireRole,
    estLimite: o.estLimite,
    social,
    // Un domaine par ligne, à la fin (lots L3 à L7)
    bande: creerBande({ relations, chiffrement, tirer: o.tirer }),
    suivis: creerSuivisPersonnes({ relations, social }),
    messagerie: creerMessagerie({ depot: creerDepotMessagerie({ relations, medias }), relations, chiffrement, medias }),
    sorties: creerSorties({ relations, medias }),
    listes: creerListes({ relations }),
    commentaires: creerCommentaires({ relations, social, lireRole: o.lireRole, chiffrement }),
    signalements: creerSignalementsSociaux({ relations, chiffrement, voitLaSortieMiamis }),
    decisions: creerDecisionsModerationApp({ contesterSignalement: o.contesterSignalement }),
    exportSocial: creerExportSocial({ relations, chiffrement }),
    communaute,
  };
}
