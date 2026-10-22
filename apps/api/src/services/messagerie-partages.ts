import type { PagePartagesApi, TypePartage } from "../../../../packages/commun/src/types/messagerie.ts";
import type { LectureMessagerie } from "./messagerie-lecture.ts";
import { PARTAGES_PAR_PAGE, type ContexteMessagerie } from "./messagerie-regles.ts";

export function creerPartagesMessagerie(c: ContexteMessagerie, lecture: LectureMessagerie) {
  return {
    async listerPartages(moi: number, conversationId: number, type: TypePartage, avant: number | null, maintenant: Date): Promise<PagePartagesApi | null> {
      const acces = await lecture.lireAcces(moi, conversationId);
      if (!acces) return null;
      const [{ caches }, exclus] = await Promise.all([c.relations.listerBlocages(moi), c.depot.lire.lireMessagesSignales(moi)]);
      const lignes = await c.depot.lire.listerPartages(conversationId, type, { apres: acces.membre.visibleApres, caches, exclus }, avant, PARTAGES_PAR_PAGE + 1, maintenant);
      const page = lignes.slice(0, PARTAGES_PAR_PAGE);
      const suite = lignes.length > PARTAGES_PAR_PAGE && page.length > 0 ? String(page[page.length - 1]!.id) : null;
      return { messages: await lecture.presenterMessages(moi, page, caches, maintenant, exclus), suite };
    },
  };
}
