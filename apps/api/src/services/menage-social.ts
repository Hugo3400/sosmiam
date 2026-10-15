// Ménage de nuit de la partie sociale de l'app (spécification sociale E.1), lancé par taches/taches-de-nuit.ts AVANT la
// sauvegarde : ce qui a passé sa durée de garde ne part pas dans la copie de la nuit. Dans l'ordre : médias du chat (90 jours
// après l'envoi), conversations d'un an sans message, conversations vides, demandes et invitations en attente, cloche,
// éléments masqués, contenus retirés depuis plus d'un an, fichiers orphelins, puis le rechiffrement pendant un changement de
// clé. Chaque étape a sa propre protection : une étape qui échoue n'empêche pas les suivantes (son nom va dans le bilan, le
// journal du serveur ne garde que le nom et le code de l'erreur). Le bilan ne contient que des nombres, jamais un contenu.
// Les signalements jugés depuis plus d'un an (étape 7 bis de la spécification) sont effacés par la session Logiciel
// (effacerSignalementsAnciens, services/gestion/moderation-sociale.ts), pas ici.
import { calculerSeuilsMenageSocial } from "../fonctions/social/calculer-seuils-menage-social.ts";
import { resumerErreur } from "../fonctions/comptes/resumer-erreur.ts";
import type { ChiffrementDonnees } from "./chiffrement-donnees.ts";
import {
  effacerClocheAncienne, effacerContenusRetires, effacerConversationsAnciennes, effacerConversationsVides, effacerDemandesExpirees,
  effacerFichiersOrphelins, effacerMasquesAnciens, effacerMediasExpires, type BaseMenage, type BilanDemandesSociales,
} from "./menage-social-etapes.ts";
import { rechiffrerSocial, type BilanRechiffrementSocial, type OptionsRechiffrementSocial } from "./rechiffrement-social.ts";
import type { StockageMediasChat } from "./stockage-medias-chat.ts";

export type BilanMenageSocial = BilanDemandesSociales & {
  /** Photos et notes vocales effacées (90 jours après l'envoi) */
  medias: number;
  /** Conversations effacées (1 an sans message), discussions des sorties comprises, et sorties parties avec */
  conversations: number;
  sorties: number;
  /** Conversations sans plus aucun membre */
  conversationsVides: number;
  /** Notifications de la cloche (90 jours, ou au-delà de 200 par compte ; 6 mois pour celles de la modération) */
  cloche: number;
  /** Éléments retirés de sa vue depuis plus de 13 mois */
  masques: number;
  /** Contenus retirés par la modération depuis plus d'un an (message vidé, commentaire effacé ou vidé, liste effacée) */
  contenusRetires: number;
  /** Commentaires « supprimés » qui n'ont plus ni réponse ni signalement ouvert */
  commentairesSupprimes: number;
  /** Fichiers du dossier des médias que la base ne connaît plus (plus de 24 h) */
  fichiersOrphelins: number;
  /** Changement de clé des données : chiffrés réécrits, illisibles, restants ; null hors changement de clé */
  rechiffrement: BilanRechiffrementSocial | null;
  /** Les étapes qui ont échoué (leur nom seulement) ; les autres ont été faites */
  etapesRatees: string[];
};

export type OptionsMenageSocial = {
  medias: StockageMediasChat;
  /** La clé des données (chiffrement de demarrer.ts, brancherRechiffrementDeNuit) : sert seulement au rechiffrement, pendant
   *  un changement de clé (versionsAnciennes non vide) ; null ou sans ancienne clé : pas d'étape 9 */
  chiffrement: ChiffrementDonnees | null;
  maintenant?: Date;
  /** La connexion de l'API par défaut (un essai passe la sienne) */
  base?: BaseMenage;
  rechiffrement?: OptionsRechiffrementSocial;
};

/** Le ménage social de la nuit, étapes 1 à 9 dans l'ordre (E.1) ; rend le nombre de lignes effacées par catégorie */
export async function faireLeMenageSocial(o: OptionsMenageSocial): Promise<BilanMenageSocial> {
  const base = o.base ?? (await import("../base-de-donnees/connexion.ts")).baseDeDonnees;
  const maintenant = o.maintenant ?? new Date();
  const seuils = calculerSeuilsMenageSocial(maintenant);
  const { medias } = o;
  const bilan: BilanMenageSocial = {
    medias: 0, conversations: 0, sorties: 0, conversationsVides: 0, demandesBande: 0, demandesSuivi: 0, invitationsSorties: 0,
    invitationsGroupes: 0, invitationsCoAuteurs: 0, departsGroupes: 0, clesIdempotence: 0, cloche: 0, masques: 0, contenusRetires: 0,
    commentairesSupprimes: 0, fichiersOrphelins: 0, rechiffrement: null, etapesRatees: [],
  };
  const etape = async (nom: string, faire: () => Promise<void>) => {
    try {
      await faire();
    } catch (erreur) {
      bilan.etapesRatees.push(nom);
      console.error(`Ménage social, étape « ${nom} » impossible :`, resumerErreur(erreur));
    }
  };

  await etape("médias", async () => void (bilan.medias = await effacerMediasExpires(base, seuils, medias)));
  await etape("conversations", async () => {
    const r = await effacerConversationsAnciennes(base, seuils, medias);
    bilan.conversations = r.conversations;
    bilan.sorties = r.sorties;
  });
  await etape("conversations vides", async () => void (bilan.conversationsVides = await effacerConversationsVides(base, medias)));
  await etape("demandes", async () => void Object.assign(bilan, await effacerDemandesExpirees(base, seuils)));
  await etape("cloche", async () => void (bilan.cloche = await effacerClocheAncienne(base, seuils)));
  await etape("masques", async () => void (bilan.masques = await effacerMasquesAnciens(base, seuils)));
  await etape("contenus retirés", async () => void Object.assign(bilan, await effacerContenusRetires(base, seuils, medias, maintenant)));
  await etape("fichiers orphelins", async () => void (bilan.fichiersOrphelins = await effacerFichiersOrphelins(base, seuils, medias)));
  await etape("rechiffrement", async () => void (bilan.rechiffrement = await rechiffrerSocial(o.chiffrement, medias, base, o.rechiffrement)));
  return bilan;
}
