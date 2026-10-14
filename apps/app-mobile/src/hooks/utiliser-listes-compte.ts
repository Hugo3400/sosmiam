import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import type { ListeApi, ListeResumeApi } from "@sos-miam/commun/types/listes";
import type { ListePartagee } from "@sos-miam/commun/types/potes";
import type { PersonneResume } from "@sos-miam/commun/types/social";
import { validerNouvelleListe } from "@sos-miam/commun/validation/valider-nouvelle-liste";
import { convertirListeApi } from "~/fonctions/communaute/convertir-liste-api";
import type { EtatCommunaute, ErreurNouvelleListe } from "~/hooks/utiliser-communaute";
import { utiliserPoulsSocial } from "~/hooks/utiliser-pouls-social";
import { utiliserSession } from "~/hooks/utiliser-session";

export type ListesCompte = Pick<
  EtatCommunaute,
  | "listes" | "creerListe" | "modifierListe" | "supprimerListe" | "lireListe" | "noterListes" | "basculerSuiviListe" | "ajouterLieuListe"
  | "retirerLieuListe" | "invitationsListes" | "repondreCoAuteur" | "inviterCoAuteur" | "retirerCoAuteur"
>;

type Dependances = {
  /** Ton identifiant public (« » tant que ton profil social n'existe pas) */
  monId: string;
  noterPersonne: (personne: PersonneResume) => void;
};

type MoiListe = NonNullable<ListePartagee["serveur"]>["moi"];
/** Où une liste a été vue : dit ce que tu es pour elle, quand on n'en a que le résumé */
type Rangement = "miennes" | "coEcrites" | "suivies" | "invitations" | "aDecouvrir";

const RIEN: Record<Rangement, readonly string[]> = { miennes: [], coEcrites: [], suivies: [], invitations: [], aDecouvrir: [] };

/** Ce que tu es pour une liste vue seulement en résumé, d'après là où on l'a trouvée */
const moiDuRangement = (rangement: Rangement | null, auteur: boolean): MoiListe => ({
  auteur,
  coAuteur: rangement === "coEcrites" ? "accepte" : rangement === "invitations" ? "invite" : null,
  abonne: rangement === "suivies",
  peutRemplir: auteur || rangement === "coEcrites",
});

/**
 * Tes listes quand un compte est connecté : GET /app/listes (les tiennes, celles que tu remplis, celles que tu suis, les
 * invitations à remplir) et « À découvrir », relues quand la cloche bouge (une invitation à remplir y arrive). Une liste
 * ouverte est lue en entier (lireListe) ; ailleurs, son résumé suffit. Les gestes (suivre, ajouter ou retirer un lieu)
 * s'affichent tout de suite, puis la liste rendue par le serveur remplace la nôtre. Inactif : rien n'est lu.
 */
export function utiliserListesCompte(actif: boolean, { monId, noterPersonne }: Dependances): ListesCompte {
  const { sociaux } = utiliserSession();
  const { pouls } = utiliserPoulsSocial();
  const [cache, setCache] = useState<ReadonlyMap<string, ListePartagee>>(new Map());
  const [rangements, setRangements] = useState(RIEN);
  const generation = useRef(0);

  const tant = useCallback((g: number) => g === generation.current, []);

  /** Range des listes dans le cache ; un résumé ne fait pas oublier les lieux d'une liste lue en entier qui n'a pas bougé */
  const garder = useCallback(
    (listes: readonly (ListeResumeApi | ListeApi)[], rangement: Rangement | null) => {
      listes.forEach((l) => {
        noterPersonne(l.auteur);
        if ("coAuteurs" in l) l.coAuteurs.forEach((c) => noterPersonne(c.personne));
      });
      setCache((avant) => {
        const apres = new Map(avant);
        listes.forEach((l) => {
          const ancienne = avant.get(l.id);
          const neuve = convertirListeApi(l, rangement ? moiDuRangement(rangement, l.auteur.id === monId) : (ancienne?.serveur?.moi ?? moiDuRangement(null, l.auteur.id === monId)));
          const inchangee = ancienne?.serveur?.complete && !neuve.serveur?.complete && ancienne.serveur.modifieLe === neuve.serveur?.modifieLe;
          apres.set(l.id, inchangee && ancienne.serveur && neuve.serveur ? { ...neuve, lieux: ancienne.lieux, coAuteurs: ancienne.coAuteurs, serveur: { ...neuve.serveur, complete: true } } : neuve);
        });
        return apres;
      });
    },
    [noterPersonne, monId],
  );
  const oublier = useCallback((id: string) => {
    setCache((avant) => {
      const apres = new Map(avant);
      apres.delete(id);
      return apres;
    });
    setRangements((avant) => {
      const sans = (ids: readonly string[]) => ids.filter((x) => x !== id);
      return { miennes: sans(avant.miennes), coEcrites: sans(avant.coEcrites), suivies: sans(avant.suivies), invitations: sans(avant.invitations), aDecouvrir: sans(avant.aDecouvrir) };
    });
  }, []);
  const ranger = useCallback((rangement: Rangement, id: string, dedans: boolean) => {
    setRangements((avant) => ({ ...avant, [rangement]: dedans ? [id, ...avant[rangement].filter((x) => x !== id)] : avant[rangement].filter((x) => x !== id) }));
  }, []);
  const changer = useCallback((id: string, f: (l: ListePartagee) => ListePartagee) => {
    setCache((avant) => {
      const l = avant.get(id);
      return l ? new Map(avant).set(id, f(l)) : avant;
    });
  }, []);

  const chargerTout = useCallback(async () => {
    const g = generation.current;
    const [m, d] = await Promise.all([sociaux.listes.listerMiennes(), sociaux.listes.listerADecouvrir()]);
    if (!tant(g)) return;
    if (m.ok) {
      garder(m.miennes, "miennes");
      garder(m.coEcrites, "coEcrites");
      garder(m.suivies, "suivies");
      garder(m.invitations, "invitations");
    }
    if (d.ok) garder(d.listes, "aDecouvrir");
    setRangements((avant) => ({
      miennes: m.ok ? m.miennes.map((l) => l.id) : avant.miennes,
      coEcrites: m.ok ? m.coEcrites.map((l) => l.id) : avant.coEcrites,
      suivies: m.ok ? m.suivies.map((l) => l.id) : avant.suivies,
      invitations: m.ok ? m.invitations.map((l) => l.id) : avant.invitations,
      aDecouvrir: d.ok ? d.listes.map((l) => l.id) : avant.aDecouvrir,
    }));
  }, [sociaux, tant, garder]);

  const lire = useCallback(
    async (id: string) => {
      const g = generation.current;
      const r = await sociaux.listes.lire(id);
      if (!tant(g)) return;
      if (r.ok) garder([r.liste], null);
      // Supprimée, plus visible ou retirée par la modération : elle disparaît
      else if (r.erreur === "liste-inconnue") oublier(id);
    },
    [sociaux, tant, garder, oublier],
  );

  /** Le geste s'affiche (avant), la route part ; la liste rendue remplace la nôtre, sinon on la relit */
  const faire = useCallback(
    async (id: string, avant: () => void, route: () => Promise<ReponseApi<{ liste?: ListeApi }>>) => {
      const g = generation.current;
      avant();
      const r = await route();
      if (!tant(g)) return r;
      if (r.ok && r.liste) garder([r.liste], null);
      else if (!r.ok) void lire(id);
      return r;
    },
    [tant, garder, lire],
  );

  // Connexion : tout est lu une fois ; déconnexion (ou démo) : tout est oublié
  useEffect(() => {
    generation.current += 1;
    if (!actif) {
      setCache(new Map());
      setRangements(RIEN);
      return;
    }
    void chargerTout();
  }, [actif, chargerTout]);

  // La cloche a bougé (une invitation à remplir une liste y arrive) : on relit
  const signature = pouls?.cloche.signature ?? null;
  const derniere = useRef<string | null>(null);
  useEffect(() => {
    if (!actif || signature === null) return;
    if (derniere.current !== null && derniere.current !== signature) void chargerTout();
    derniere.current = signature;
  }, [actif, signature, chargerTout]);

  const creerListe = useCallback(
    async (n: Parameters<ListesCompte["creerListe"]>[0], cle = Crypto.randomUUID()): Promise<{ id: string } | { erreur: ErreurNouvelleListe }> => {
      const v = validerNouvelleListe({ ...n, visibilite: n.visibilite ?? "tous" });
      if (!v.ok) return { erreur: v.champ === "description" ? "description" : "titre" };
      const g = generation.current;
      const r = await sociaux.listes.creer(v.liste, cle);
      if (!tant(g)) return { erreur: "reseau" };
      if (!r.ok) {
        if (r.erreur === "trop-de-listes") return { erreur: "trop" };
        if (r.erreur === "champ-invalide" || r.erreur === "message-refuse") return { erreur: r.champ === "description" ? "description" : "titre" };
        return { erreur: "reseau" };
      }
      garder([r.liste], null);
      ranger("miennes", r.liste.id, true);
      return { id: r.liste.id };
    },
    [sociaux, tant, garder, ranger],
  );

  return useMemo((): ListesCompte => {
    const trouver = (id: string) => cache.get(id);
    const listes = [...cache.values()];
    const avecLieu = (id: string, lieuId: number, dedans: boolean) =>
      changer(id, (l) => {
        const lieux = dedans ? [lieuId, ...l.lieux.filter((x) => x !== lieuId)] : l.lieux.filter((x) => x !== lieuId);
        const avait = l.lieux.includes(lieuId);
        const ecart = dedans && !avait ? 1 : !dedans && avait ? -1 : 0;
        return { ...l, lieux, ...(l.serveur ? { serveur: { ...l.serveur, nombreLieux: Math.max(0, l.serveur.nombreLieux + ecart) } } : {}) };
      });

    return {
      listes,
      creerListe,
      modifierListe: async (id, m) => {
        const r = await faire(id, () => {}, () => sociaux.listes.modifier(id, m));
        return r.ok ? null : r.erreur;
      },
      supprimerListe: async (id) => {
        const avant = trouver(id);
        oublier(id);
        const r = await sociaux.listes.supprimer(id);
        if (!r.ok && avant && r.erreur !== "liste-inconnue") void chargerTout();
        return r.ok ? null : r.erreur;
      },
      lireListe: (id) => void lire(id),
      noterListes: (resumes) => garder(resumes, null),
      basculerSuiviListe: (id) => {
        const l = trouver(id);
        if (!l?.serveur || l.serveur.moi.auteur) return;
        const oui = !l.serveur.moi.abonne;
        void faire(
          id,
          () => {
            changer(id, (x) => (x.serveur ? { ...x, serveur: { ...x.serveur, nombreAbonnes: Math.max(0, x.serveur.nombreAbonnes + (oui ? 1 : -1)), moi: { ...x.serveur.moi, abonne: oui } } } : x));
            ranger("suivies", id, oui);
          },
          () => sociaux.listes.suivre(id, oui),
        );
      },
      ajouterLieuListe: (id, lieuId) => {
        if (!trouver(id)?.serveur?.moi.peutRemplir) return;
        void faire(id, () => avecLieu(id, lieuId, true), () => sociaux.listes.basculerLieu(id, lieuId, true));
      },
      retirerLieuListe: (id, lieuId) => {
        if (!trouver(id)?.serveur?.moi.peutRemplir) return;
        void faire(id, () => avecLieu(id, lieuId, false), () => sociaux.listes.basculerLieu(id, lieuId, false));
      },
      invitationsListes: rangements.invitations.map(trouver).filter((l): l is ListePartagee => !!l),
      repondreCoAuteur: async (id, accepte) => {
        ranger("invitations", id, false);
        if (!accepte) {
          const r = await sociaux.listes.retirerCoAuteur(id, "moi");
          if (!r.ok) void chargerTout();
          return r.ok;
        }
        const r = await sociaux.listes.accepterCoAuteur(id);
        if (!r.ok) {
          void chargerTout();
          return false;
        }
        garder([r.liste], null);
        ranger("coEcrites", id, true);
        return true;
      },
      inviterCoAuteur: async (id, poteId) => {
        const r = await faire(id, () => {}, () => sociaux.listes.inviterCoAuteur(id, poteId));
        return r.ok ? null : r.erreur;
      },
      retirerCoAuteur: async (id, poteId) => {
        const qui = poteId === "moi" ? monId : poteId;
        const r = await faire(
          id,
          () => {
            changer(id, (l) => ({
              ...l,
              coAuteurs: (l.coAuteurs ?? []).filter((c) => c.id !== qui),
              ...(poteId === "moi" && l.serveur ? { serveur: { ...l.serveur, moi: { ...l.serveur.moi, coAuteur: null, peutRemplir: false } } } : {}),
            }));
            if (poteId === "moi") ranger("coEcrites", id, false);
          },
          () => sociaux.listes.retirerCoAuteur(id, poteId),
        );
        return r.ok ? null : r.erreur;
      },
    };
  }, [cache, rangements, monId, creerListe, faire, changer, oublier, ranger, garder, lire, chargerTout, sociaux]);
}
