import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import { MAX_PROPOSITIONS_SORTIE } from "@sos-miam/commun/regles/potes";
import type { CibleMasque, PersonneResume } from "@sos-miam/commun/types/social";
import type { InvitationSortieApi, SortieApi } from "@sos-miam/commun/types/sorties";
import { validerNouvelleSortie, type ChampNouvelleSortie } from "@sos-miam/commun/validation/valider-nouvelle-sortie";
import { convertirInvitationSortieApi } from "~/fonctions/communaute/convertir-invitation-sortie-api";
import { convertirSortieApi } from "~/fonctions/communaute/convertir-sortie-api";
import type { EtatCommunaute, ErreurNouvelleSortie } from "~/hooks/utiliser-communaute";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserPoulsSocial } from "~/hooks/utiliser-pouls-social";
import { utiliserSession } from "~/hooks/utiliser-session";

export type SortiesCompte = Pick<
  EtatCommunaute,
  | "sorties" | "trouverSortie" | "creerSortie" | "lireSortie" | "voter" | "proposerLieu" | "terminerVote" | "quitterSortie"
  | "invitationsSorties" | "repondreInvitationSortie" | "inviterASortie" | "retirerParticipant" | "annulerSortie"
>;

type Dependances = {
  /** Ton identifiant public (« » tant que ton profil social n'existe pas) */
  monId: string;
  noterPersonne: (personne: PersonneResume) => void;
  estMasque: (cible: CibleMasque, id: string) => boolean;
};

/** Le champ refusé, tel que l'écran « Nouvelle sortie » le montre */
const ERREUR_DU_CHAMP: Record<ChampNouvelleSortie, ErreurNouvelleSortie> = {
  titre: "titre",
  emoji: "titre",
  quand: "quand",
  finVote: "quand",
  invites: "participants",
  lieux: "lieux",
};

/**
 * Tes sorties quand un compte est connecté : GET /app/sorties (tes sorties et les « Tu viens ? » en attente), relu quand le
 * pouls dit que les sorties ont bougé. Les gestes (voter, proposer, quitter, retirer) s'affichent tout de suite, puis la
 * sortie rendue par le serveur remplace la nôtre ; une relecture partie avant un geste ne l'efface pas. La discussion de
 * chaque sortie est une conversation (utiliserDiscussionSortie). Inactif (démo, visite, attente) : rien n'est lu.
 */
export function utiliserSortiesCompte(actif: boolean, { monId, noterPersonne, estMasque }: Dependances): SortiesCompte {
  const { sociaux } = utiliserSession();
  const { pouls, relire: relirePouls } = utiliserPoulsSocial();
  const { trouverLieu } = utiliserLieux();
  const [api, setApi] = useState<SortieApi[]>([]);
  const [invitations, setInvitations] = useState<InvitationSortieApi[]>([]);
  const generation = useRef(0);
  // Sorties avec un geste en route : une relecture de la liste garde notre version jusqu'à la réponse
  const gestes = useRef(new Map<string, number>());
  const apiCourante = useRef(api);
  apiCourante.current = api;

  const tant = useCallback((g: number) => g === generation.current, []);
  const noterSortie = useCallback(
    (s: SortieApi) => {
      const personnes = [s.organisateur, ...s.participants, ...s.invites, ...s.propositions.flatMap((p) => [p.proposePar, ...p.votes])];
      personnes.forEach((p) => p && noterPersonne(p));
    },
    [noterPersonne],
  );
  const remplacer = useCallback(
    (s: SortieApi) => {
      noterSortie(s);
      setApi((avant) => (avant.some((x) => x.id === s.id) ? avant.map((x) => (x.id === s.id ? s : x)) : [...avant, s]));
    },
    [noterSortie],
  );
  const changer = useCallback((id: string, f: (s: SortieApi) => SortieApi) => setApi((avant) => avant.map((s) => (s.id === id ? f(s) : s))), []);
  const oublier = useCallback((id: string) => setApi((avant) => avant.filter((s) => s.id !== id)), []);

  const chargerListe = useCallback(async () => {
    const g = generation.current;
    const r = await sociaux.sorties.lister();
    if (!tant(g) || !r.ok) return;
    r.sorties.forEach(noterSortie);
    r.invitations.forEach((i) => [i.organisateur, i.invitePar].forEach((p) => p && noterPersonne(p)));
    setApi((avant) => r.sorties.map((s) => (gestes.current.has(s.id) ? (avant.find((x) => x.id === s.id) ?? s) : s)));
    setInvitations(r.invitations);
  }, [sociaux, tant, noterSortie, noterPersonne]);

  const lire = useCallback(
    async (id: string) => {
      const g = generation.current;
      const version = apiCourante.current.find((s) => s.id === id)?.version;
      const r = await sociaux.sorties.lire(id, version);
      if (!tant(g)) return;
      if (!r.ok) {
        // Plus participant ni invité (retiré, annulée, blocage) : elle disparaît
        if (r.erreur === "sortie-inconnue") {
          oublier(id);
          setInvitations((avant) => avant.filter((i) => i.id !== id));
        }
        return;
      }
      if ("sortie" in r) remplacer(r.sortie);
      else if ("invitation" in r) setInvitations((avant) => [r.invitation, ...avant.filter((i) => i.id !== id)]);
    },
    [sociaux, tant, remplacer, oublier],
  );

  /** Le geste s'affiche (avant), la route part, puis la sortie rendue remplace la nôtre (sinon, on relit la sortie) */
  const faire = useCallback(
    async (id: string, avant: (() => void) | null, route: () => Promise<ReponseApi<{ sortie?: SortieApi }>>) => {
      const g = generation.current;
      gestes.current.set(id, (gestes.current.get(id) ?? 0) + 1);
      avant?.();
      const r = await route();
      const reste = (gestes.current.get(id) ?? 1) - 1;
      if (reste > 0) gestes.current.set(id, reste);
      else gestes.current.delete(id);
      if (!tant(g)) return r;
      if (r.ok && r.sortie) remplacer(r.sortie);
      else if (!r.ok) void lire(id);
      relirePouls();
      return r;
    },
    [tant, remplacer, relirePouls, lire],
  );

  // Connexion : tout est lu une fois ; déconnexion (ou démo) : tout est oublié
  useEffect(() => {
    generation.current += 1;
    gestes.current.clear();
    if (!actif) {
      setApi([]);
      setInvitations([]);
      return;
    }
    void chargerListe();
  }, [actif, chargerListe]);

  // Le pouls dit que les sorties ont bougé (invitation, vote, lieu retenu, participant) : on relit
  const signature = pouls?.sorties.signature ?? null;
  const derniere = useRef<string | null>(null);
  useEffect(() => {
    if (!actif || signature === null) return;
    if (derniere.current !== null && derniere.current !== signature) void chargerListe();
    derniere.current = signature;
  }, [actif, signature, chargerListe]);

  const creerSortie = useCallback(
    async (n: Parameters<SortiesCompte["creerSortie"]>[0], cle = Crypto.randomUUID()): Promise<{ id: string } | { erreur: ErreurNouvelleSortie }> => {
      const v = validerNouvelleSortie(n, new Date());
      if (!v.ok) return { erreur: ERREUR_DU_CHAMP[v.champ] };
      const g = generation.current;
      const r = await sociaux.sorties.creer(v.sortie, cle);
      if (!tant(g)) return { erreur: "reseau" };
      if (!r.ok) {
        if ((r.erreur === "champ-invalide" || r.erreur === "message-refuse") && r.champ && r.champ in ERREUR_DU_CHAMP) return { erreur: ERREUR_DU_CHAMP[r.champ as ChampNouvelleSortie] };
        if (r.erreur === "pas-dans-la-bande") return { erreur: "participants" };
        if (r.erreur === "lieu-inconnu") return { erreur: "lieux" };
        if (r.erreur === "compte-limite") return { erreur: "compte-limite" };
        return { erreur: r.erreur === "trop-de-sorties" ? "trop" : "reseau" };
      }
      remplacer(r.sortie);
      relirePouls();
      return { id: r.sortie.id };
    },
    [sociaux, tant, remplacer, relirePouls],
  );

  return useMemo((): SortiesCompte => {
    const maintenant = new Date();
    const moi: PersonneResume = { id: monId, pseudo: "", prenom: "", avatar: null };
    const sorties = api
      .filter((s) => !estMasque("sortie", s.id))
      .map((s) => {
        const sortie = convertirSortieApi(s, maintenant);
        // Un lieu que l'app ne connaît plus ne se montre pas (le serveur, lui, ne le retient jamais)
        return { ...sortie, propositions: sortie.propositions.filter((p) => !!trouverLieu(p.lieuId)) };
      });
    const trouver = (id: string) => api.find((s) => s.id === id);
    const avecMonVote = (p: SortieApi["propositions"][number], oui: boolean) => {
      const sans = p.votes.filter((v) => v.id !== monId);
      const avait = sans.length !== p.votes.length;
      return { ...p, votes: oui ? [...sans, moi] : sans, nombreVotes: Math.max(0, p.nombreVotes + (oui && !avait ? 1 : !oui && avait ? -1 : 0)) };
    };

    return {
      sorties,
      trouverSortie: (id) => sorties.find((s) => s.id === id) ?? null,
      creerSortie,
      lireSortie: (id) => void lire(id),
      voter: (sortieId, lieuId) => {
        const s = trouver(sortieId);
        const p = s?.propositions.find((x) => x.lieuId === lieuId);
        if (!s || !p || s.voteTermine) return;
        const oui = !p.votes.some((v) => v.id === monId);
        void faire(
          sortieId,
          () => changer(sortieId, (x) => ({ ...x, propositions: x.propositions.map((q) => (q.lieuId === lieuId ? avecMonVote(q, oui) : q)) })),
          () => sociaux.sorties.voter(sortieId, lieuId, oui),
        );
      },
      proposerLieu: (sortieId, lieuId, surRefus) => {
        const s = trouver(sortieId);
        if (!s || s.voteTermine || !trouverLieu(lieuId)) return "interdit";
        if (s.propositions.some((p) => p.lieuId === lieuId)) return "deja";
        if (s.propositions.length >= MAX_PROPOSITIONS_SORTIE) return "max";
        // Refusé : la relecture de faire retire la proposition, et l'écran qui l'avait annoncée dit pourquoi
        void faire(
          sortieId,
          () => changer(sortieId, (x) => ({ ...x, propositions: [...x.propositions, { lieuId, proposePar: moi, votes: [moi], nombreVotes: 1 }] })),
          () => sociaux.sorties.proposer(sortieId, lieuId),
        ).then((r) => {
          if (!r.ok) surRefus?.(r.erreur);
        });
        return "ok";
      },
      terminerVote: (sortieId) => {
        const s = trouver(sortieId);
        if (!s?.moi.organisateur || s.voteTermine) return;
        void faire(sortieId, null, () => sociaux.sorties.terminerVote(sortieId));
      },
      quitterSortie: (sortieId) => {
        // Partie : une relecture faite pendant le départ ne la fait pas revenir
        void faire(sortieId, () => oublier(sortieId), () => sociaux.sorties.quitter(sortieId)).then((r) => r.ok && oublier(sortieId));
      },
      invitationsSorties: invitations
        .filter((i) => !estMasque("sortie", i.id))
        .map(convertirInvitationSortieApi)
        .sort((a, b) => b.date.localeCompare(a.date)),
      repondreInvitationSortie: async (id, vient) => {
        const g = generation.current;
        const invitation = invitations.find((i) => i.id === id);
        setInvitations((avant) => avant.filter((i) => i.id !== id));
        const r = await sociaux.sorties.repondre(id, vient);
        if (!tant(g)) return false;
        if (!r.ok) {
          // Plus valable (sortie passée, annulée) : elle reste partie ; sinon on la remet pour réessayer
          if (invitation && r.erreur !== "sortie-inconnue" && r.erreur !== "sortie-passee") setInvitations((avant) => [invitation, ...avant]);
          return false;
        }
        if (r.sortie) remplacer(r.sortie);
        relirePouls();
        return true;
      },
      inviterASortie: async (sortieId, potes) => {
        const r = await faire(sortieId, null, () => sociaux.sorties.inviter(sortieId, potes));
        return r.ok ? null : r.erreur;
      },
      retirerParticipant: async (sortieId, poteId) => {
        const r = await faire(
          sortieId,
          () => changer(sortieId, (x) => ({ ...x, participants: x.participants.filter((p) => p.id !== poteId), invites: x.invites.filter((p) => p.id !== poteId) })),
          () => sociaux.sorties.retirerParticipant(sortieId, poteId),
        );
        return r.ok ? null : r.erreur;
      },
      annulerSortie: async (sortieId) => {
        const r = await faire(sortieId, null, () => sociaux.sorties.annuler(sortieId));
        if (r.ok) oublier(sortieId);
        return r.ok ? null : r.erreur;
      },
    };
  }, [api, invitations, monId, estMasque, trouverLieu, creerSortie, lire, faire, changer, oublier, sociaux, tant, remplacer, relirePouls]);
}
