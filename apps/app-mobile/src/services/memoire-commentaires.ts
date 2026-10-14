// Ce que tes gestes ont changé dans les commentaires d'une publication, gardé 60 s en mémoire (jamais sur le disque). La
// liste publique passe par un cache de 30 s : sans cette correction, ton commentaire tout frais disparaîtrait à la
// relecture suivante, ou un commentaire supprimé reviendrait. Chaque correction est oubliée dès que la liste publique dit
// la même chose, ou au bout de 60 s. Le dernier nombre corrigé sert aussi au compteur du fil.
import type { CommentaireApi } from "@sos-miam/commun/types/commentaires";

const DUREE_MS = 60_000;

type Memoire = {
  /** Écrits (nouveau) ou modifiés par toi */
  ecrits: Map<string, { commentaire: CommentaireApi; le: number; nouveau: boolean }>;
  /** Supprimés par toi : partis, ou restés « Commentaire supprimé » parce qu'ils ont des réponses */
  supprimes: Map<string, { le: number; resteAffiche: boolean }>;
  /** Le dernier nombre corrigé (compteur du fil) */
  nombre: { valeur: number; le: number } | null;
};

const parPublication = new Map<string, Memoire>();
const abonnes = new Set<() => void>();
let version = 0;

function lire(publicationId: string): Memoire {
  let m = parPublication.get(publicationId);
  if (!m) {
    m = { ecrits: new Map(), supprimes: new Map(), nombre: null };
    parPublication.set(publicationId, m);
  }
  return m;
}

/** Ton commentaire tel que le serveur l'a rendu (POST : nouveau ; PATCH : modifié) */
export function retenirEcrit(commentaire: CommentaireApi, nouveau: boolean): void {
  const m = lire(commentaire.publicationId);
  const avant = m.ecrits.get(commentaire.id);
  m.ecrits.set(commentaire.id, { commentaire, le: Date.now(), nouveau: nouveau || avant?.nouveau === true });
}

/** Ton commentaire supprimé : parti, ou resté « Commentaire supprimé » (il a des réponses) */
export function retenirSuppression(publicationId: string, id: string, resteAffiche: boolean): void {
  const m = lire(publicationId);
  m.ecrits.delete(id);
  m.supprimes.set(id, { le: Date.now(), resteAffiche });
}

/** Une suppression qui n'est pas passée (réseau) : la liste publique fait foi de nouveau */
export function oublierSuppression(publicationId: string, id: string): void {
  parPublication.get(publicationId)?.supprimes.delete(id);
}

const dateDe = (c: CommentaireApi) => c.modifieLe ?? c.date;

/**
 * La liste publique (et son total), corrigée de tes gestes récents. Une correction que la liste publique confirme déjà
 * (ou trop vieille) est oubliée au passage.
 */
export function corrigerCommentaires(publicationId: string, page: readonly CommentaireApi[], total: number): { commentaires: CommentaireApi[]; total: number } {
  const m = parPublication.get(publicationId);
  if (!m) return { commentaires: [...page], total };
  const maintenant = Date.now();
  const parId = new Map(page.map((c) => [c.id, c]));
  let nombre = total;
  m.ecrits.forEach((e, id) => {
    const public_ = parId.get(id);
    if (maintenant - e.le > DUREE_MS || (public_ && dateDe(public_) >= dateDe(e.commentaire))) return void m.ecrits.delete(id);
    if (!public_ && e.nouveau) nombre += 1;
    parId.set(id, e.commentaire);
  });
  m.supprimes.forEach((s, id) => {
    const public_ = parId.get(id);
    if (maintenant - s.le > DUREE_MS || !public_ || (s.resteAffiche && public_.supprime)) return void m.supprimes.delete(id);
    if (!public_.supprime) nombre -= 1;
    if (s.resteAffiche) parId.set(id, { ...public_, texte: "", supprime: true, mentions: [] });
    else parId.delete(id);
  });
  return { commentaires: [...parId.values()], total: Math.max(0, nombre) };
}

/** Le nombre de commentaires que la feuille vient de compter : le fil le montre pendant 60 s, plutôt que celui de sa page */
export function noterNombreCommentaires(publicationId: string, valeur: number): void {
  const m = lire(publicationId);
  if (m.nombre?.valeur === valeur) return;
  m.nombre = { valeur, le: Date.now() };
  version += 1;
  abonnes.forEach((f) => f());
}

/** Le nombre noté il y a moins de 60 s, ou null */
export function lireNombreCommentaires(publicationId: string): number | null {
  const n = parPublication.get(publicationId)?.nombre;
  return n && Date.now() - n.le <= DUREE_MS ? n.valeur : null;
}

/** Pour useSyncExternalStore : prévient quand un nombre change, et dit lequel est le plus récent */
export function ecouterNombresCommentaires(f: () => void): () => void {
  abonnes.add(f);
  return () => abonnes.delete(f);
}
export const lireVersionNombresCommentaires = () => version;
