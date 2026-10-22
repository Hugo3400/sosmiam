import type { ConversationApi } from "../../../../packages/commun/src/types/messagerie.ts";
import { exigerChiffrement, type AccesConversation, type LectureMessagerie } from "./messagerie-lecture.ts";
import type { MediasMessagerie } from "./messagerie-medias.ts";
import type { ContexteMessagerie, RefusPhotoGroupe } from "./messagerie-regles.ts";

const refus = <E extends string>(erreur: E) => ({ ok: false as const, erreur });

type IssuePhoto = { refus: RefusPhotoGroupe } | { ancienne: string | null };

export function creerPhotoGroupe(c: ContexteMessagerie, lecture: LectureMessagerie, quotas: Pick<MediasMessagerie, "verifierQuotas" | "noterEnvoi">) {
  async function lireAccesAdmin(moi: number, conversationId: number): Promise<{ acces: AccesConversation } | { refus: RefusPhotoGroupe }> {
    const acces = await lecture.lireAcces(moi, conversationId);
    if (!acces || acces.conversation.type === "prive") return { refus: "conversation-inconnue" };
    if (acces.conversation.type === "sortie") return { refus: "geree-par-la-sortie" };
    if (!(await lecture.estAdmin(moi, acces.membres))) return { refus: "reserve-aux-admins" };
    return { acces };
  }

  return {
    async verifierPhotoGroupe(moi: number, conversationId: number, taille: number, maintenant: Date): Promise<"ok" | RefusPhotoGroupe> {
      exigerChiffrement(c);
      const g = await lireAccesAdmin(moi, conversationId);
      if ("refus" in g) return g.refus;
      return quotas.verifierQuotas(c.depot.lire, moi, taille, maintenant);
    },

    async changerPhotoGroupe(moi: number, conversationId: number, octets: Buffer | null, maintenant: Date): Promise<
      { ok: true; conversation: ConversationApi } | { ok: false; erreur: RefusPhotoGroupe }> {
      const chiffrement = exigerChiffrement(c);
      const g = await lireAccesAdmin(moi, conversationId);
      if ("refus" in g) return refus(g.refus);
      const ecrit: { fichier: string | null } = { fichier: null };
      let issue: IssuePhoto;
      try {
        issue = await c.depot.ecrire(async (t): Promise<IssuePhoto> => {
          if (octets) await t.verrouillerComptes([moi]);
          if (!(await t.verrouillerConversation(conversationId))) return { refus: "conversation-inconnue" };
          const membres = await t.lireMembres([conversationId]);
          if (!membres.some((m) => m.compteId === moi)) return { refus: "conversation-inconnue" };
          if (!(await lecture.estAdmin(moi, membres))) return { refus: "reserve-aux-admins" };
          const ancienne = (await t.lireConversations([conversationId])).get(conversationId)?.photo ?? null;
          if (!octets && ancienne === null) return { ancienne: null };
          let fichier: string | null = null;
          if (octets) {
            const verdict = await quotas.verifierQuotas(t, moi, octets.length, maintenant);
            if (verdict !== "ok") return { refus: verdict };
            fichier = c.medias.tirerNom();
            await c.medias.ecrire(fichier, chiffrement.chiffrerOctets(octets, fichier));
            ecrit.fichier = fichier;
          }
          await t.ecrireGroupe(conversationId, { photo: fichier });
          await t.toucherConversation(conversationId, maintenant, false);
          return { ancienne };
        });
      } catch (erreur) {
        if (ecrit.fichier) await c.medias.supprimer([ecrit.fichier]).catch(() => 0);
        throw erreur;
      }
      if ("refus" in issue) {
        if (ecrit.fichier) await c.medias.supprimer([ecrit.fichier]).catch(() => 0);
        return refus(issue.refus);
      }
      if (octets && ecrit.fichier) quotas.noterEnvoi(moi, octets.length, maintenant);
      if (issue.ancienne) await c.depot.supprimerFichiers([issue.ancienne]);
      const conversation = await lecture.presenterUne(moi, conversationId, maintenant);
      return conversation ? { ok: true, conversation } : refus("conversation-inconnue");
    },

    async lirePhotoGroupe(moi: number, conversationId: number): Promise<{ octets: Buffer } | "absente" | null> {
      const chiffrement = exigerChiffrement(c);
      const acces = await lecture.lireAcces(moi, conversationId);
      if (!acces) return null;
      const fichier = acces.conversation.type === "groupe" ? acces.conversation.photo : null;
      if (!fichier) return "absente";
      const chiffre = await c.medias.lire(fichier);
      if (!chiffre) return "absente";
      try {
        return { octets: chiffrement.dechiffrerOctets(chiffre, fichier) };
      } catch {
        console.error("Messagerie : la photo d'un groupe ne se déchiffre pas (clé changée ou fichier abîmé) ; rendue comme absente.");
        return "absente";
      }
    },
  };
}
