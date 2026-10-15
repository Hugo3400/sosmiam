import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { calculerNiveauProfil } from "@sos-miam/commun/regles/calculer-niveau-profil";
import { peutSuivre } from "@sos-miam/commun/regles/peut-suivre";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { Pote } from "@sos-miam/commun/types/potes";
import type { ProfilCommunautaireApi, RelationApi } from "@sos-miam/commun/types/social";
import type { Confidentialite, LienSuiviApi, ResumeSuivisApi } from "@sos-miam/commun/types/suivis";
import { convertirPersonneEnPote } from "~/fonctions/communaute/convertir-personne-en-pote";
import { listerSuivisAffichables } from "~/fonctions/suivi/lister-suivis-affichables";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCommunaute, type SurRefusGeste } from "~/hooks/utiliser-communaute";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserPoulsSocial } from "~/hooks/utiliser-pouls-social";
import { utiliserPublications } from "~/hooks/utiliser-publications";
import { utiliserSession } from "~/hooks/utiliser-session";
import type { EtatSuivisPersonnes, PersonneLiee, RelationPersonne, ResultatSuivre, SensSuivi } from "~/hooks/utiliser-suivis-personnes";
import { effacerSuivisPersonnesLocaux } from "~/stockage/suivis-personnes-locaux";

type Page = { liens: LienSuiviApi[]; suite: string | null };
/** Le profil d'une personne lu sur le serveur ; ordre : plus grand que celui des listes, il est plus récent qu'elles */
type ProfilLu = { prive: boolean; compteurs: { abonnes: number; abonnements: number }; relation: RelationApi; ordre: number };
/** Un geste fait à l'écran et pas encore relu sur le serveur : il l'emporte sur une lecture partie avant lui */
type Geste = Partial<Pick<RelationApi, "jeSuis" | "meSuit" | "meDemande">>;

/** Le serveur rend 50 demandes de chaque sens au plus : au-delà, ne pas y être ne veut rien dire */
const MAX_DEMANDES_LUES = 50;
const PAGES_VIDES: Record<SensSuivi, Page> = { abonnes: { liens: [], suite: null }, abonnements: { liens: [], suite: null } };
const sans = (liens: LienSuiviApi[], id: string) => liens.filter((l) => l.personne.id !== id);

/**
 * Tes abonnés, tes abonnements et les demandes quand un compte est connecté : tout vient de l'API (/app/suivis-personnes),
 * relu quand le pouls dit que les demandes ou la cloche ont bougé (une demande, un nouvel abonné, une demande acceptée). Les
 * gestes s'affichent tout de suite, puis la route part et tout est relu. relationAvec suit la lecture la plus récente : les
 * listes, ou le profil de la personne lu juste après (noterProfil). Inactif (démo, visite, attente) : rien n'est lu.
 */
export function utiliserSuivisPersonnesCompte(actif: boolean): EtatSuivisPersonnes {
  const { sociaux } = utiliserSession();
  const { pouls } = utiliserPoulsSocial();
  const communaute = utiliserCommunaute();
  const monId = utiliserMonId();
  const activite = utiliserActivite();
  const { lieux: tousLesLieux } = utiliserLieux();
  const { publications: toutesLesPublications } = utiliserPublications();
  const [resume, setResume] = useState<ResumeSuivisApi | null>(null);
  const [pages, setPages] = useState(PAGES_VIDES);
  const [ordreListes, setOrdreListes] = useState(0);
  const [profils, setProfils] = useState<ReadonlyMap<string, ProfilLu>>(new Map());
  const [gestes, setGestes] = useState<ReadonlyMap<string, Geste>>(new Map());
  const [masquees, setMasquees] = useState<readonly string[]>([]);
  const [lu, setLu] = useState(false);
  // Une réponse arrivée après une déconnexion ne touche à rien ; une lecture dépassée par une plus récente non plus
  const generation = useRef(0);
  const numeroLecture = useRef(0);
  const horloge = useRef(0);
  const suitesEnCours = useRef(new Set<SensSuivi>());
  // Les valeurs les plus récentes, lues au moment d'un geste
  const resumeCourant = useRef(resume);
  const pagesCourantes = useRef(pages);
  const profilsCourants = useRef(profils);
  useLayoutEffect(() => {
    resumeCourant.current = resume;
    pagesCourantes.current = pages;
    profilsCourants.current = profils;
  }, [resume, pages, profils]);
  const { noterPersonne } = communaute;

  const tant = useCallback((g: number) => g === generation.current, []);

  const chargerTout = useCallback(async () => {
    const g = generation.current;
    const numero = ++numeroLecture.current;
    const [r, ab, am] = await Promise.all([sociaux.suivis.lireResume(), sociaux.suivis.listerAbonnes(), sociaux.suivis.listerAbonnements()]);
    if (!tant(g) || numero !== numeroLecture.current) return;
    if (r.ok) setResume(r.suivis);
    if (ab.ok || am.ok) {
      setPages((avant) => ({ abonnes: ab.ok ? { liens: ab.liens, suite: ab.suite } : avant.abonnes, abonnements: am.ok ? { liens: am.liens, suite: am.suite } : avant.abonnements }));
      setOrdreListes(++horloge.current);
    }
    // La communauté connaît ensuite ces personnes (leur profil, la cloche, les écrans qui cherchent par trouverPote)
    const vues = [...(r.ok ? [...r.suivis.demandesRecues, ...r.suivis.demandesEnvoyees] : []), ...(ab.ok ? ab.liens : []), ...(am.ok ? am.liens : [])];
    vues.forEach((l) => noterPersonne(l.personne));
  }, [sociaux, tant, noterPersonne]);

  // Connexion : tout est lu une fois ; déconnexion (ou démo) : tout est oublié
  useEffect(() => {
    generation.current += 1;
    suitesEnCours.current.clear();
    if (!actif) {
      setResume(null);
      setPages(PAGES_VIDES);
      setProfils(new Map());
      setGestes(new Map());
      setMasquees([]);
      setLu(false);
      return;
    }
    const g = generation.current;
    void chargerTout().finally(() => {
      if (tant(g)) setLu(true);
    });
    void sociaux.social.listerMasques("suggestion").then((r) => {
      if (tant(g) && r.ok) setMasquees(r.masques.map((m) => m.cibleId));
    });
  }, [actif, sociaux, chargerTout, tant]);

  // Le pouls dit qu'une demande, un abonné ou une acceptation est arrivé (ou la première lecture avait raté) : on relit
  const signature = pouls ? `${pouls.demandes.signature}|${pouls.cloche.signature}` : null;
  const derniereSignature = useRef<string | null>(null);
  useEffect(() => {
    if (!actif || signature === null) return;
    const change = derniereSignature.current !== null && derniereSignature.current !== signature;
    derniereSignature.current = signature;
    if (change || (lu && resumeCourant.current === null)) void chargerTout();
  }, [actif, signature, lu, chargerTout]);

  /**
   * Le geste s'affiche tout de suite (gestes, listes, profil lu) ; la route part ; puis tout est relu et le geste oublié.
   * `appliquer` rend l'écart qu'il a posé sur les abonnés de la personne (changerCompteurs), ou rien. Refusé (compte limité,
   * réseau…) : le profil lu reprend la relation d'avant le geste et défait son écart (relire les listes ne relit pas son
   * profil ; deux gestes refusés qui se croisent retombent ainsi sur le bon nombre d'abonnés), et surRefus dit pourquoi
   */
  const faire = useCallback(
    (id: string, geste: Geste, appliquer: () => number | void, route: () => Promise<{ ok: true } | { ok: false; erreur: ErreurService }>, surRefus?: SurRefusGeste) => {
      const avantGeste = profilsCourants.current.get(id);
      setGestes((avant) => new Map(avant).set(id, { ...avant.get(id), ...geste }));
      setProfils((avant) => {
        const p = avant.get(id);
        return p ? new Map(avant).set(id, { ...p, relation: { ...p.relation, ...geste } }) : avant;
      });
      const ecart = appliquer() ?? 0;
      const g = generation.current;
      void route()
        .catch(() => ({ ok: false as const, erreur: "hors-ligne" as const }))
        .then((r) => {
          if (!tant(g)) return;
          if (!r.ok) {
            if (avantGeste) {
              const remise = Object.fromEntries(Object.keys(geste).map((cle) => [cle, avantGeste.relation[cle as keyof Geste]])) as Geste;
              setProfils((avant) => {
                const p = avant.get(id);
                if (!p) return avant;
                // Relu entre-temps (noterProfil) : ses compteurs viennent du serveur, ils sont déjà les bons ; sinon, l'inverse du geste
                const compteurs = p.ordre === avantGeste.ordre ? { ...p.compteurs, abonnes: Math.max(0, p.compteurs.abonnes - ecart) } : p.compteurs;
                return new Map(avant).set(id, { ...p, compteurs, relation: { ...p.relation, ...remise } });
              });
            }
            surRefus?.(r.erreur);
          }
          return chargerTout();
        })
        .finally(() => {
          if (!tant(g)) return;
          setGestes((avant) => {
            const apres = new Map(avant);
            apres.delete(id);
            return apres;
          });
        });
    },
    [tant, chargerTout],
  );

  const changerCompteurs = useCallback((id: string, abonnes: number) => {
    setProfils((avant) => {
      const p = avant.get(id);
      return p ? new Map(avant).set(id, { ...p, compteurs: { ...p.compteurs, abonnes: Math.max(0, p.compteurs.abonnes + abonnes) } }) : avant;
    });
  }, []);

  const noterProfil = useCallback((profil: ProfilCommunautaireApi) => {
    const { relation } = profil;
    if (!relation) return;
    setProfils((avant) => new Map(avant).set(profil.id, { prive: profil.prive, compteurs: profil.compteurs, relation, ordre: ++horloge.current }));
  }, []);

  const chargerSuite = useCallback(
    (sens: SensSuivi) => {
      const suite = pagesCourantes.current[sens].suite;
      if (!actif || !suite || suitesEnCours.current.has(sens)) return;
      suitesEnCours.current.add(sens);
      const g = generation.current;
      const lire = sens === "abonnes" ? sociaux.suivis.listerAbonnes : sociaux.suivis.listerAbonnements;
      void lire(suite)
        .then((r) => {
          if (!tant(g) || !r.ok) return;
          r.liens.forEach((l) => noterPersonne(l.personne));
          setPages((avant) => {
            // Relue entre-temps depuis le début : cette suite ne va plus avec
            if (avant[sens].suite !== suite) return avant;
            const deja = new Set(avant[sens].liens.map((l) => l.personne.id));
            return { ...avant, [sens]: { liens: [...avant[sens].liens, ...r.liens.filter((l) => !deja.has(l.personne.id))], suite: r.suite } };
          });
        })
        .finally(() => suitesEnCours.current.delete(sens));
    },
    [actif, sociaux, tant, noterPersonne],
  );

  const changerConfidentialite = useCallback(
    async (choix: Confidentialite) => {
      const prive = choix === "prive";
      const avant = resumeCourant.current;
      if (!actif || !avant) return null;
      if (avant.prive === prive) return { acceptees: 0 };
      const g = generation.current;
      setResume((r) => (r ? { ...r, prive } : r));
      const r = await sociaux.suivis.changerConfidentialite(prive).catch(() => null);
      if (!tant(g)) return null;
      if (!r?.ok) {
        setResume((e) => (e ? { ...e, prive: avant.prive } : e));
        return null;
      }
      void chargerTout();
      return { acceptees: r.acceptees };
    },
    [actif, sociaux, tant, chargerTout],
  );

  const pret = actif && lu && communaute.pret;
  const pagesSuivies = useMemo(() => listerSuivisAffichables(activite.suivis, tousLesLieux, toutesLesPublications).length, [activite.suivis, tousLesLieux, toutesLesPublications]);

  return useMemo((): EtatSuivisPersonnes => {
    const { trouverPote, potes, moi } = communaute;
    const bloques = new Set(communaute.bloques.map((p) => p.id));
    const ids = (liens: LienSuiviApi[] | undefined) => new Set((liens ?? []).map((l) => l.personne.id));
    const dansListe = { abonnes: ids(pages.abonnes.liens), abonnements: ids(pages.abonnements.liens), recues: ids(resume?.demandesRecues), envoyees: ids(resume?.demandesEnvoyees) };
    const complet = {
      abonnes: pages.abonnes.suite === null,
      abonnements: pages.abonnements.suite === null,
      recues: (resume?.demandesRecues.length ?? 0) < MAX_DEMANDES_LUES,
      envoyees: (resume?.demandesEnvoyees.length ?? 0) < MAX_DEMANDES_LUES,
    };
    const connues = new Map([...pages.abonnes.liens, ...pages.abonnements.liens, ...(resume?.demandesRecues ?? []), ...(resume?.demandesEnvoyees ?? [])].map((l) => [l.personne.id, l.personne]));
    const trouver = (id: string) => {
      const connue = connues.get(id);
      return trouverPote(id) ?? (connue ? convertirPersonneEnPote(connue) : null);
    };

    /** Ce que disent les listes, ou le profil lu s'il est plus récent qu'elles (ou qu'elles sont coupées), puis le geste en cours */
    const lireRelation = (id: string): Pick<RelationApi, "jeSuis" | "meSuit" | "meDemande"> => {
      const p = profils.get(id);
      const profilPlusRecent = p !== undefined && p.ordre > ordreListes;
      const r = p?.relation;
      const parListes = {
        jeSuis: dansListe.abonnements.has(id) ? "suivi" : dansListe.envoyees.has(id) ? "demande" : !complet.abonnements && r?.jeSuis === "suivi" ? "suivi" : !complet.envoyees && r?.jeSuis === "demande" ? "demande" : "aucun",
        meSuit: dansListe.abonnes.has(id) || (!complet.abonnes && r?.meSuit === true),
        meDemande: dansListe.recues.has(id) || (!complet.recues && r?.meDemande === true),
      } as const;
      const base = profilPlusRecent && r ? { jeSuis: r.jeSuis, meSuit: r.meSuit, meDemande: r.meDemande } : parListes;
      return { ...base, ...gestes.get(id) };
    };

    const prive = resume?.prive ?? false;
    const relationAvec = (id: string): RelationPersonne | null => {
      if (!pret || !id) return null;
      const estMoi = id === monId;
      if (!estMoi && !trouver(id)) return null;
      const { jeSuis, meSuit, meDemande } = lireRelation(id);
      // Un compte dont on n'a pas lu le profil : « Suivre » (le serveur dira s'il faut demander), mais rien d'ouvert d'avance
      const sonPrive = profils.get(id)?.prive;
      const niveau = calculerNiveauProfil({ prive: estMoi ? prive : (sonPrive ?? true) }, { estMoi, pote: potes.some((p) => p.id === id), abonne: jeSuis === "suivi" });
      return {
        jeSuis: estMoi ? "aucun" : jeSuis,
        meSuit: !estMoi && meSuit,
        demandeRecue: !estMoi && meDemande,
        verdict: peutSuivre({ id: monId }, { id, prive: sonPrive ?? false }, { bloque: bloques.has(id) }),
        visibilite: niveau === "prive" ? "prive" : "complet",
      };
    };

    const enLiees = (liens: LienSuiviApi[] | undefined, garder: (g: Geste | undefined) => boolean): PersonneLiee[] =>
      (liens ?? [])
        .filter((l) => !bloques.has(l.personne.id) && garder(gestes.get(l.personne.id)))
        .map((l) => ({ pote: trouverPote(l.personne.id) ?? convertirPersonneEnPote(l.personne), depuis: l.depuis }));
    const abonnes = enLiees(pages.abonnes.liens, (g) => g?.meSuit !== false);
    const abonnements = enLiees(pages.abonnements.liens, (g) => g?.jeSuis === undefined || g.jeSuis === "suivi");
    const demandesRecues = enLiees(resume?.demandesRecues, (g) => g?.meDemande !== false);
    const demandesEnvoyees = enLiees(resume?.demandesEnvoyees, (g) => g?.jeSuis === undefined || g.jeSuis === "demande");

    const lienDe = (id: string): LienSuiviApi | null => {
      const personne = connues.get(id);
      const pote = personne ? null : trouverPote(id);
      const resumeDe = personne ?? (pote ? { id: pote.id, pseudo: pote.pseudo, prenom: pote.prenom, avatar: pote.avatar } : null);
      return resumeDe ? { personne: resumeDe, depuis: new Date().toISOString() } : null;
    };

    const suivre = (id: string, surRefus?: SurRefusGeste): ResultatSuivre => {
      const relation = relationAvec(id);
      if (!relation || !relation.verdict.permis) return "interdit";
      if (!moi.pseudo.trim()) return "pseudo-manquant";
      if (relation.jeSuis !== "aucun") return "deja";
      const etat = relation.verdict.surDemande ? "demande" : "suivi";
      const lien = lienDe(id);
      faire(
        id,
        { jeSuis: etat },
        () => {
          if (!lien) return;
          if (etat === "suivi") {
            setPages((p) => ({ ...p, abonnements: { ...p.abonnements, liens: [lien, ...sans(p.abonnements.liens, id)] } }));
            setResume((r) => (r ? { ...r, abonnements: r.abonnements + 1 } : r));
            changerCompteurs(id, 1);
            return 1;
          }
          setResume((r) => (r ? { ...r, demandesEnvoyees: [lien, ...sans(r.demandesEnvoyees, id)] } : r));
        },
        () => sociaux.suivis.suivre(id, true),
        surRefus,
      );
      return etat;
    };

    /** Ne plus suivre ou annuler la demande : la même route */
    const arreter = (id: string, quoi: "suivi" | "demande") => {
      if (!pret || lireRelation(id).jeSuis !== quoi) return;
      faire(
        id,
        { jeSuis: "aucun" },
        () => {
          if (quoi === "suivi") {
            setPages((p) => ({ ...p, abonnements: { ...p.abonnements, liens: sans(p.abonnements.liens, id) } }));
            setResume((r) => (r ? { ...r, abonnements: Math.max(0, r.abonnements - 1) } : r));
            changerCompteurs(id, -1);
            return -1;
          }
          setResume((r) => (r ? { ...r, demandesEnvoyees: sans(r.demandesEnvoyees, id) } : r));
        },
        () => sociaux.suivis.suivre(id, false),
      );
    };

    const accepterDemande = (id: string) => {
      const relation = lireRelation(id);
      if (!pret || bloques.has(id)) return false;
      if (!relation.meDemande) return relation.meSuit;
      const lien = lienDe(id);
      faire(
        id,
        { meDemande: false, meSuit: true },
        () => {
          setResume((r) => (r ? { ...r, abonnes: r.abonnes + 1, demandesRecues: sans(r.demandesRecues, id) } : r));
          if (lien) setPages((p) => ({ ...p, abonnes: { ...p.abonnes, liens: [lien, ...sans(p.abonnes.liens, id)] } }));
        },
        () => sociaux.suivis.repondreDemande(id, true),
      );
      return true;
    };

    const refuserDemande = (id: string) => {
      if (!pret || !lireRelation(id).meDemande) return;
      faire(id, { meDemande: false }, () => setResume((r) => (r ? { ...r, demandesRecues: sans(r.demandesRecues, id) } : r)), () => sociaux.suivis.repondreDemande(id, false));
    };

    const retirerAbonne = (id: string) => {
      if (!pret || !lireRelation(id).meSuit) return;
      faire(
        id,
        { meSuit: false },
        () => {
          setPages((p) => ({ ...p, abonnes: { ...p.abonnes, liens: sans(p.abonnes.liens, id) } }));
          setResume((r) => (r ? { ...r, abonnes: Math.max(0, r.abonnes - 1) } : r));
        },
        () => sociaux.suivis.retirerAbonne(id),
      );
    };

    const compteursDe = (id: string) => {
      if (!pret) return null;
      if (id === monId) return { abonnes: resume?.abonnes ?? abonnes.length, abonnements: (resume?.abonnements ?? abonnements.length) + pagesSuivies };
      if (bloques.has(id)) return null;
      return profils.get(id)?.compteurs ?? null;
    };

    // Les listes de quelqu'un d'autre ne s'ouvrent qu'à sa bande (le serveur répond « profil-prive » sinon)
    const listeDe = (id: string, sens: SensSuivi): Pote[] | "ferme" => {
      if (compteursDe(id) === null) return "ferme";
      if (id === monId) return (sens === "abonnes" ? abonnes : abonnements).map((p) => p.pote);
      return potes.some((p) => p.id === id) ? [] : "ferme";
    };

    return {
      source: "compte",
      pret,
      confidentialite: prive ? "prive" : "public",
      comptePrive: prive,
      changerConfidentialite,
      abonnes,
      abonnements,
      nombreAbonnements: resume?.abonnements ?? abonnements.length,
      suites: { abonnes: pages.abonnes.suite !== null, abonnements: pages.abonnements.suite !== null },
      chargerSuite,
      noterProfil,
      demandesRecues,
      demandesEnvoyees,
      relationAvec,
      suivre,
      nePlusSuivre: (id) => arreter(id, "suivi"),
      annulerDemande: (id) => arreter(id, "demande"),
      accepterDemande,
      refuserDemande,
      retirerAbonne,
      compteursDe,
      abonnesDe: (id) => listeDe(id, "abonnes"),
      abonnementsDe: (id) => listeDe(id, "abonnements"),
      suggestionsMasquees: masquees,
      masquerSuggestion: (cle) => {
        if (!pret || masquees.includes(cle)) return;
        setMasquees((avant) => [...avant, cle]);
        void sociaux.social.masquer("suggestion", cle, true);
      },
      // Tes suivis restent sur le serveur : seul ce que le téléphone gardait d'avant (démo, visite) part
      effacer: effacerSuivisPersonnesLocaux,
    };
  }, [pret, communaute, monId, resume, pages, ordreListes, profils, gestes, masquees, pagesSuivies, sociaux, faire, changerCompteurs, changerConfidentialite, chargerSuite, noterProfil]);
}
