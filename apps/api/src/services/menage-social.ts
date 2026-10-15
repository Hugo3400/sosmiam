// Ménage de nuit de la partie sociale de l'app (spécification sociale E.1), lancé par taches/taches-de-nuit.ts AVANT la
// sauvegarde : ce qui a passé sa durée de garde ne part pas dans la copie de la nuit. Dans l'ordre : médias du chat (90 jours
// après l'envoi), conversations d'un an sans message, conversations vides, demandes et invitations en attente, cloche,
// éléments masqués, contenus retirés depuis plus d'un an, fichiers orphelins, puis le rechiffrement pendant un changement de
// clé. Chaque étape a sa propre protection, et dans une étape chaque paquet et chaque sous-étape (SuiviEtape,
// menage-social-etapes.ts) : ce qui échoue n'empêche pas la suite (le nom de l'étape va dans le bilan, le journal du serveur
// ne garde que le nom et le code de l'erreur), et ce qui est fait reste compté, au bilan au fil des paquets. Le bilan ne
// contient que des nombres, jamais un contenu. Le fichier d'une photo ou d'une note vocale signalée reste sur le disque
// tant qu'un signalement le garde (ouvert, ou jugé depuis moins de 183 jours : décision de Hugo du 15/10/2026).
// Les signalements jugés depuis plus d'un an (étape 7 bis de la spécification) sont effacés par la session Logiciel
// (effacerSignalementsAnciens, services/gestion/moderation-sociale.ts), pas ici.
import { calculerSeuilsMenageSocial } from "../fonctions/social/calculer-seuils-menage-social.ts";
import { resumerErreur } from "../fonctions/comptes/resumer-erreur.ts";
import type { ChiffrementDonnees } from "./chiffrement-donnees.ts";
import {
  effacerClocheAncienne, effacerContenusRetires, effacerConversationsAnciennes, effacerConversationsVides, effacerDemandesExpirees,
  effacerFichiersOrphelins, effacerMasquesAnciens, effacerMediasExpires, type BaseMenage, type CompteursMenageSocial, type SuiviEtape,
} from "./menage-social-etapes.ts";
import { rechiffrerSocial, type BilanRechiffrementSocial, type OptionsRechiffrementSocial } from "./rechiffrement-social.ts";
import type { StockageMediasChat } from "./stockage-medias-chat.ts";

/** Les nombres des étapes 1 à 8 (CompteursMenageSocial, menage-social-etapes.ts), puis le rechiffrement et les échecs */
export type BilanMenageSocial = CompteursMenageSocial & {
  /** Changement de clé des données : chiffrés réécrits, illisibles, restants ; null hors changement de clé, ou si l'étape a
   *  échoué (jamais un décompte partiel, qui pourrait annoncer un faux « 0 restant(s) ») */
  rechiffrement: BilanRechiffrementSocial | null;
  /** Les étapes dont quelque chose a échoué (leur nom seulement, une fois) ; le reste a été fait */
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
  /** `ou` : la table ou la sous-étape (un nom constant) ; jamais le message de l'erreur, qui peut citer un contenu */
  const noterEchec = (nom: string, ou: string | null, erreur: unknown) => {
    if (!bilan.etapesRatees.includes(nom)) bilan.etapesRatees.push(nom);
    console.error(`Ménage social, étape « ${nom} »${ou ? ` (${ou})` : ""} impossible :`, resumerErreur(erreur));
  };
  /** Une étape : ses nombres vont au bilan au fil des paquets (le total qu'elle rend n'est pas relu : déjà compté) */
  const etape = async (nom: string, faire: (suivi: SuiviEtape) => Promise<unknown>) => {
    const suivi: SuiviEtape = {
      ajouter: (compteur, nombre) => void (bilan[compteur] += nombre),
      noterEchec: (ou, erreur) => noterEchec(nom, ou, erreur),
    };
    try {
      await faire(suivi);
    } catch (erreur) {
      noterEchec(nom, null, erreur);
    }
  };

  await etape("médias", (suivi) => effacerMediasExpires(base, seuils, medias, suivi));
  await etape("conversations", (suivi) => effacerConversationsAnciennes(base, seuils, medias, suivi));
  await etape("conversations vides", (suivi) => effacerConversationsVides(base, seuils, medias, suivi));
  await etape("demandes", (suivi) => effacerDemandesExpirees(base, seuils, suivi));
  await etape("cloche", (suivi) => effacerClocheAncienne(base, seuils, suivi));
  await etape("masques", (suivi) => effacerMasquesAnciens(base, seuils, suivi));
  await etape("contenus retirés", (suivi) => effacerContenusRetires(base, seuils, medias, maintenant, suivi));
  await etape("fichiers orphelins", (suivi) => effacerFichiersOrphelins(base, seuils, medias, suivi));
  await etape("rechiffrement", async () => void (bilan.rechiffrement = await rechiffrerSocial(o.chiffrement, medias, base, o.rechiffrement)));
  return bilan;
}
