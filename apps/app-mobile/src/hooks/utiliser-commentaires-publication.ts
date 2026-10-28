import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { PageCommentairesApi } from "@sos-miam/commun/client-api/contrat-commentaires";
import { trierCommentaires, type FilCommentaire } from "@sos-miam/commun/fonctions/commentaires/trier-commentaires";
import { LONGUEUR_MAX_COMMENTAIRE } from "@sos-miam/commun/regles/mots-interdits";
import type { CommentaireApi, MesCommentairesApi } from "@sos-miam/commun/types/commentaires";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { contientMotInterdit } from "@sos-miam/commun/validation/contient-mot-interdit";
import { convertirCommentaireApi } from "~/fonctions/commentaires/convertir-commentaire-api";
import { utiliserCommunaute, type ResultatTexte } from "~/hooks/utiliser-communaute";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserSourceSociale, type SourceSociale } from "~/hooks/utiliser-source-sociale";
import {
  corrigerCommentaires,
  noterNombreCommentaires,
  oublierSuppression,
  retenirEcrit,
  retenirSuppression,
} from "~/services/memoire-commentaires";

/**
 * Ce qu'un envoi a donné : « pseudo-requis » (choisis ton pseudo d'abord), « introuvable » (le commentaire auquel tu
 * réponds n'est plus là, ou un blocage), « compte-limite » (ton compte est limité : pas une panne, rien à réessayer),
 * « reseau » (pas parti, réessaie)
 */
export type ResultatCommentaire = ResultatTexte | "pseudo-requis" | "introuvable" | "compte-limite" | "reseau";

export type CommentairesPublication = {
  source: SourceSociale;
  /** Faux pendant la première lecture */
  pret: boolean;
  /** La lecture a raté (réseau) : rien à montrer pour l'instant */
  ratee: boolean;
  /** Rangés : la réponse du lieu en tête, les plus aimés, les plus récents, les réponses dessous ; sans tes bloqués ni ce que tu as signalé */
  fils: FilCommentaire[];
  /** Tous les commentaires visibles, réponses comprises */
  nombre: number;
  /** Il reste des commentaires plus anciens à lire (100 par page) ; chargerSuite rend faux si la lecture a raté */
  suite: boolean;
  chargerSuite: () => Promise<boolean>;
  commenter: (texte: string, reponseA?: string, commeLieu?: boolean) => Promise<ResultatCommentaire>;
  modifier: (id: string, texte: string) => Promise<ResultatCommentaire>;
  supprimer: (id: string) => void;
  basculerJaime: (id: string) => void;
  /** Gérant du lieu de la publication : masquer (il part en modération) ou démasquer un commentaire. Rend l'erreur, ou null */
  masquerCommeLieu: (id: string, masque: boolean) => Promise<ErreurService | null>;
  /** Tu peux répondre au nom du lieu (gérant) */
  peutRepondreCommeLieu: boolean;
  /** Relit la liste (et tes J'aime) ; rend faux si la lecture a raté */
  relire: () => Promise<boolean>;
};

type Page = { commentaires: CommentaireApi[]; total: number; suite: string | null };

const verifier = (texte: string): ResultatTexte => {
  const propre = texte.trim();
  if (propre === "") return "vide";
  if (propre.length > LONGUEUR_MAX_COMMENTAIRE) return "trop-long";
  return contientMotInterdit(propre) ? "mot-interdit" : "ok";
};

/** Le refus du serveur, dit comme l'écran le connaît */
const lireRefus = (erreur: ErreurService, champ?: string): ResultatCommentaire => {
  if (erreur === "pseudo-requis") return "pseudo-requis";
  if (erreur === "message-refuse") return "mot-interdit";
  if (erreur === "champ-invalide" && champ === "texte") return "trop-long";
  if (erreur === "commentaire-inconnu" || erreur === "publication-inconnue") return "introuvable";
  if (erreur === "compte-limite") return "compte-limite";
  return "reseau";
};

/**
 * Les commentaires d'une publication (sortis de la communauté au lot A6) : la liste publique du serveur (lisible sans compte, en cache 30 s), corrigée de tes gestes des 60 dernières secondes
 * (services/memoire-commentaires) ; avec un compte, en plus, tes J'aime, tes commentaires masqués par le lieu ou suspendus
 * (toi seul les vois), ceux que tu as signalés (cachés) et la réponse au nom du lieu pour un gérant. Les gestes s'affichent
 * tout de suite. publicationId null : rien.
 */
export function utiliserCommentairesPublication(publicationId: string | null): CommentairesPublication {
  const source = utiliserSourceSociale();
  const communaute = utiliserCommunaute();
  const { sociaux } = utiliserSession();
  const monId = utiliserMonId();
  const duServeur = source !== "attente" && !!publicationId;
  const avecCompte = source === "compte";
  const [page, setPage] = useState<Page | null>(null);
  const [moi, setMoi] = useState<MesCommentairesApi | null>(null);
  const [ratee, setRatee] = useState(false);
  // Tes gestes récents (memoire-commentaires) ont bougé : on recorrige la liste
  const [tic, setTic] = useState(0);
  const [masquesParMoi, setMasquesParMoi] = useState<ReadonlySet<string>>(new Set());
  const generation = useRef(0);
  const { noterPersonne } = communaute;
  const relu = () => setTic((n) => n + 1);

  const charger = useCallback(async (): Promise<boolean> => {
    if (!duServeur || !publicationId) return true;
    const g = ++generation.current;
    const [p, m] = await Promise.all([
      sociaux.commentaires.lister(publicationId),
      avecCompte ? sociaux.commentaires.lireMiens(publicationId) : Promise.resolve(null),
    ]);
    if (g !== generation.current) return p.ok;
    if (p.ok) {
      p.commentaires.forEach((c) => c.auteur.type === "personne" && noterPersonne(c.auteur.personne));
      setPage({ commentaires: p.commentaires, total: p.total, suite: p.suite });
    }
    if (m?.ok) setMoi(m.moi);
    setRatee(!p.ok);
    return p.ok;
    // noterPersonne change à chaque relecture de la bande : la lecture ne repart pas pour autant
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duServeur, publicationId, avecCompte, sociaux]);

  useEffect(() => {
    setPage(null);
    setMoi(null);
    setRatee(false);
    setMasquesParMoi(new Set());
    void charger();
  }, [charger]);

  const chargerSuite = useCallback(async (): Promise<boolean> => {
    const suite = page?.suite;
    if (!duServeur || !publicationId || !suite) return true;
    const g = generation.current;
    const r: { ok: false } | ({ ok: true } & PageCommentairesApi) = await sociaux.commentaires.lister(publicationId, suite);
    if (g !== generation.current || !r.ok) return r.ok;
    setPage((avant) => {
      if (!avant || avant.suite !== suite) return avant;
      const deja = new Set(avant.commentaires.map((c) => c.id));
      return { commentaires: [...avant.commentaires, ...r.commentaires.filter((c) => !deja.has(c.id))], total: r.total, suite: r.suite };
    });
    return true;
  }, [duServeur, publicationId, page?.suite, sociaux]);

  // La liste publique corrigée de tes gestes récents, avec tes commentaires que toi seul vois
  const corrige = useMemo(() => {
    if (!duServeur || !publicationId || !page) return null;
    const { commentaires, total } = corrigerCommentaires(publicationId, page.commentaires, page.total);
    const publics = new Set(commentaires.map((c) => c.id));
    const miens = (moi?.miens ?? []).filter((c) => !publics.has(c.id));
    return { commentaires: [...commentaires, ...miens], total };
    // tic : un geste vient de changer la mémoire des corrections
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duServeur, publicationId, page, moi, tic]);

  // Le compteur du fil suit ce que la feuille vient de compter
  useEffect(() => {
    if (publicationId && corrige) noterNombreCommentaires(publicationId, corrige.total);
  }, [publicationId, corrige]);

  return useMemo((): CommentairesPublication => {
    const id = publicationId ?? "";
    if (!duServeur) {
      return {
        source,
        pret: source !== "attente",
        ratee: false,
        fils: [],
        nombre: 0,
        suite: false,
        chargerSuite: async () => true,
        commenter: async () => "reseau",
        modifier: async () => "reseau",
        supprimer: () => false,
        basculerJaime: () => false,
        masquerCommeLieu: async () => "session-app-requise",
        peutRepondreCommeLieu: false,
        relire: async () => true,
      };
    }

    const bloques = communaute.bloques.map((p) => p.id);
    const caches = new Set([...(moi?.signales ?? []), ...masquesParMoi]);
    const aimes = new Set(moi?.jaimes ?? []);
    const visibles = (corrige?.commentaires ?? []).filter((c) => !caches.has(c.id) && !communaute.estSignale(c.id));
    const fils = trierCommentaires(visibles, { bloques, moi: monId }).map((f) => ({
      commentaire: convertirCommentaireApi(f.commentaire, aimes.has(f.commentaire.id)),
      reponses: f.reponses.map((r) => convertirCommentaireApi(r, aimes.has(r.id))),
    }));
    const changerJaimes = (cid: string, ecart: number, valeur?: number) =>
      setPage((p) => (p ? { ...p, commentaires: p.commentaires.map((c) => (c.id === cid ? { ...c, jaimes: valeur ?? Math.max(0, c.jaimes + ecart) } : c)) } : p));

    const ecrire = async (envoi: () => Promise<{ ok: true; commentaire: CommentaireApi } | { ok: false; erreur: ErreurService; champ?: string }>, nouveau: boolean, texte: string): Promise<ResultatCommentaire> => {
      if (!avecCompte) return "reseau";
      const verdict = verifier(texte);
      if (verdict !== "ok") return verdict;
      const r = await envoi().catch(() => ({ ok: false as const, erreur: "erreur-serveur" as ErreurService }));
      if (!r.ok) return lireRefus(r.erreur, "champ" in r ? r.champ : undefined);
      retenirEcrit(r.commentaire, nouveau);
      // Un des tiens que toi seul vois (masqué, suspendu) : sa version modifiée remplace l'ancienne
      setMoi((m) => (m ? { ...m, miens: m.miens.map((c) => (c.id === r.commentaire.id ? { ...r.commentaire, etat: c.etat } : c)) } : m));
      relu();
      return "ok";
    };

    return {
      source,
      pret: page !== null || ratee,
      ratee,
      fils,
      nombre: corrige?.total ?? 0,
      suite: !!page?.suite,
      chargerSuite,
      commenter: (texte, reponseA, commeLieu) =>
        ecrire(() => sociaux.commentaires.commenter(id, { texte: texte.trim(), ...(reponseA ? { reponseA } : {}), ...(commeLieu ? { commeLieu: true } : {}) }), true, texte),
      modifier: (cid, texte) => ecrire(() => sociaux.commentaires.modifier(cid, texte.trim()), false, texte),
      supprimer: (cid) => {
        if (!avecCompte) return;
        // Avec des réponses, il reste « Commentaire supprimé » à sa place
        const resteAffiche = visibles.some((c) => c.reponseA === cid);
        retenirSuppression(id, cid, resteAffiche);
        setMoi((m) => (m ? { ...m, miens: m.miens.filter((c) => c.id !== cid) } : m));
        relu();
        void sociaux.commentaires.supprimer(cid).then((r) => {
          if (r.ok) return;
          oublierSuppression(id, cid);
          void charger();
        });
      },
      basculerJaime: (cid) => {
        if (!avecCompte) return;
        const oui = !aimes.has(cid);
        setMoi((m) => (m ? { ...m, jaimes: oui ? [...m.jaimes, cid] : m.jaimes.filter((x) => x !== cid) } : m));
        changerJaimes(cid, oui ? 1 : -1);
        void sociaux.commentaires.aimer(cid, oui).then((r) => {
          if (r.ok) return changerJaimes(cid, 0, r.jaimes);
          // Refusé : on revient en arrière
          setMoi((m) => (m ? { ...m, jaimes: oui ? m.jaimes.filter((x) => x !== cid) : [...m.jaimes, cid] } : m));
          changerJaimes(cid, oui ? -1 : 1);
        });
      },
      masquerCommeLieu: async (cid, masque) => {
        if (!avecCompte) return "session-app-requise";
        // Masqué : il disparaît tout de suite pour toi (et pour tout le monde côté serveur) ; on garde son id pour « Annuler »
        setMasquesParMoi((avant) => {
          const apres = new Set(avant);
          if (masque) apres.add(cid);
          else apres.delete(cid);
          return apres;
        });
        const r = await sociaux.commentaires.masquerCommeLieu(cid, masque);
        if (!r.ok) {
          setMasquesParMoi((avant) => {
            const apres = new Set(avant);
            if (masque) apres.delete(cid);
            else apres.add(cid);
            return apres;
          });
          return r.erreur;
        }
        if (!masque) void charger();
        return null;
      },
      peutRepondreCommeLieu: moi?.peutRepondreCommeLieu === true,
      relire: charger,
    };
  }, [publicationId, duServeur, source, communaute, moi, masquesParMoi, corrige, monId, page, ratee, avecCompte, sociaux, chargerSuite, charger]);
}
