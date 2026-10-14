// Les dépendances de la partie sociale EN MÉMOIRE, pour les tests (aucune base) : chaque domaine est posé sur les MÊMES
// tables (tables-sociales-en-memoire.ts) et voit ce que les autres écrivent. Une clé des données de test est tirée au hasard
// (jamais la vraie) ; `chiffrement: null` simule l'API sans clé (routes 🔐 en 503). Les notifications sur le téléphone sont
// notées dans `pushs`, les contestations dans `contestations`. Un domaine par ligne, à la fin (lots L3 à L7).
import { randomBytes, randomInt } from "node:crypto";

import type { DependancesSocialApp } from "../routes/social-app.ts";
import { creerChiffrementDonnees, type ChiffrementDonnees } from "./chiffrement-donnees.ts";
import { creerChiffrementSocial } from "./chiffrement-social.ts";
import { creerClocheEnMemoire } from "./cloche-en-memoire.ts";
import type { MessagePush } from "./notifications/expedier-push.ts";
import { creerRelationsSocialesEnMemoire } from "./relations-sociales-en-memoire.ts";
import { creerSocialEnMemoire } from "./social-en-memoire.ts";
import { creerStockageMediasChatEnMemoire } from "./stockage-medias-chat.ts";
import { creerTablesSocialesEnMemoire, type CompteSocialEnMemoire } from "./tables-sociales-en-memoire.ts";
import { creerBandeEnMemoire } from "./bande-en-memoire.ts";
import { creerSuivisPersonnesEnMemoire } from "./suivis-personnes-en-memoire.ts";
import { creerSortiesEnMemoire } from "./sorties-en-memoire.ts";
import { creerListesEnMemoire } from "./listes-en-memoire.ts";
import { creerCommentairesEnMemoire } from "./commentaires-en-memoire.ts";
import { creerDecisionsModerationAppEnMemoire, creerSignalementsSociauxEnMemoire } from "./signalements-sociaux-en-memoire.ts";
import { creerMessagerie } from "./messagerie.ts";
import { creerDepotMessagerieEnMemoire } from "./messagerie-en-memoire.ts";

export type OptionsSocialAppEnMemoire = {
  /** Absent : une clé de test tirée au hasard ; null : pas de clé (routes 🔐 en 503 chiffrement-indisponible) */
  chiffrement?: ChiffrementDonnees | null;
  tirer?: (max: number) => number;
  lireRole?: DependancesSocialApp["lireRole"];
  /** La Map des comptes à partager (celle de creerComptesEnMemoire) */
  comptes?: Map<number, CompteSocialEnMemoire>;
  /** Part libre du disque des médias (0 à 1, 0,5 par défaut) */
  partLibre?: number;
  horloge?: () => number;
  /** Pour essayer une notification qui échoue */
  prevenirCompte?: DependancesSocialApp["prevenirCompte"];
};

export function creerSocialAppEnMemoire(o: OptionsSocialAppEnMemoire = {}) {
  const tables = creerTablesSocialesEnMemoire(o.comptes);
  const tirer = o.tirer ?? ((max: number) => randomInt(max));
  const pushs: { compteId: number; message: MessagePush }[] = [];
  const contestations: { id: number; texte: string; maintenant: Date }[] = [];
  const medias = creerStockageMediasChatEnMemoire({ partLibre: o.partLibre ?? 0.5, horloge: o.horloge });
  const relations = creerRelationsSocialesEnMemoire(tables);
  const cloche = creerClocheEnMemoire(tables, relations);
  const chiffrement = creerChiffrementSocial(o.chiffrement === undefined ? creerChiffrementDonnees(randomBytes(32)) : o.chiffrement);

  const dependances: DependancesSocialApp = {
    chiffrement,
    medias,
    relations,
    cloche,
    prevenirCompte: o.prevenirCompte ?? (async (compteId, message) => void pushs.push({ compteId, message })),
    contesterSignalement: async (id, texte, maintenant) => {
      const signalement = tables.signalements.get(id);
      if (!signalement || (signalement.statut !== "retenu" && signalement.statut !== "rejete")) return false;
      Object.assign(signalement, { contestation: texte, contesteLe: maintenant, reexamineLe: null });
      contestations.push({ id, texte, maintenant });
      return true;
    },
    lireRole: o.lireRole ?? (async () => null),
    social: creerSocialEnMemoire(tables, relations, tirer),
    // Un domaine par ligne, à la fin (lots L3 à L7)
    bande: creerBandeEnMemoire(tables, relations, chiffrement, tirer),
    suivis: creerSuivisPersonnesEnMemoire(tables, relations, creerSocialEnMemoire(tables, relations, tirer)),
    sorties: creerSortiesEnMemoire(tables, relations, medias),
    listes: creerListesEnMemoire(tables, relations),
    commentaires: creerCommentairesEnMemoire(tables, {
      relations, social: creerSocialEnMemoire(tables, relations, tirer), lireRole: (c, l) => dependances.lireRole(c, l), chiffrement,
    }),
    signalements: creerSignalementsSociauxEnMemoire(tables, relations, chiffrement),
    decisions: creerDecisionsModerationAppEnMemoire(tables, (id, texte, maintenant) => dependances.contesterSignalement(id, texte, maintenant)),
    messagerie: creerMessagerie({ depot: creerDepotMessagerieEnMemoire(tables, relations, medias), relations, chiffrement, medias }),
  };
  return { dependances, tables, pushs, contestations, medias };
}
