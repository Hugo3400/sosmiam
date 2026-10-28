import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { calculerVisibiliteProfil } from "@sos-miam/commun/regles/calculer-visibilite-profil";
import { estComptePrive } from "@sos-miam/commun/regles/est-compte-prive";
import { peutSuivre } from "@sos-miam/commun/regles/peut-suivre";
import { CONFIDENTIALITE_PAR_DEFAUT } from "@sos-miam/commun/regles/suivis";
import type { Confidentialite, LienSuivi } from "@sos-miam/commun/types/suivis";
import { estAjouteEnVrai } from "~/fonctions/communaute/est-ajoute-en-vrai";
import { construireCibleSuivi } from "~/fonctions/suivi/construire-cible-suivi";
import { convertirLiensEnPersonnes } from "~/fonctions/suivi/convertir-liens-en-personnes";
import { creerLienSuivi } from "~/fonctions/suivi/creer-lien-suivi";
import { filtrerLiensPermis, type ContexteLiensSuivi } from "~/fonctions/suivi/filtrer-liens-permis";
import { listerPotesLiesDe } from "~/fonctions/suivi/lister-potes-lies-de";
import { listerSuivisAffichables } from "~/fonctions/suivi/lister-suivis-affichables";
import { nettoyerSuivisPersonnes } from "~/fonctions/suivi/nettoyer-suivis-personnes";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserPublications } from "~/hooks/utiliser-publications";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";
import type { EtatSuivisPersonnes, RelationPersonne, ResultatSuivre } from "~/hooks/utiliser-suivis-personnes";
import { effacerSuivisPersonnesLocaux, enregistrerSuivisPersonnesLocaux, lireSuivisPersonnesLocaux, type SuivisPersonnesLocaux } from "~/stockage/suivis-personnes-locaux";

type NomListe = "abonnements" | "demandesEnvoyees" | "abonnes" | "demandesRecues";

const AUCUNE_CLE: readonly string[] = [];
const contient = (liens: LienSuivi[], id: string) => liens.some((l) => l.id === id);
/** Au départ : aucun lien, compte public (à changer dans tes réglages) */
const creerSuivisVides = (): Omit<SuivisPersonnesLocaux, "version" | "profilCreeLe"> => ({
  confidentialite: CONFIDENTIALITE_PAR_DEFAUT,
  abonnements: [],
  demandesEnvoyees: [],
  abonnes: [],
  demandesRecues: [],
  suggestionsMasquees: [],
});

const AUCUNE_SUITE = { abonnes: false, abonnements: false } as const;
const rienAFaire = () => {};

/**
 * Abonnés, abonnements et demandes entre personnes, gardés sur le téléphone (visite ; un compte connecté passe par
 * utiliserSuivisPersonnesCompte). Les règles s'appliquent ici, pas seulement à l'écran : peutSuivre au moment de suivre, de
 * demander ou d'accepter ; listes filtrées à la lecture (bloqués, inconnus, doublons). Rien sans profil, ni après « Tout
 * effacer » pour le même profil.
 */
export function utiliserSuivisPersonnesLocaux(): EtatSuivisPersonnes {
  const source = utiliserSourceSociale();
  const { profil } = utiliserProfil();
  const activite = utiliserActivite();
  const communaute = utiliserCommunaute();
  const monId = utiliserMonId();
  const { lieux: tousLesLieux } = utiliserLieux();
  const { publications: toutesLesPublications } = utiliserPublications();
  const { potes, trouverPote, moyenAjout } = communaute;
  const [etat, setEtat] = useState<SuivisPersonnesLocaux | null>(null);
  const [relu, setRelu] = useState(false);
  // L'état le plus récent, lu au moment d'un geste (deux appuis rapides ne suivent pas deux fois)
  const etatCourant = useRef<SuivisPersonnesLocaux | null>(null);
  const effacePour = useRef<string | null>(null);

  const creeLe = profil?.creeLe ?? null;
  const pseudo = profil?.pseudo?.trim() ?? "";
  const pret = relu && communaute.pret && creeLe !== null && etat !== null && etat.profilCreeLe === creeLe;

  useEffect(() => {
    let actif = true;
    lireSuivisPersonnesLocaux().then((lu) => {
      if (!actif) return;
      etatCourant.current = lu;
      setEtat(lu);
      setRelu(true);
    });
    return () => {
      actif = false;
    };
  }, []);

  useLayoutEffect(() => {
    etatCourant.current = etat;
  }, [etat]);

  useEffect(() => {
    if (relu && etat) enregistrerSuivisPersonnesLocaux(etat).catch(() => {});
  }, [relu, etat]);

  /** Change l'état à partir du plus récent ; rien s'il n'existe pas encore ou si rien ne change */
  const changer = useCallback((f: (e: SuivisPersonnesLocaux) => SuivisPersonnesLocaux) => {
    const courant = etatCourant.current;
    if (!courant) return;
    const suivant = f(courant);
    if (suivant === courant) return;
    etatCourant.current = suivant;
    setEtat(suivant);
  }, []);

  // Créé à la première ouverture d'un profil, jamais pour un profil qu'on vient d'effacer
  useEffect(() => {
    if (!relu || !communaute.pret || creeLe === null || effacePour.current === creeLe) return;
    if (etatCourant.current?.profilCreeLe === creeLe) return;
    const neuf: SuivisPersonnesLocaux = { version: 1, profilCreeLe: creeLe, ...creerSuivisVides() };
    etatCourant.current = neuf;
    setEtat(neuf);
  }, [relu, communaute.pret, creeLe, etat]);

  const bloques = useMemo(() => new Set(communaute.bloques.map((p) => p.id)), [communaute.bloques]);
  const prive = etat?.confidentialite === "prive";
  const trouverCible = useCallback((id: string) => {
    const pote = id === monId ? null : trouverPote(id);
    return pote ? construireCibleSuivi(pote) : null;
  }, [trouverPote, monId]);
  const contexte = useMemo<ContexteLiensSuivi>(() => ({ moi: { id: monId, prive }, trouverCible, bloques }), [monId, prive, trouverCible, bloques]);
  const contexteCourant = useRef(contexte);
  useLayoutEffect(() => {
    contexteCourant.current = contexte;
  }, [contexte]);

  // Ménage : bloqués, disparus et doublons
  useEffect(() => {
    if (!pret || !etat) return;
    const suivant = nettoyerSuivisPersonnes(etat, contexte);
    if (suivant !== etat) changer((e) => (e === etat ? suivant : e));
  }, [pret, etat, contexte, changer]);

  // Sans effet si la personne n'y est pas (deux appuis ne cassent rien), ni avant que l'état de ce profil soit prêt
  const retirer = useCallback(
    (liste: NomListe, id: string) => {
      if (pret) changer((e) => (contient(e[liste], id) ? { ...e, [liste]: e[liste].filter((l) => l.id !== id) } : e));
    },
    [pret, changer],
  );

  const suivre = useCallback(
    (id: string): ResultatSuivre => {
      const courant = etatCourant.current;
      const ctx = contexteCourant.current;
      const cible = ctx.trouverCible(id);
      if (!pret || !courant || !cible) return "interdit";
      if (!pseudo) return "pseudo-manquant";
      const verdict = peutSuivre(ctx.moi, cible, { bloque: ctx.bloques.has(id) });
      if (!verdict.permis) return "interdit";
      if (contient(courant.abonnements, id) || contient(courant.demandesEnvoyees, id)) return "deja";
      const lien = creerLienSuivi(id, new Date().toISOString());
      if (verdict.surDemande) {
        changer((e) => ({ ...e, demandesEnvoyees: [...e.demandesEnvoyees, lien] }));
        return "demande";
      }
      changer((e) => ({ ...e, abonnements: [...e.abonnements, lien] }));
      return "suivi";
    },
    [pret, pseudo, changer],
  );

  const accepterDemande = useCallback(
    (id: string) => {
      const courant = etatCourant.current;
      const ctx = contexteCourant.current;
      if (!pret || !courant) return false;
      // Déjà acceptée (deuxième appui) : toujours vrai ; plus là du tout : plus valable
      if (!contient(courant.demandesRecues, id)) return contient(courant.abonnes, id);
      const cible = ctx.trouverCible(id);
      const verdict = cible ? peutSuivre(cible, ctx.moi, { bloque: ctx.bloques.has(id) }) : null;
      if (!verdict?.permis) {
        retirer("demandesRecues", id);
        return false;
      }
      const lien = creerLienSuivi(id, new Date().toISOString());
      changer((e) => ({ ...e, demandesRecues: e.demandesRecues.filter((l) => l.id !== id), abonnes: contient(e.abonnes, id) ? e.abonnes : [...e.abonnes, lien] }));
      return true;
    },
    [pret, changer, retirer],
  );

  const changerConfidentialite = useCallback(
    (choix: Confidentialite): { acceptees: number } => {
      const courant = etatCourant.current;
      if (!pret || !courant || courant.confidentialite === choix) return { acceptees: 0 };
      if (choix === "prive") {
        changer((e) => ({ ...e, confidentialite: "prive" }));
        return { acceptees: 0 };
      }
      // Compte rendu public : les demandes encore valables (ni bloqués ni disparus) deviennent des abonnés, les autres partent sans bruit
      const acceptees = filtrerLiensPermis(courant.demandesRecues, contexteCourant.current).filter((d) => !contient(courant.abonnes, d.id));
      const maintenant = new Date().toISOString();
      changer((e) => ({ ...e, confidentialite: "public", demandesRecues: [], abonnes: [...e.abonnes, ...acceptees.filter((d) => !contient(e.abonnes, d.id)).map((d) => ({ ...d, depuis: maintenant }))] }));
      return { acceptees: acceptees.length };
    },
    [pret, changer],
  );

  const effacer = useCallback(async () => {
    effacePour.current = creeLe;
    etatCourant.current = null;
    setEtat(null);
    await effacerSuivisPersonnesLocaux();
  }, [creeLe]);

  // Tes listes, déjà filtrées (le ménage les enregistrera ensuite)
  const propre = useMemo(() => (pret && etat ? nettoyerSuivisPersonnes(etat, contexte) : null), [pret, etat, contexte]);
  // Lieux et créateurs suivis encore affichables (comptés dans tes abonnements, comme dans « Tu suis »)
  const pagesSuivies = useMemo(() => listerSuivisAffichables(activite.suivis, tousLesLieux, toutesLesPublications).length, [activite.suivis, tousLesLieux, toutesLesPublications]);

  const valeur = useMemo<EtatSuivisPersonnes>(() => {
    const abonnes = propre ? convertirLiensEnPersonnes(propre.abonnes, trouverPote) : [];
    const abonnements = propre ? convertirLiensEnPersonnes(propre.abonnements, trouverPote) : [];
    const idsAbonnes = abonnes.map((p) => p.pote.id);
    const idsAbonnements = abonnements.map((p) => p.pote.id);
    const bandeEnVrai = (id: string) => potes.some((p) => p.id === id) && estAjouteEnVrai(moyenAjout(id));

    const relationAvec = (id: string): RelationPersonne | null => {
      const pote = propre ? trouverPote(id) : null;
      if (!propre || !pote) return null;
      const estMoi = id === monId;
      const cible = estMoi ? contexte.moi : construireCibleSuivi(pote);
      const jeSuis = idsAbonnements.includes(id) ? "suivi" : contient(propre.demandesEnvoyees, id) ? "demande" : "aucun";
      return {
        jeSuis,
        meSuit: idsAbonnes.includes(id),
        demandeRecue: contient(propre.demandesRecues, id),
        verdict: peutSuivre(contexte.moi, cible, { bloque: bloques.has(id) }),
        visibilite: calculerVisibiliteProfil(cible, { estMoi, bandeEnVrai: bandeEnVrai(id), abonne: jeSuis === "suivi" }),
      };
    };

    const lies = { monId, mesAbonnes: idsAbonnes, mesAbonnements: idsAbonnements, bloques, trouverPote };
    const potesLies = (id: string, sens: "abonnes" | "abonnements") => listerPotesLiesDe(id, sens, lies);

    const compteursDe = (id: string) => {
      if (!propre) return null;
      if (id === monId) return { abonnes: abonnes.length, abonnements: abonnements.length + pagesSuivies };
      const relation = relationAvec(id);
      if (!relation || bloques.has(id)) return null;
      return { abonnes: potesLies(id, "abonnes").length, abonnements: potesLies(id, "abonnements").length };
    };

    const listeDe = (id: string, sens: "abonnes" | "abonnements"): ReturnType<EtatSuivisPersonnes["abonnesDe"]> => {
      if (compteursDe(id) === null) return "ferme";
      if (id === monId) return (sens === "abonnes" ? abonnes : abonnements).map((p) => p.pote);
      return relationAvec(id)?.visibilite === "complet" ? potesLies(id, sens) : "ferme";
    };

    const confidentialite = etat?.confidentialite ?? "public";
    return {
      source,
      pret,
      lectureSuivis: pret ? "lue" : "attente",
      confidentialite,
      comptePrive: estComptePrive({ prive: confidentialite === "prive" }),
      changerConfidentialite: async (choix) => changerConfidentialite(choix),
      abonnes,
      abonnements,
      nombreAbonnements: abonnements.length,
      suites: AUCUNE_SUITE,
      chargerSuite: rienAFaire,
      noterProfil: rienAFaire,
      demandesRecues: propre ? convertirLiensEnPersonnes(propre.demandesRecues, trouverPote) : [],
      demandesEnvoyees: propre ? convertirLiensEnPersonnes(propre.demandesEnvoyees, trouverPote) : [],
      relationAvec,
      suivre,
      nePlusSuivre: (id) => retirer("abonnements", id),
      annulerDemande: (id) => retirer("demandesEnvoyees", id),
      accepterDemande,
      refuserDemande: (id) => retirer("demandesRecues", id),
      retirerAbonne: (id) => retirer("abonnes", id),
      compteursDe,
      abonnesDe: (id) => listeDe(id, "abonnes"),
      abonnementsDe: (id) => listeDe(id, "abonnements"),
      suggestionsMasquees: propre?.suggestionsMasquees ?? AUCUNE_CLE,
      masquerSuggestion: (cle) => {
        if (pret) changer((e) => (e.suggestionsMasquees.includes(cle) ? e : { ...e, suggestionsMasquees: [...e.suggestionsMasquees, cle] }));
      },
      effacer,
    };
  }, [source, pret, etat, propre, contexte, bloques, potes, trouverPote, moyenAjout, pagesSuivies, changerConfidentialite, suivre, accepterDemande, retirer, changer, effacer, monId]);

  return valeur;
}
