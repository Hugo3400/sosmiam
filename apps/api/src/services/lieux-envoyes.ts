// « Envoyer à un pote » (spécification sociale B.4), écrit une fois pour la base et pour les tests : envoyer un lieu, c'est
// poster un message « lieu » (le lieu et le petit mot chiffrés ensemble) dans votre discussion privée, créée au besoin, avec le
// même idClient dans chaque discussion (unique par conversation) : rejoué, rien de plus, ni notification. Seulement à des
// potes de ta bande, sans blocage. « Lieux reçus » rassemble ces messages, visibles pour toi (blocages dans les deux sens,
// avant ton « Effacer la discussion pour moi », ceux que tu as retirés de ta vue ou signalés : absents). « Vu » ne recule
// jamais ; pour les lieux envoyés, jamais d'accusé de lecture (vu vaut toujours vrai).
import type { LieuEnvoyeApi, MessageApi } from "../../../../packages/commun/src/types/messagerie.ts";
import type { PersonneResume } from "../../../../packages/commun/src/types/social.ts";
import { calculerClePrive } from "../fonctions/social/calculer-cle-prive.ts";
import { ecrireCurseurDate } from "../fonctions/social/ecrire-curseur-date.ts";
import { lireCurseurDate } from "../fonctions/social/lire-curseur-date.ts";
import type { EffetSocial } from "./effets-sociaux-regles.ts";
import { exigerChiffrement, lireContenu } from "./messagerie-lecture.ts";
import type { MessagesMessagerie } from "./messagerie-messages.ts";
import { LIEUX_ENVOYES_PAR_PAGE, type ContexteMessagerie } from "./messagerie-regles.ts";

/** Trouve (ou crée, seulement entre potes sans blocage) la discussion privée ; null : impossible */
export type AssurerPrive = (moi: number, autre: number, maintenant: Date) => Promise<{ conversationId: number; cree: boolean } | null>;

const refus = <E extends string>(erreur: E) => ({ ok: false as const, erreur });

function presenterLieuEnvoye(m: MessageApi, conversationId: number, de: PersonneResume | null, a: PersonneResume | null, vu: boolean): LieuEnvoyeApi | null {
  if (m.etat !== "visible" || m.lieuId === null) return null;
  return { id: m.id, conversationId: String(conversationId), de, a, lieuId: m.lieuId, mot: m.texte, date: m.date, vu };
}

export function creerLieuxEnvoyes(c: ContexteMessagerie, assurerPrive: AssurerPrive, messages: Pick<MessagesMessagerie, "envoyer">) {
  const lire = c.depot.lire;

  /** Une page de lieux reçus ou envoyés, déchiffrés (un chiffré illisible est sauté) */
  async function lister(moi: number, sens: "recus" | "envoyes", apres: string | null) {
    const chiffrement = exigerChiffrement(c);
    const [{ caches }, exclus, vus] = await Promise.all([c.relations.listerBlocages(moi), lire.lireMessagesSignales(moi), lire.lireLieuxVus(moi)]);
    const lignes = await lire.listerLieuxEnvoyes(moi, sens, { caches, exclus }, lireCurseurDate(apres) ?? null, LIEUX_ENVOYES_PAR_PAGE + 1);
    const page = lignes.slice(0, LIEUX_ENVOYES_PAR_PAGE);
    const dernier = page.at(-1);
    const suite = lignes.length > LIEUX_ENVOYES_PAR_PAGE && dernier ? ecrireCurseurDate(dernier.message.creeLe, dernier.message.id) : null;
    const personnes = await c.relations.presenter([moi, ...page.flatMap(({ message, autreId }) => [message.auteurId ?? 0, autreId ?? 0])]);
    const lieux = page.flatMap(({ message, autreId }): LieuEnvoyeApi[] => {
      const contenu = lireContenu(chiffrement, message);
      if (contenu === "illisible" || contenu.lieuId === null) return [];
      const auteur = message.auteurId === null ? null : (personnes.get(message.auteurId) ?? null);
      const autre = autreId === null ? null : (personnes.get(autreId) ?? null);
      return [{
        id: String(message.id),
        conversationId: String(message.conversationId),
        de: sens === "recus" ? auteur : (personnes.get(moi) ?? null),
        a: sens === "recus" ? (personnes.get(moi) ?? null) : autre,
        lieuId: contenu.lieuId,
        mot: contenu.texte,
        date: message.creeLe.toISOString(),
        vu: sens === "envoyes" || message.id <= vus,
      }];
    });
    return { lieux, suite };
  }

  return {
    /** a : comptes déjà retrouvés par le contrôleur ; ignorés : pas de ta bande, ou un blocage dans un sens ou dans l'autre */
    async envoyerLieu(moi: number, idClient: string, lieuId: number, a: number[], mot: string | null, maintenant: Date) {
      // Un lieu qui n'est plus publié : seul un envoi rejoué passe encore (il retrouve ses messages, sans créer de discussion)
      const publie = await lire.estLieuPublie(lieuId);
      const uniques = [...new Set(a)].filter((id) => id !== moi);
      const liens = await c.relations.lireLiens(moi, uniques);
      const valides = uniques.filter((id) => {
        const lien = liens.get(id);
        return Boolean(lien?.pote && !lien.bloqueParMoi && !lien.mABloque);
      });
      if (valides.length === 0) return refus(publie ? "pas-dans-la-bande" : "lieu-inconnu");
      const personnes = await c.relations.presenter([moi, ...valides]);
      const envoyes: LieuEnvoyeApi[] = [];
      const effets: EffetSocial[] = [];
      const retenus = new Set<number>();
      let nouveaux = 0;
      let lieuRefuse = !publie;
      for (const autre of valides) {
        const conversationId = publie ? (await assurerPrive(moi, autre, maintenant))?.conversationId : (await lire.lireConversationPrivee(calculerClePrive(moi, autre)))?.id;
        if (conversationId === undefined) continue;
        const r = await messages.envoyer(moi, conversationId, { idClient, type: "lieu", lieuId, texte: mot }, maintenant);
        if (!r.ok) {
          if (r.erreur === "lieu-inconnu") lieuRefuse = true;
          continue;
        }
        const lieu = presenterLieuEnvoye(r.message, conversationId, personnes.get(moi) ?? null, personnes.get(autre) ?? null, true);
        if (!lieu) continue;
        retenus.add(autre);
        envoyes.push(lieu);
        effets.push(...r.effets);
        if (!r.rejoue) nouveaux += 1;
      }
      if (envoyes.length === 0) return refus(lieuRefuse ? "lieu-inconnu" : "pas-dans-la-bande");
      return { ok: true as const, envoyes, ignores: [...new Set(a)].filter((id) => !retenus.has(id)), rejoue: nouveaux === 0, effets };
    },

    listerLieuxRecus: (moi: number, apres: string | null) => lister(moi, "recus", apres),
    listerLieuxEnvoyes: (moi: number, apres: string | null) => lister(moi, "envoyes", apres),

    /** Ramené au dernier lieu reçu visible pour moi (au plus `jusqua`) ; ne recule jamais */
    async marquerLieuxVus(moi: number, jusqua: number): Promise<void> {
      const { caches } = await c.relations.listerBlocages(moi);
      const dernier = await lire.lireDernierLieuRecu(moi, jusqua, caches);
      if (dernier !== null) await c.depot.ecrire((t) => t.ecrireLieuxVus(moi, dernier));
    },
  };
}
