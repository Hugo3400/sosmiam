import { DELAI_MIN_RAPPEL_SORTIE_MINUTES, RAPPEL_SORTIE_MINUTES_AVANT } from "../../../../packages/commun/src/regles/potes.ts";
import { choisirGagnantSondage } from "../fonctions/social/choisir-gagnant-sondage.ts";
import { dechiffrerLieuSondage } from "../fonctions/social/dechiffrer-lieu-sondage.ts";
import { ecrirePushRappelSortie } from "../fonctions/social/ecrire-push-rappel-sortie.ts";
import { ecrirePushSondageClos } from "../fonctions/social/ecrire-push-sondage-clos.ts";
import { ecrireTexteSondageClos } from "../fonctions/social/ecrire-texte-sondage-clos.ts";
import type { MessagePush } from "./notifications/expedier-push.ts";
import type { EffetSocial, SortePush } from "./effets-sociaux-regles.ts";
import { exigerChiffrement, lireTitre } from "./messagerie-lecture.ts";
import type { BilanTachesMessagerie, ContexteMessagerie, LigneMembre, TablesMessagerie } from "./messagerie-regles.ts";
import { ecrireMessageSysteme } from "./messagerie-systeme.ts";

export const SONDAGES_PAR_PASSAGE = 100;
export const RAPPELS_PAR_PASSAGE = 100;
export const TEXTE_RAPPEL_SORTIE = "Rappel : c'est dans 1 h ! Bon appétit la bande.";
const MINUTE_MS = 60_000;

type Annonce = { membres: LigneMembre[]; pour: ReadonlySet<number> | null; push: MessagePush; sorte: SortePush };

export function creerTachesMessagerie(c: ContexteMessagerie) {
  const lire = c.depot.lire;

  async function annoncer(a: Annonce | null): Promise<EffetSocial[]> {
    if (!a) return [];
    const candidats = a.membres.filter((m) => !m.coupee && (!a.pour || a.pour.has(m.compteId))).map((m) => m.compteId);
    if (candidats.length === 0) return [];
    const veulent = await c.relations.lirePushSocial(candidats);
    return candidats.filter((id) => veulent.has(id)).map((compteId): EffetSocial => ({ quoi: "push", compteId, message: a.push, sorte: a.sorte }));
  }

  async function clore(t: TablesMessagerie, s: { messageId: number; conversationId: number }, maintenant: Date): Promise<Annonce | null | "rien"> {
    const chiffrement = exigerChiffrement(c);
    if (!(await t.verrouillerConversation(s.conversationId))) return "rien";
    const sondage = (await t.lireSondages([s.messageId])).get(s.messageId);
    const message = await t.lireMessage(s.messageId);
    if (!sondage || !message || sondage.closLe !== null || sondage.finLe.getTime() > maintenant.getTime()) return "rien";
    const gagnant = choisirGagnantSondage(sondage.options.map((o) => o.ordre), sondage.votes);
    if (!(await t.cloreSondage(s.messageId, gagnant?.ordre ?? null, maintenant))) return "rien";
    if (message.supprimeLe || message.suspenduLe || message.retireLe) return null;
    const option = gagnant ? sondage.options.find((o) => o.ordre === gagnant.ordre) : undefined;
    const lieuId = option ? dechiffrerLieuSondage(chiffrement, option.lieuChiffre, { conversationId: message.conversationId, idClient: message.idClient, ordre: option.ordre }) : null;
    const nom = lieuId === null ? null : ((await t.lireNomsLieux([lieuId])).get(lieuId) ?? null);
    const texte = ecrireTexteSondageClos(gagnant ? { nom, ordre: gagnant.ordre, voix: gagnant.voix, votants: sondage.votes.length } : null);
    if (!(await ecrireMessageSysteme(t, chiffrement, { conversationId: s.conversationId, systeme: "sondage-clos", texte, maintenant }))) return null;
    const conversation = (await t.lireConversations([s.conversationId])).get(s.conversationId);
    return {
      membres: await t.lireMembres([s.conversationId]),
      pour: null,
      push: ecrirePushSondageClos({ conversationId: s.conversationId, titre: conversation ? lireTitre(chiffrement, conversation) : null }),
      sorte: "sondage-clos",
    };
  }

  async function rappeler(t: TablesMessagerie, sortieId: number, maintenant: Date): Promise<Annonce | null | "rien"> {
    const jusqua = new Date(maintenant.getTime() + RAPPEL_SORTIE_MINUTES_AVANT * MINUTE_MS);
    const sortie = await t.prendreRappelSortie(sortieId, maintenant, jusqua, maintenant);
    if (!sortie) return "rien";
    if (sortie.quand.getTime() - sortie.creeLe.getTime() < DELAI_MIN_RAPPEL_SORTIE_MINUTES * MINUTE_MS) return null;
    if (!(await ecrireMessageSysteme(t, exigerChiffrement(c), { conversationId: sortie.conversationId, systeme: "rappel-sortie", texte: TEXTE_RAPPEL_SORTIE, maintenant }))) return null;
    return {
      membres: await t.lireMembres([sortie.conversationId]),
      pour: new Set(await t.lireParticipantsSortie(sortie.id)),
      push: ecrirePushRappelSortie({ sortieId: sortie.id, conversationId: sortie.conversationId, titre: sortie.titre }),
      sorte: "rappel-sortie",
    };
  }

  async function passer<T>(lignes: readonly T[], geste: (t: TablesMessagerie, ligne: T) => Promise<Annonce | null | "rien">) {
    const bilan = { faites: 0, echecs: 0, effets: [] as EffetSocial[] };
    for (const ligne of lignes) {
      try {
        const annonce = await c.depot.ecrire((t) => geste(t, ligne));
        if (annonce === "rien") continue;
        bilan.faites += 1;
        bilan.effets.push(...(await annoncer(annonce)));
      } catch {
        bilan.echecs += 1;
      }
    }
    return bilan;
  }

  return {
    async passerTaches(maintenant: Date): Promise<BilanTachesMessagerie> {
      const jusqua = new Date(maintenant.getTime() + RAPPEL_SORTIE_MINUTES_AVANT * MINUTE_MS);
      const [echus, aRappeler] = await Promise.all([
        lire.listerSondagesEchus(maintenant, SONDAGES_PAR_PASSAGE),
        lire.listerSortiesARappeler(maintenant, jusqua, RAPPELS_PAR_PASSAGE),
      ]);
      const sondages = await passer(echus, (t, s) => clore(t, s, maintenant));
      const rappels = await passer(aRappeler, (t, id) => rappeler(t, id, maintenant));
      return { sondages: sondages.faites, rappels: rappels.faites, echecs: sondages.echecs + rappels.echecs, effets: [...sondages.effets, ...rappels.effets] };
    },
  };
}
