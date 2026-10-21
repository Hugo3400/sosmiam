import type {
  CompteCommunaute, DepotCommunaute, LigneParticipationMiamis, LigneSortieMiamis, ProfilCommunauteLu, TablesCommunaute,
} from "./communaute-regles.ts";
import { creerTablesIdeesEnMemoire, type CommentaireEnMemoire, type IdeeEnMemoire } from "./communaute-en-memoire-idees.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";
import type { StockageMediasChat } from "./stockage-medias-chat.ts";
import { effacerConversationsEnMemoire, listerCachesEnMemoire, prendreId, type CompteSocialEnMemoire, type LieuSocialEnMemoire, type TablesSociales } from "./tables-sociales-en-memoire.ts";

export type SortieEnMemoire = Omit<LigneSortieMiamis, "etiquettes"> & { etiquettes: { nom: string; officielle: boolean; retireeLe: Date | null }[] };

export type TablesCommunauteEnMemoire = {
  profils: Map<number, ProfilCommunauteLu>;
  presences: Map<number, { villeCle: string; jusqua: Date }>;
  coucous: { deId: number; aId: number; creeLe: Date }[];
  sorties: Map<number, SortieEnMemoire>;
  participations: LigneParticipationMiamis[];
  idees: Map<number, IdeeEnMemoire>;
  votes: { ideeId: number; compteId: number; creeLe: Date }[];
  commentaires: Map<number, CommentaireEnMemoire>;
  jaimes: { commentaireId: number; compteId: number; creeLe: Date }[];
  visites: { compteId: number; lieuId: number; statut: string; creeLe: Date; valideLe: Date | null }[];
  derniersIds: { sorties: number; idees: number; commentaires: number };
};

type CompteEnPlus = CompteSocialEnMemoire & { dateNaissanceChiffree?: string | null; statutAmbassadeur?: string | null };
type LieuEnPlus = LieuSocialEnMemoire & { ville?: string; emoji?: string; type?: string };

const rattachees = new WeakMap<TablesSociales, TablesCommunauteEnMemoire>();

export function lireTablesCommunauteEnMemoire(social: TablesSociales): TablesCommunauteEnMemoire {
  let tables = rattachees.get(social);
  if (!tables) {
    tables = {
      profils: new Map(), presences: new Map(), coucous: [], sorties: new Map(), participations: [], idees: new Map(), votes: [], commentaires: new Map(), jaimes: [],
      visites: [], derniersIds: { sorties: 0, idees: 0, commentaires: 0 },
    };
    rattachees.set(social, tables);
  }
  return tables;
}

export function oublierCompteCommunauteEnMemoire(social: TablesSociales, id: number): void {
  const t = lireTablesCommunauteEnMemoire(social);
  t.profils.delete(id);
  t.presences.delete(id);
  t.coucous = t.coucous.filter((c) => c.deId !== id && c.aId !== id);
  for (const [sortieId, s] of t.sorties) if (s.organisateurId === id) t.sorties.delete(sortieId);
  t.participations = t.participations.filter((p) => p.compteId !== id && t.sorties.has(p.sortieId));
  for (const idee of t.idees.values()) if (idee.auteurId === id) idee.auteurId = null;
  t.votes = t.votes.filter((v) => v.compteId !== id);
  const partis = new Set([...t.commentaires.values()].filter((c) => c.auteurId === id).map((c) => c.id));
  for (const cid of partis) t.commentaires.delete(cid);
  for (const c of t.commentaires.values()) if (c.reponseAId !== null && partis.has(c.reponseAId)) c.reponseAId = null;
  t.jaimes = t.jaimes.filter((j) => j.compteId !== id && !partis.has(j.commentaireId));
}

const versLigne = (s: SortieEnMemoire): LigneSortieMiamis => ({
  ...s, etiquettes: s.etiquettes.filter((e) => e.retireeLe === null).map(({ nom, officielle }) => ({ nom, officielle })).sort((a, b) => a.nom.localeCompare(b.nom)),
});

export function creerTablesCommunauteEnMemoire(social: TablesSociales, relations: RelationsSociales, medias: Pick<StockageMediasChat, "supprimer">): TablesCommunaute {
  const t = lireTablesCommunauteEnMemoire(social);
  const parQuand = (a: LigneSortieMiamis, b: LigneSortieMiamis) => a.quand.getTime() - b.quand.getTime() || a.id - b.id;
  const choisir = (filtre: (s: SortieEnMemoire) => boolean, nombre?: number) => [...t.sorties.values()].filter(filtre).map(versLigne).sort(parQuand).slice(0, nombre);
  const enCours = (s: SortieEnMemoire) => s.annuleeLe === null && s.retireeLe === null;
  const toucher = (sortieId: number) => {
    const s = t.sorties.get(sortieId);
    if (s) s.version += 1;
  };
  const toucherConversation = (id: number, maintenant: Date) => {
    const c = social.conversations.get(id);
    if (c) Object.assign(c, { version: c.version + 1, modifieLe: maintenant });
  };

  return {
    ...creerTablesIdeesEnMemoire(t),
    async verrouillerComptes() {},
    async verrouillerSortie(id) {
      const s = t.sorties.get(id);
      return s ? versLigne(s) : null;
    },
    bloqueEntre: (a, b) => relations.bloqueEntre(a, b),
    listerCaches: async (moi) => listerCachesEnMemoire(social, moi),
    async listerPairesBloquees(ids) {
      const dans = new Set(ids);
      return social.blocages.filter((b) => dans.has(b.bloqueurId) && dans.has(b.bloqueId)).map((b) => [b.bloqueurId, b.bloqueId] as [number, number]);
    },
    lireIdempotence: (compteId, cle, ressource) => relations.lireIdempotence(compteId, cle, ressource),
    noterIdempotence: (compteId, cle, ressource, ressourceId, maintenant) => relations.noterIdempotence(compteId, cle, ressource, ressourceId, maintenant),
    async lireSorties(ids) {
      const voulus = new Set(ids);
      return choisir((s) => voulus.has(s.id));
    },
    listerSortiesVille: async (villeCle, apres, nombre) => choisir((s) => s.villeCle === villeCle && s.quand > apres && enCours(s), nombre),
    listerSortiesDe: async (compteId, apres, nombre) =>
      choisir((s) => s.quand > apres && enCours(s) && t.participations.some((p) => p.sortieId === s.id && p.compteId === compteId), nombre),
    async lireParticipations(sortieIds) {
      const voulues = new Set(sortieIds);
      return t.participations.filter((p) => voulues.has(p.sortieId)).map((p) => ({ ...p }));
    },
    compterSortiesAVenir: async (organisateurId, maintenant) => choisir((s) => s.organisateurId === organisateurId && s.quand > maintenant && enCours(s)).length,
    async creerSortie(s, maintenant) {
      t.derniersIds.sorties += 1;
      const id = t.derniersIds.sorties;
      t.sorties.set(id, {
        ...s, id, etiquettes: s.etiquettes.map((e) => ({ ...e, retireeLe: null })), suiteTraiteeLe: null, rappelEnvoyeLe: null, annuleeLe: null,
        annulationTardive: false, retireeLe: null, version: 0, creeLe: maintenant,
      });
      return id;
    },
    async changerSortie(id, changement) {
      const s = t.sorties.get(id);
      if (s) Object.assign(s, changement, { version: s.version + 1 });
    },
    async ecrireParticipation(p) {
      const existante = t.participations.find((x) => x.sortieId === p.sortieId && x.compteId === p.compteId);
      if (existante) Object.assign(existante, { ...p, presentLe: p.presentLe === undefined ? existante.presentLe : p.presentLe });
      else t.participations.push({ ...p, presentLe: p.presentLe ?? null });
      toucher(p.sortieId);
    },
    async effacerParticipation(sortieId, compteId) {
      const avant = t.participations.length;
      t.participations = t.participations.filter((p) => !(p.sortieId === sortieId && p.compteId === compteId));
      if (t.participations.length !== avant) toucher(sortieId);
    },
    async lireLieux(ids) {
      const lieux = new Map();
      for (const id of ids) {
        const l = social.lieux.get(id) as LieuEnPlus | undefined;
        if (l) lieux.set(id, { id, nom: l.nom ?? `Lieu ${id}`, emoji: l.emoji ?? "🍽️", type: l.type ?? "resto", ville: l.ville ?? "Nantes", publie: l.statut === "publie" });
      }
      return lieux;
    },
    async lireComptes(ids) {
      const comptes = new Map<number, CompteCommunaute>();
      for (const id of ids) {
        const c = social.comptes.get(id) as CompteEnPlus | undefined;
        if (!c) continue;
        comptes.set(id, {
          id, creeLe: new Date(c.creeLe), ville: c.villeApp, dateNaissanceChiffree: c.dateNaissanceChiffree ?? null, ambassadeurActif: c.statutAmbassadeur === "actif",
          activitePartagee: social.profils.get(id)?.activitePartagee ?? false,
        });
      }
      return comptes;
    },
    async compterRescousses(ids) {
      const voulus = new Set(ids);
      const compte = new Map<number, number>();
      for (const r of social.rescousses) if (voulus.has(r.compteId)) compte.set(r.compteId, (compte.get(r.compteId) ?? 0) + 1);
      return compte;
    },
    async lireHistoriques(ids, maintenant) {
      const voulus = new Set(ids);
      return t.participations.flatMap((p) => {
        const s = t.sorties.get(p.sortieId);
        if (!s || !voulus.has(p.compteId) || !["organise", "accepte", "desiste"].includes(p.statut)) return [];
        if (s.quand > maintenant && s.annuleeLe === null) return [];
        const autresAcceptes = t.participations.filter((x) => x.sortieId === s.id && x.statut === "accepte").length;
        return [{ compteId: p.compteId, statut: p.statut, quand: s.quand, annulee: s.annuleeLe !== null, annulationTardive: s.annulationTardive, autresAcceptes }];
      });
    },
    async aUneVisiteValidee(compteId, lieuId, de, a) {
      return t.visites.some((v) => v.compteId === compteId && v.lieuId === lieuId && v.statut === "validee" && (v.valideLe ?? v.creeLe) >= de && (v.valideLe ?? v.creeLe) <= a);
    },
    async creerConversation(organisateurId, maintenant) {
      const id = prendreId(social, "conversations");
      social.conversations.set(id, {
        id, type: "sortie", clePrive: null, titreChiffre: null, emoji: null, creeParId: organisateurId, version: 0, dernierMessageLe: maintenant, modifieLe: maintenant, creeLe: maintenant,
      });
      social.membres.push({ conversationId: id, compteId: organisateurId, role: "membre", visibleApres: 0, luJusqua: 0, coupee: false, arriveLe: maintenant });
      return id;
    },
    async ajouterMembre(conversationId, compteId, maintenant) {
      if (social.membres.some((m) => m.conversationId === conversationId && m.compteId === compteId)) return;
      social.membres.push({ conversationId, compteId, role: "membre", visibleApres: 0, luJusqua: 0, coupee: false, arriveLe: maintenant });
      toucherConversation(conversationId, maintenant);
    },
    async retirerMembre(conversationId, compteId, maintenant) {
      const avant = social.membres.length;
      social.membres = social.membres.filter((m) => !(m.conversationId === conversationId && m.compteId === compteId));
      if (social.membres.length !== avant) toucherConversation(conversationId, maintenant);
    },
    async effacerConversation(conversationId) {
      const efface = await effacerConversationsEnMemoire(social, [conversationId], medias);
      for (const s of t.sorties.values()) if (s.conversationId === conversationId) s.conversationId = null;
      return async () => void (await efface.apresTransaction(undefined as never));
    },
    listerSortiesARappeler: async (maintenant, jusqua, nombre) => choisir((s) => enCours(s) && s.rappelEnvoyeLe === null && s.quand > maintenant && s.quand <= jusqua, nombre),
    listerSortiesAContinuer: async (avant, nombre) => choisir((s) => s.recurrente && enCours(s) && s.suiteTraiteeLe === null && s.quand <= avant, nombre),

    lireProfil: async (compteId) => {
      const p = t.profils.get(compteId);
      return p ? { ...p } : null;
    },
    async ecrireProfil(compteId, changement) {
      t.profils.set(compteId, { genreChiffre: null, genreChoisiLe: null, quiEstLa: false, ...t.profils.get(compteId), ...changement });
    },
    async lireGenresChiffres(ids) {
      return new Map(ids.flatMap((id) => {
        const chiffre = t.profils.get(id)?.genreChiffre;
        return chiffre ? [[id, chiffre] as [number, string]] : [];
      }));
    },
    lirePresence: async (compteId) => {
      const p = t.presences.get(compteId);
      return p ? { ...p } : null;
    },
    async ecrirePresence(compteId, villeCle, jusqua) {
      t.presences.set(compteId, { villeCle, jusqua });
    },
    async effacerPresence(compteId) {
      t.presences.delete(compteId);
    },
    async listerPresents(villeCle, maintenant, nombre) {
      return [...t.presences].filter(([id, p]) => p.villeCle === villeCle && p.jusqua > maintenant && t.profils.get(id)?.quiEstLa)
        .sort(([a, pa], [b, pb]) => pb.jusqua.getTime() - pa.jusqua.getTime() || a - b).slice(0, nombre).map(([id]) => id);
    },
    async lireCoucous(moi, depuis) {
      const frais = t.coucous.filter((c) => c.creeLe > depuis);
      return { envoyes: new Set(frais.filter((c) => c.deId === moi).map((c) => c.aId)), recus: new Set(frais.filter((c) => c.aId === moi).map((c) => c.deId)) };
    },
    async ecrireCoucou(de, a, maintenant) {
      const existant = t.coucous.find((c) => c.deId === de && c.aId === a);
      if (existant) existant.creeLe = maintenant;
      else t.coucous.push({ deId: de, aId: a, creeLe: maintenant });
    },
    async effacerCoucous(compteId) {
      t.coucous = t.coucous.filter((c) => c.deId !== compteId && c.aId !== compteId);
    },
  };
}

export function creerDepotCommunauteEnMemoire(social: TablesSociales, relations: RelationsSociales, medias: Pick<StockageMediasChat, "supprimer">): DepotCommunaute {
  const tables = creerTablesCommunauteEnMemoire(social, relations, medias);
  return { lire: (fn) => fn(tables), ecrire: (fn) => fn(tables) };
}
