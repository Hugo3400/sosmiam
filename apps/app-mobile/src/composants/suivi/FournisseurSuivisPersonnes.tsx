import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { calculerVisibiliteProfil } from "@sos-miam/commun/regles/calculer-visibilite-profil";
import { estComptePrive } from "@sos-miam/commun/regles/est-compte-prive";
import { peutSuivre } from "@sos-miam/commun/regles/peut-suivre";
import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { Pote } from "@sos-miam/commun/types/potes";
import type { Confidentialite, LienSuivi } from "@sos-miam/commun/types/suivis";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { creerSuivisDemo, DEMANDE_APRES_PASSAGE_PRIVE, grapheSuivisExemples, reactionsExemples } from "~/contenus/suivis-exemples";
import { estAjouteEnVrai } from "~/fonctions/communaute/est-ajoute-en-vrai";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { appliquerReactionDemo, type ReactionDemo } from "~/fonctions/suivi/appliquer-reaction-demo";
import { construireCibleSuivi } from "~/fonctions/suivi/construire-cible-suivi";
import { creerLienSuivi } from "~/fonctions/suivi/creer-lien-suivi";
import { filtrerLiensPermis, type ContexteLiensSuivi } from "~/fonctions/suivi/filtrer-liens-permis";
import { listerAbonnementsDe } from "~/fonctions/suivi/lister-abonnements-de";
import { listerAbonnesDe } from "~/fonctions/suivi/lister-abonnes-de";
import { listerSuivisAffichables } from "~/fonctions/suivi/lister-suivis-affichables";
import { nettoyerSuivisPersonnes } from "~/fonctions/suivi/nettoyer-suivis-personnes";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserNotifications } from "~/hooks/utiliser-notifications";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { ContexteSuivisPersonnes, type EtatSuivisPersonnes, type PersonneLiee, type RelationPersonne, type ResultatSuivre } from "~/hooks/utiliser-suivis-personnes";
import { effacerSuivisPersonnesLocaux, enregistrerSuivisPersonnesLocaux, lireSuivisPersonnesLocaux, type SuivisPersonnesLocaux } from "~/stockage/suivis-personnes-locaux";

type NomListe = "abonnements" | "demandesEnvoyees" | "abonnes" | "demandesRecues";

const AUCUNE_CLE: readonly string[] = [];
const contient = (liens: LienSuivi[], id: string) => liens.some((l) => l.id === id);
/** En personnes connues, la plus récente d'abord */
const enPersonnes = (liens: LienSuivi[], trouverPote: (id: string) => Pote | null): PersonneLiee[] =>
  liens
    .flatMap((l) => {
      const pote = trouverPote(l.id);
      return pote ? [{ pote, depuis: l.depuis, ...(l.surveillance ? { surveillance: true } : {}) }] : [];
    })
    .sort((a, b) => b.depuis.localeCompare(a.depuis));

/**
 * Abonnés, abonnements et demandes entre personnes (démo gardée sur le téléphone en attendant l'API). Les règles s'appliquent
 * ici, pas seulement à l'écran : peutSuivre au moment de suivre, de demander ou d'accepter ; listes filtrées à la lecture
 * (bloqués, inconnus, et l'âge pour les demandes en attente : un abonnement accepté reste à 18 ans) ; compte privé d'office
 * entre 15 et 17 ans. Pas de démo sans profil (âge inconnu, visite sans compte), ni après « Tout effacer » pour le même profil.
 */
export function FournisseurSuivisPersonnes({ children }: { children: ReactNode }) {
  const { profil } = utiliserProfil();
  const activite = utiliserActivite();
  const communaute = utiliserCommunaute();
  const { ajouter } = utiliserNotifications();
  const { moiMineur, potes, trouverPote, moyenAjout } = communaute;
  const [etat, setEtat] = useState<SuivisPersonnesLocaux | null>(null);
  const [relu, setRelu] = useState(false);
  // L'état le plus récent, lu au moment d'un geste ou d'une minuterie (deux appuis rapides ne suivent pas deux fois)
  const etatCourant = useRef<SuivisPersonnesLocaux | null>(null);
  const effacePour = useRef<string | null>(null);
  const minuteries = useRef<ReturnType<typeof setTimeout>[]>([]);

  const creeLe = profil?.creeLe ?? null;
  const pseudo = profil?.pseudo?.trim() ?? "";
  const age = profil ? calculerAge(profil.dateNaissance) : null;
  const pret = relu && communaute.pret && creeLe !== null && etat !== null && etat.profilCreeLe === creeLe;

  useEffect(() => {
    let actif = true;
    lireSuivisPersonnesLocaux().then((lu) => {
      if (!actif) return;
      etatCourant.current = lu;
      setEtat(lu);
      setRelu(true);
    });
    const enCours = minuteries.current;
    return () => {
      actif = false;
      enCours.forEach(clearTimeout);
    };
  }, []);

  useLayoutEffect(() => {
    etatCourant.current = etat;
  }, [etat]);

  useEffect(() => {
    if (relu && etat) enregistrerSuivisPersonnesLocaux(etat).catch(() => {});
  }, [relu, etat]);

  /** Change l'état à partir du plus récent ; rien si la démo n'existe pas ou si rien ne change */
  const changer = useCallback((f: (e: SuivisPersonnesLocaux) => SuivisPersonnesLocaux) => {
    const courant = etatCourant.current;
    if (!courant) return;
    const suivant = f(courant);
    if (suivant === courant) return;
    etatCourant.current = suivant;
    setEtat(suivant);
  }, []);

  // Démo créée à la première ouverture d'un profil (âge connu), jamais pour un profil qu'on vient d'effacer
  useEffect(() => {
    if (!relu || !communaute.pret || creeLe === null || effacePour.current === creeLe) return;
    if (etatCourant.current?.profilCreeLe === creeLe) return;
    const neuf: SuivisPersonnesLocaux = { version: 1, profilCreeLe: creeLe, ...creerSuivisDemo(moiMineur, new Date()) };
    etatCourant.current = neuf;
    setEtat(neuf);
  }, [relu, communaute.pret, creeLe, moiMineur, etat]);

  const bloques = useMemo(() => new Set(communaute.bloques.map((p) => p.id)), [communaute.bloques]);
  const prive = etat?.confidentialite === "prive";
  const trouverCible = useCallback((id: string) => {
    const pote = id === ID_MOI ? null : trouverPote(id);
    return pote ? construireCibleSuivi(pote) : null;
  }, [trouverPote]);
  const contexte = useMemo<ContexteLiensSuivi>(() => ({ moi: { id: ID_MOI, mineur: moiMineur, prive, createur: false }, trouverCible, bloques }), [moiMineur, prive, trouverCible, bloques]);
  const contexteCourant = useRef(contexte);
  useLayoutEffect(() => {
    contexteCourant.current = contexte;
  }, [contexte]);

  // Ménage : bloqués, disparus, demandes que l'âge ne permet plus ; privé d'office entre 15 et 17 ans ; 🎂 une fois à 18 ans
  useEffect(() => {
    if (!pret || !etat) return;
    let suivant = nettoyerSuivisPersonnes(etat, contexte);
    if (moiMineur && suivant.confidentialite === "public") suivant = { ...suivant, confidentialite: "prive" };
    const majorite = !moiMineur && suivant.etaitMineur === true;
    if (moiMineur !== (suivant.etaitMineur === true)) suivant = { ...suivant, etaitMineur: moiMineur };
    if (suivant === etat) return;
    changer((e) => (e === etat ? suivant : e));
    if (majorite && etatCourant.current === suivant) ajouter({ type: "majorite" });
  }, [pret, etat, contexte, moiMineur, changer, ajouter]);

  // Démo : une réaction un peu plus tard, revérifiée quand elle arrive (bloqué, ne plus suivre, demande annulée entre-temps…)
  const plusTard = useCallback(
    (delai: number, reaction: ReactionDemo) => {
      const pour = etatCourant.current?.profilCreeLe;
      minuteries.current.push(
        setTimeout(() => {
          const courant = etatCourant.current;
          if (!courant || courant.profilCreeLe !== pour) return;
          const { etat: suivant, notification } = appliquerReactionDemo(courant, reaction, contexteCourant.current, new Date().toISOString());
          if (suivant === courant) return;
          changer(() => suivant);
          if (notification) ajouter(notification);
        }, delai),
      );
    },
    [changer, ajouter],
  );

  const retirer = useCallback(
    (liste: NomListe, id: string) => changer((e) => (contient(e[liste], id) ? { ...e, [liste]: e[liste].filter((l) => l.id !== id) } : e)),
    [changer],
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
      const lien = creerLienSuivi(id, new Date().toISOString(), verdict.surveillance);
      const reaction = reactionsExemples[id];
      if (verdict.surDemande) {
        changer((e) => ({ ...e, demandesEnvoyees: [...e.demandesEnvoyees, lien] }));
        if (reaction?.accepteApres !== undefined) plusTard(reaction.accepteApres, { type: "accepte-ta-demande", id });
        return "demande";
      }
      changer((e) => ({ ...e, abonnements: [...e.abonnements, lien] }));
      if (reaction?.suitEnRetourApres !== undefined && !contient(courant.abonnes, id)) plusTard(reaction.suitEnRetourApres, { type: "suit-en-retour", id });
      return "suivi";
    },
    [pret, pseudo, changer, plusTard],
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
      const lien = creerLienSuivi(id, new Date().toISOString(), verdict.surveillance);
      changer((e) => ({ ...e, demandesRecues: e.demandesRecues.filter((l) => l.id !== id), abonnes: contient(e.abonnes, id) ? e.abonnes : [...e.abonnes, lien] }));
      return true;
    },
    [pret, changer, retirer],
  );

  const changerConfidentialite = useCallback(
    (choix: Confidentialite): { resultat: "ok" | "verrouille"; acceptees: number } => {
      const courant = etatCourant.current;
      const ctx = contexteCourant.current;
      // Âge inconnu compris : verrouillé
      if (ctx.moi.mineur) return { resultat: "verrouille", acceptees: 0 };
      if (!pret || !courant || courant.confidentialite === choix) return { resultat: "ok", acceptees: 0 };
      if (choix === "prive") {
        changer((e) => ({ ...e, confidentialite: "prive" }));
        plusTard(DEMANDE_APRES_PASSAGE_PRIVE.apres, { type: "demande-a-te-suivre", id: DEMANDE_APRES_PASSAGE_PRIVE.id });
        return { resultat: "ok", acceptees: 0 };
      }
      // Compte rendu public : les demandes encore permises deviennent des abonnés (les autres partent sans bruit)
      const enPublic = { ...ctx, moi: { ...ctx.moi, prive: false } };
      const acceptees = filtrerLiensPermis(courant.demandesRecues, "vers-moi", "en-attente", enPublic).filter((d) => !contient(courant.abonnes, d.id));
      const maintenant = new Date().toISOString();
      changer((e) => ({ ...e, confidentialite: "public", demandesRecues: [], abonnes: [...e.abonnes, ...acceptees.filter((d) => !contient(e.abonnes, d.id)).map((d) => ({ ...d, depuis: maintenant }))] }));
      return { resultat: "ok", acceptees: acceptees.length };
    },
    [pret, changer, plusTard],
  );

  const effacer = useCallback(async () => {
    minuteries.current.forEach(clearTimeout);
    minuteries.current.length = 0;
    effacePour.current = creeLe;
    etatCourant.current = null;
    setEtat(null);
    await effacerSuivisPersonnesLocaux();
  }, [creeLe]);

  // Tes listes, déjà filtrées (le ménage les enregistrera ensuite)
  const propre = useMemo(() => (pret && etat ? nettoyerSuivisPersonnes(etat, contexte) : null), [pret, etat, contexte]);
  // Lieux et créateurs suivis encore affichables (comptés dans tes abonnements, comme dans « Tu suis »)
  const pagesSuivies = useMemo(() => listerSuivisAffichables(activite.suivis, filtrerLieuxSelonAge(lieuxExemples, age)).length, [activite.suivis, age]);

  const valeur = useMemo<EtatSuivisPersonnes>(() => {
    const abonnes = propre ? enPersonnes(propre.abonnes, trouverPote) : [];
    const abonnements = propre ? enPersonnes(propre.abonnements, trouverPote) : [];
    const idsAbonnes = abonnes.map((p) => p.pote.id);
    const idsAbonnements = abonnements.map((p) => p.pote.id);
    const bandeEnVrai = (id: string) => potes.some((p) => p.id === id) && estAjouteEnVrai(moyenAjout(id));

    const relationAvec = (id: string): RelationPersonne | null => {
      const pote = propre ? trouverPote(id) : null;
      if (!propre || !pote) return null;
      const estMoi = id === ID_MOI;
      const cible = estMoi ? contexte.moi : construireCibleSuivi(pote);
      const jeSuis = idsAbonnements.includes(id) ? "suivi" : contient(propre.demandesEnvoyees, id) ? "demande" : "aucun";
      return {
        jeSuis,
        meSuit: idsAbonnes.includes(id),
        demandeRecue: contient(propre.demandesRecues, id),
        verdict: peutSuivre(contexte.moi, cible, { bloque: bloques.has(id) }),
        visibilite: calculerVisibiliteProfil(contexte.moi, cible, { estMoi, bandeEnVrai: bandeEnVrai(id), abonne: jeSuis === "suivi" }),
      };
    };

    // Les listes d'une autre personne : graphe de la démo (et toi), sans bloqués ni inconnus ; un adulte n'y voit pas les mineurs
    const potesLies = (id: string, sens: "abonnes" | "abonnements"): Pote[] =>
      (sens === "abonnes" ? listerAbonnesDe(id, grapheSuivisExemples, idsAbonnements) : listerAbonnementsDe(id, grapheSuivisExemples, idsAbonnes)).flatMap((autre) => {
        const pote = bloques.has(autre) ? null : trouverPote(autre);
        return pote && (moiMineur || !pote.mineur) ? [pote] : [];
      });

    const compteursDe = (id: string) => {
      if (!propre) return null;
      if (id === ID_MOI) return { abonnes: abonnes.length, abonnements: abonnements.length + pagesSuivies };
      const relation = relationAvec(id);
      if (!relation || relation.visibilite === "reserve" || bloques.has(id) || (trouverPote(id)?.mineur && !moiMineur)) return null;
      return { abonnes: potesLies(id, "abonnes").length, abonnements: potesLies(id, "abonnements").length };
    };

    const listeDe = (id: string, sens: "abonnes" | "abonnements"): Pote[] | "ferme" => {
      if (compteursDe(id) === null) return "ferme";
      if (id === ID_MOI) return (sens === "abonnes" ? abonnes : abonnements).map((p) => p.pote);
      return relationAvec(id)?.visibilite === "complet" ? potesLies(id, sens) : "ferme";
    };

    const confidentialite = etat?.confidentialite ?? "public";
    return {
      pret,
      confidentialite,
      comptePrive: estComptePrive({ mineur: moiMineur, prive: confidentialite === "prive" }),
      confidentialiteVerrouillee: moiMineur,
      changerConfidentialite,
      abonnes,
      abonnements,
      demandesRecues: propre ? enPersonnes(propre.demandesRecues, trouverPote) : [],
      demandesEnvoyees: propre ? enPersonnes(propre.demandesEnvoyees, trouverPote) : [],
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
      masquerSuggestion: (cle) => changer((e) => (e.suggestionsMasquees.includes(cle) ? e : { ...e, suggestionsMasquees: [...e.suggestionsMasquees, cle] })),
      effacer,
    };
  }, [pret, etat, propre, contexte, bloques, moiMineur, potes, trouverPote, moyenAjout, pagesSuivies, changerConfidentialite, suivre, accepterDemande, retirer, changer, effacer]);

  return <ContexteSuivisPersonnes.Provider value={valeur}>{children}</ContexteSuivisPersonnes.Provider>;
}
