// Photos et notes vocales du chat, écrites une fois pour la base et pour les tests (voir messagerie-regles.ts). Le contrôleur
// a déjà reconnu le fichier et retiré ses métadonnées (controleurs/conversations-medias.ts). Ici : quotas comptés SOUS LE
// VERROU DU COMPTE (50 par 24 h, 1 Go gardé par compte, 20 Go par 24 h pour tout le serveur, 15 % de disque libre : B.12),
// fichier CHIFFRÉ sur le disque sous un nom tiré au hasard, effacé 90 jours après l'envoi (« Ce média a expiré »). Un fichier
// écrit dont le message n'a pas été enregistré (refus, envoi rejoué en même temps, panne) est supprimé tout de suite ; sinon
// le ménage de nuit le retire comme orphelin. Lecture : seulement un membre qui voit le message (B.0), en clair, jamais en
// cache ; « expire » pour un média supprimé, suspendu ou retiré, même si son fichier est gardé pour la modération.
import { DUREE_MEDIAS_CHAT_JOURS } from "../../../../packages/commun/src/regles/chat.ts";
import { creerJournalEnvoisMedias } from "./journal-envois-medias.ts";
import { exigerChiffrement, type LectureMessagerie } from "./messagerie-lecture.ts";
import { relireEnvoi, type IssueEnvoi, type MessagesMessagerie } from "./messagerie-messages.ts";
import type { ContexteMessagerie, MediaRecu, RefusEnvoi, ResultatEnvoi, TablesMessagerie } from "./messagerie-regles.ts";
import { verifierQuotasMediasChat, type CompteursMediasChat } from "./stockage-medias-chat.ts";

const JOUR_MS = 24 * 60 * 60 * 1000;

export function creerMediasMessagerie(c: ContexteMessagerie, lecture: LectureMessagerie, messages: Pick<MessagesMessagerie, "terminerEnvoi">) {
  const journal = creerJournalEnvoisMedias();

  async function lireCompteurs(t: TablesMessagerie, moi: number, maintenant: Date): Promise<CompteursMediasChat> {
    const base = await t.compterMedias(moi, new Date(maintenant.getTime() - JOUR_MS));
    const recents = journal.lire(moi, maintenant);
    return {
      envoisCompte24h: Math.max(base.envoisCompte24h, recents.envoisCompte24h),
      octetsCompte: Math.max(base.octetsCompte, recents.octetsCompte24h),
      octetsServeur24h: Math.max(base.octetsServeur24h, recents.octetsServeur24h),
      partLibre: await c.medias.lirePartLibre(),
    };
  }

  return {
    async verifierEnvoiMedia(moi: number, conversationId: number, idClient: string, taille: number, maintenant: Date): Promise<"ok" | RefusEnvoi> {
      exigerChiffrement(c);
      const acces = await lecture.lireAcces(moi, conversationId);
      if (!acces) return "conversation-inconnue";
      const deja = relireEnvoi(moi, await c.depot.lire.lireMessageParIdClient(conversationId, idClient));
      if (deja) return "refus" in deja ? deja.refus : "ok";
      if (!(await lecture.estOuverte(c.depot.lire, moi, acces))) return "conversation-fermee";
      return verifierQuotasMediasChat(taille, await lireCompteurs(c.depot.lire, moi, maintenant));
    },

    async envoyerMedia(moi: number, conversationId: number, media: MediaRecu, maintenant: Date): Promise<ResultatEnvoi> {
      const chiffrement = exigerChiffrement(c);
      const acces = await lecture.lireAcces(moi, conversationId);
      if (!acces) return { ok: false, erreur: "conversation-inconnue" };
      // Le fichier écrit pendant la transaction (relu après elle)
      const ecrit: { fichier: string | null } = { fichier: null };
      let issue: IssueEnvoi;
      try {
        issue = await c.depot.ecrire(async (t): Promise<IssueEnvoi> => {
          // Le verrou du compte d'abord (FOR NO KEY UPDATE, puis la conversation) : deux envois en même temps ne dépassent
          // jamais ses quotas, et un texte ou une réaction écrits au même moment dans cette conversation ne l'attendent pas
          await t.verrouillerComptes([moi]);
          if (!(await t.verrouillerConversation(conversationId))) return { refus: "conversation-inconnue" };
          const deja = relireEnvoi(moi, await t.lireMessageParIdClient(conversationId, media.idClient));
          if (deja) return deja;
          if (!(await lecture.estOuverte(t, moi, acces))) return { refus: "conversation-fermee" };
          const verdict = verifierQuotasMediasChat(media.octets.length, await lireCompteurs(t, moi, maintenant));
          if (verdict !== "ok") return { refus: verdict };
          const fichier = c.medias.tirerNom();
          await c.medias.ecrire(fichier, chiffrement.chiffrerOctets(media.octets, fichier));
          ecrit.fichier = fichier;
          const version = await t.toucherConversation(conversationId, maintenant, true);
          if (version === null) return { refus: "conversation-inconnue" };
          const message = await t.insererMessage({
            conversationId, auteurId: moi, type: media.type, idClient: media.idClient, texteChiffre: null, fichier,
            typeMime: media.type === "photo" ? "image/jpeg" : "audio/mp4",
            taille: media.octets.length,
            largeur: media.type === "photo" ? media.largeur : null,
            hauteur: media.type === "photo" ? media.hauteur : null,
            dureeSecondes: media.type === "vocal" ? media.dureeSecondes : null,
            mediaExpireLe: new Date(maintenant.getTime() + DUREE_MEDIAS_CHAT_JOURS * JOUR_MS),
            creeLe: maintenant, supprimeLe: null, suspenduLe: null, retireLe: null,
          });
          if (!message) return relireEnvoi(moi, await t.lireMessageParIdClient(conversationId, media.idClient)) ?? { refus: "conversation-inconnue" };
          return { message, version, membres: await t.lireMembres([conversationId]) };
        });
      } catch (erreur) {
        if (ecrit.fichier) await c.medias.supprimer([ecrit.fichier]).catch(() => 0);
        throw erreur;
      }
      const garde = ecrit.fichier !== null && "message" in issue && issue.message.fichier === ecrit.fichier;
      if (garde) journal.noter(moi, media.octets.length, maintenant);
      // Écrit, mais pas gardé (refus, ou l'autre envoi avec le même idClient a gagné) : il part tout de suite
      if (ecrit.fichier && !garde) await c.medias.supprimer([ecrit.fichier]).catch(() => 0);
      return messages.terminerEnvoi(moi, acces, issue, maintenant);
    },

    async lireMedia(moi: number, conversationId: number, messageId: number, maintenant: Date): Promise<{ octets: Buffer; typeMime: string } | "expire" | null> {
      const chiffrement = exigerChiffrement(c);
      const visible = await lecture.lireMessageVisible(moi, conversationId, messageId);
      const m = visible?.message;
      if (!m || (m.type !== "photo" && m.type !== "vocal")) return null;
      if (m.supprimeLe || m.suspenduLe || m.retireLe || !m.fichier || !m.typeMime || !m.mediaExpireLe || m.mediaExpireLe.getTime() <= maintenant.getTime()) return "expire";
      const chiffre = await c.medias.lire(m.fichier);
      if (!chiffre) return "expire";
      try {
        return { octets: chiffrement.dechiffrerOctets(chiffre, m.fichier), typeMime: m.typeMime };
      } catch {
        console.error("Messagerie : un média ne se déchiffre pas (clé changée ou fichier abîmé) ; rendu comme expiré.");
        return "expire";
      }
    },
  };
}
