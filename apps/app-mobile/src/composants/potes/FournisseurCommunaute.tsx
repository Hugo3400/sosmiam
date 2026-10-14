import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { extraireMentions } from "@sos-miam/commun/fonctions/commentaires/extraire-mentions";
import { trierCommentaires } from "@sos-miam/commun/fonctions/commentaires/trier-commentaires";
import { calculerClassement } from "@sos-miam/commun/fonctions/potes/calculer-classement";
import { choisirLieuGagnant } from "@sos-miam/commun/fonctions/sorties/choisir-lieu-gagnant";
import { estVoteTermine } from "@sos-miam/commun/fonctions/sorties/est-vote-termine";
import { LONGUEUR_MAX_COMMENTAIRE } from "@sos-miam/commun/regles/mots-interdits";
import {
  ID_MOI,
  LONGUEUR_MAX_MESSAGE,
  LONGUEUR_MAX_MOT_RECOMMANDATION,
  LONGUEUR_MAX_TITRE_SORTIE,
  MAX_PARTICIPANTS_SORTIE,
  MAX_PROPOSITIONS_SORTIE,
} from "@sos-miam/commun/regles/potes";
import type { Pote, PropositionSortie, Sortie } from "@sos-miam/commun/types/potes";
import { contientMotInterdit } from "@sos-miam/commun/validation/contient-mot-interdit";
import { creerCommentairesExemples } from "~/contenus/commentaires-exemples";
import { bandeExemple, creerDonneesExemplePotes, potesExemples, reponsesExemples, VERSION_EXEMPLES } from "~/contenus/potes-exemples";
import { calculerPointsLocaux } from "~/fonctions/ambassadeur/calculer-points-locaux";
import { listerBadgesObtenus } from "~/fonctions/ambassadeur/lister-badges-obtenus";
import { ajouterNouveauxExemples } from "~/fonctions/communaute/ajouter-nouveaux-exemples";
import { basculerVote } from "~/fonctions/communaute/basculer-vote";
import { chercherParPseudo } from "~/fonctions/communaute/chercher-par-pseudo";
import { construireMoi } from "~/fonctions/communaute/construire-moi";
import { creerIdentifiant } from "~/fonctions/communaute/creer-identifiant";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { ContexteCommunaute, type EtatCommunaute, type ResultatTexte } from "~/hooks/utiliser-communaute";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";
import { effacerCommunauteLocale, enregistrerCommunauteLocale, lireCommunauteLocale, type CommunauteLocale } from "~/stockage/communaute-locale";

/** La démo de départ : ta bande d'exemple, ses sorties, listes, activité, recommandations et commentaires */
const creerEtatDemo = (maintenant: Date): CommunauteLocale => ({
  version: 1,
  bande: bandeExemple,
  bloques: [],
  ...creerDonneesExemplePotes(maintenant),
  commentaires: creerCommentairesExemples(maintenant),
  signalements: [],
  moyens: {},
  masques: [],
  exemples: VERSION_EXEMPLES,
});

/** Hors démo : personne pour l'instant (tes vrais potes arriveront avec l'API) ; « exemples: 0 » la distingue d'une démo */
const creerEtatVide = (): CommunauteLocale => ({
  version: 1,
  bande: [],
  bloques: [],
  sorties: [],
  listes: [],
  activites: [],
  recommandations: [],
  commentaires: [],
  signalements: [],
  moyens: {},
  masques: [],
  exemples: 0,
});
const creerEtatDepart = (maintenant: Date) => (DEMO_VISITES_ACTIVE ? creerEtatDemo(maintenant) : creerEtatVide());
// Les potes qu'on peut trouver : ceux de la démo, ou personne
const potesConnus = DEMO_VISITES_ACTIVE ? potesExemples : [];

const verifierTexte = (texte: string, max: number): ResultatTexte => {
  const propre = texte.trim();
  if (propre === "") return "vide";
  if (propre.length > max) return "trop-long";
  return contientMotInterdit(propre) ? "mot-interdit" : "ok";
};
const auHasard = <T,>(liste: T[]): T => liste[Math.floor(Math.random() * liste.length)];
/** Le lieu retenu d'après le nombre de votes de chaque proposition (à égalité, la première proposée) */
const choisirGagnant = (propositions: PropositionSortie[]) => choisirLieuGagnant(propositions.map((p) => ({ lieuId: p.lieuId, votes: p.votes.length })));
const entre = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Potes, sorties, listes, activité, lieux envoyés entre potes et commentaires, gardés sur le téléphone. Mode démo : une
 * bande d'exemple qui vote et répond toute seule. Sinon : vide (tes vrais potes arriveront avec l'API), et ce qu'une
 * ancienne démo avait gardé sur le téléphone est oublié. Ces données te désignent par ID_MOI (« moi ») : c'est la future
 * communauté du téléphone (lot A2) ; les écrans, eux, lisent ton identifiant par utiliserMonId.
 */
export function FournisseurCommunaute({ children }: { children: ReactNode }) {
  const { profil, avatar } = utiliserProfil();
  const activite = utiliserActivite();
  const { compte } = utiliserSession();
  const { trouverLieu } = utiliserLieux();
  const [etat, setEtat] = useState<CommunauteLocale>(() => creerEtatDepart(new Date()));
  const [pret, setPret] = useState(false);
  const charge = useRef(false);
  const minuteries = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    lireCommunauteLocale().then((lue) => {
      charge.current = true;
      // Démo : enregistrée avant les derniers exemples, elle les reçoit une fois (sans rien perdre de ce que tu y as changé).
      // Hors démo : un état gardé par une démo (exemples reçus) repart à vide
      if (lue && DEMO_VISITES_ACTIVE) setEtat(ajouterNouveauxExemples(lue, new Date()));
      else if (lue && lue.exemples === 0) setEtat(lue);
      setPret(true);
    });
    const enCours = minuteries.current;
    return () => enCours.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (charge.current) enregistrerCommunauteLocale(etat).catch(() => {});
  }, [etat]);

  // Démo : une réaction d'un pote d'exemple un peu plus tard
  const plusTard = useCallback((delai: number, changer: (e: CommunauteLocale) => CommunauteLocale) => {
    minuteries.current.push(setTimeout(() => setEtat(changer), delai));
  }, []);

  const mesures = { rescousses: activite.rescoussesDonnees, "premiers-sauvetages": activite.premiersSauvetages.length };
  const moi = useMemo(
    () =>
      construireMoi({
        // Les données du téléphone (démo comprise) te désignent par « moi » : les écrans le lisent par utiliserMonId
        id: ID_MOI,
        pseudo: profil?.pseudo ?? "",
        prenom: profil?.prenom ?? "Toi",
        avatar: avatar.type === "emoji" ? avatar.emoji : "📷",
        ville: profil?.ville ?? "",
        // Avec un compte : points et badges du serveur ; en démo, comptés sur le téléphone
        points: DEMO_VISITES_ACTIVE ? calculerPointsLocaux(mesures) : (compte?.points ?? 0),
        rescoussesDuMois: activite.rescoussesDuMois,
        lieuxSauves: activite.lieuxSauves,
        gardes: activite.gardes,
        badges: DEMO_VISITES_ACTIVE ? listerBadgesObtenus(mesures) : (compte?.badges ?? []),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profil, avatar, compte, activite.rescoussesDonnees, activite.premiersSauvetages, activite.rescoussesDuMois, activite.lieuxSauves, activite.gardes],
  );

  const parId = useMemo(() => new Map<string, Pote>([...potesConnus.map((p) => [p.id, p] as const), [ID_MOI, moi]]), [moi]);
  const trouverPote = useCallback((id: string) => parId.get(id) ?? null, [parId]);
  // Un lieu disparu de l'app ne se propose plus (et sort des votes en cours)
  const lieuExiste = useCallback((lieuId: number) => !!trouverLieu(lieuId), [trouverLieu]);

  const signales = useMemo(() => new Set(etat.signalements.map((s) => s.cibleId)), [etat.signalements]);
  const masques = useMemo(() => new Set(etat.masques), [etat.masques]);
  const potes = useMemo(() => etat.bande.filter((id) => !etat.bloques.includes(id)).map((id) => parId.get(id)).filter((p): p is Pote => !!p), [etat.bande, etat.bloques, parId]);
  const bloques = useMemo(() => etat.bloques.map((id) => parId.get(id)).filter((p): p is Pote => !!p), [etat.bloques, parId]);

  const sorties = useMemo(() => {
    const maintenant = new Date().toISOString();
    return etat.sorties
      .filter((s) => s.participants.includes(ID_MOI) && !masques.has(s.id))
      .map((s): Sortie => {
        const propositions = s.propositions.filter((p) => lieuExiste(p.lieuId));
        const messages = s.messages.filter((m) => !etat.bloques.includes(m.auteur) && !signales.has(m.id));
        const lieuChoisi = s.lieuChoisi ?? (s.finVote < maintenant ? choisirGagnant(propositions) : null);
        return { ...s, propositions, messages, lieuChoisi };
      })
      .sort((a, b) => a.quand.localeCompare(b.quand));
  }, [etat.sorties, etat.bloques, signales, masques, lieuExiste]);

  const changerSortie = useCallback((id: string, changer: (s: Sortie) => Sortie) => {
    setEtat((e) => ({ ...e, sorties: e.sorties.map((s) => (s.id === id ? changer(s) : s)) }));
  }, []);

  // Démo : des potes d'exemple de la sortie votent pour un ou deux lieux, un peu plus tard (jamais une fois le vote fini)
  const fairerVoterLesPotes = useCallback(
    (sortieId: string, participants: string[], lieux: number[]) => {
      participants.filter((id) => id !== ID_MOI).forEach((id) => {
        plusTard(entre(3000, 9000), (e) => ({
          ...e,
          sorties: e.sorties.map((s) => {
            if (s.id !== sortieId || e.bloques.includes(id) || estVoteTermine(s, new Date())) return s;
            const choix = [...lieux].sort(() => Math.random() - 0.5).slice(0, Math.random() < 0.5 ? 1 : 2);
            return choix.reduce((sortie, lieuId) => (sortie.propositions.find((p) => p.lieuId === lieuId)?.votes.includes(id) ? sortie : basculerVote(sortie, lieuId, id)), s);
          }),
        }));
      });
    },
    [plusTard],
  );

  const valeur = useMemo((): EtatCommunaute => {
    const visiblesDe = (publicationId: string) => etat.commentaires.filter((c) => c.publicationId === publicationId && !signales.has(c.id));
    return {
      pret,
      demo: DEMO_VISITES_ACTIVE,
      moi,
      potes,
      trouverPote,
      chercherParPseudo: (texte) => chercherParPseudo(potesConnus, texte, { bande: etat.bande, bloques: etat.bloques }),
      ajouterPote: (id, moyen) => {
        const pote = parId.get(id);
        if (!pote || id === ID_MOI) return "introuvable";
        if (etat.bloques.includes(id)) return "bloque";
        if (etat.bande.includes(id)) return "deja";
        setEtat((e) => ({ ...e, bande: [...e.bande, id], moyens: { ...e.moyens, [id]: moyen } }));
        return "ajoute";
      },
      // Démo : le code secret d'un lien ou d'un QR code n'est vérifié nulle part, et les potes d'exemple n'ont pas de vrai QR code.
      // Un ajout par lien ou QR code ne compte donc pas encore « en vrai » (estAjouteEnVrai) : un lien fabriqué avec un pseudo public
      // n'ouvre pas en entier un compte privé.
      moyenAjout: (id) => {
        // Retiré de ta bande (ou bloqué) : plus aucun lien entre vous, il faudra vous ajouter de nouveau
        if (!etat.bande.includes(id)) return undefined;
        const moyen = etat.moyens[id];
        if (moyen === "lien" || moyen === "qr") return `${moyen}-non-verifie`;
        return moyen ?? (bandeExemple.includes(id) ? "exemple" : undefined);
      },
      estSignale: (cibleId) => signales.has(cibleId),
      retirerPote: (id) => setEtat((e) => ({ ...e, bande: e.bande.filter((b) => b !== id) })),
      bloques,
      bloquer: (id) => setEtat((e) => ({ ...e, bande: e.bande.filter((b) => b !== id), bloques: e.bloques.includes(id) ? e.bloques : [...e.bloques, id] })),
      debloquer: (id) => setEtat((e) => ({ ...e, bloques: e.bloques.filter((b) => b !== id) })),

      sorties,
      trouverSortie: (id) => sorties.find((s) => s.id === id) ?? null,
      creerSortie: ({ titre, emoji, quand, invites, lieux, finVote }) => {
        const propre = titre.trim();
        if (propre === "" || propre.length > LONGUEUR_MAX_TITRE_SORTIE || contientMotInterdit(propre)) return { erreur: "titre" };
        const participants = [ID_MOI, ...invites.filter((id) => parId.has(id) && id !== ID_MOI && !etat.bloques.includes(id))];
        if (participants.length < 2 || participants.length > MAX_PARTICIPANTS_SORTIE) return { erreur: "participants" };
        const permis = [...new Set(lieux)].filter(lieuExiste).slice(0, MAX_PROPOSITIONS_SORTIE);
        if (permis.length === 0) return { erreur: "lieux" };
        const id = creerIdentifiant("sortie");
        const sortie: Sortie = {
          id, titre: propre, emoji, quand, finVote, organisateur: ID_MOI, participants,
          propositions: permis.map((lieuId) => ({ lieuId, proposePar: ID_MOI, votes: [] })), lieuChoisi: null, messages: [],
        };
        setEtat((e) => ({ ...e, sorties: [...e.sorties, sortie] }));
        fairerVoterLesPotes(id, participants, permis);
        return { id };
      },
      voter: (sortieId, lieuId) => changerSortie(sortieId, (s) => (estVoteTermine(s, new Date()) ? s : basculerVote(s, lieuId, ID_MOI))),
      proposerLieu: (sortieId, lieuId) => {
        const sortie = etat.sorties.find((s) => s.id === sortieId);
        if (!sortie || estVoteTermine(sortie, new Date()) || !lieuExiste(lieuId)) return "interdit";
        if (sortie.propositions.some((p) => p.lieuId === lieuId)) return "deja";
        if (sortie.propositions.length >= MAX_PROPOSITIONS_SORTIE) return "max";
        changerSortie(sortieId, (s) => ({ ...s, propositions: [...s.propositions, { lieuId, proposePar: ID_MOI, votes: [ID_MOI] }] }));
        fairerVoterLesPotes(sortieId, sortie.participants.filter(() => Math.random() < 0.5), [lieuId]);
        return "ok";
      },
      envoyerMessage: (sortieId, texte) => {
        const verdict = verifierTexte(texte, LONGUEUR_MAX_MESSAGE);
        const sortie = etat.sorties.find((s) => s.id === sortieId);
        if (verdict !== "ok" || !sortie) return verdict;
        changerSortie(sortieId, (s) => ({ ...s, messages: [...s.messages, { id: creerIdentifiant("message"), auteur: ID_MOI, texte: texte.trim(), date: new Date().toISOString() }] }));
        // Démo : un pote de la sortie répond
        const repondants = sortie.participants.filter((id) => id !== ID_MOI && !etat.bloques.includes(id) && parId.has(id));
        if (repondants.length > 0) {
          const auteur = auHasard(repondants);
          plusTard(entre(2500, 5500), (e) => ({
            ...e,
            sorties: e.sorties.map((s) => (s.id !== sortieId || e.bloques.includes(auteur) ? s : { ...s, messages: [...s.messages, { id: creerIdentifiant("message"), auteur, texte: auHasard(reponsesExemples), date: new Date().toISOString() }] })),
          }));
        }
        return "ok";
      },
      terminerVote: (sortieId) =>
        changerSortie(sortieId, (s) => (s.organisateur !== ID_MOI || estVoteTermine(s, new Date()) ? s : { ...s, finVote: new Date().toISOString(), lieuChoisi: choisirGagnant(s.propositions.filter((p) => lieuExiste(p.lieuId))) })),
      quitterSortie: (sortieId) => changerSortie(sortieId, (s) => ({ ...s, participants: s.participants.filter((id) => id !== ID_MOI) })),

      // Une liste signalée disparaît pour toi (une liste écartée de « À découvrir » reste sur le profil de son auteur : estMasque)
      listes: etat.listes.filter((l) => !signales.has(l.id)),
      creerListe: (titre, emoji, description) => {
        const id = creerIdentifiant("liste");
        setEtat((e) => ({ ...e, listes: [...e.listes, { id, titre: titre.trim(), emoji, description: description.trim(), auteur: ID_MOI, lieux: [], abonnes: [] }] }));
        return id;
      },
      basculerSuiviListe: (listeId) =>
        setEtat((e) => ({
          ...e,
          listes: e.listes.map((l) => (l.id !== listeId || l.auteur === ID_MOI ? l : { ...l, abonnes: l.abonnes.includes(ID_MOI) ? l.abonnes.filter((a) => a !== ID_MOI) : [...l.abonnes, ID_MOI] })),
        })),
      ajouterLieuListe: (listeId, lieuId) => setEtat((e) => ({ ...e, listes: e.listes.map((l) => (l.id !== listeId || l.lieux.includes(lieuId) ? l : { ...l, lieux: [...l.lieux, lieuId] })) })),
      retirerLieuListe: (listeId, lieuId) => setEtat((e) => ({ ...e, listes: e.listes.map((l) => (l.id !== listeId ? l : { ...l, lieux: l.lieux.filter((x) => x !== lieuId) })) })),

      activites: etat.activites.filter((a) => !etat.bloques.includes(a.pote) && !masques.has(a.id)).sort((a, b) => b.date.localeCompare(a.date)),
      // Toi compris dans la liste (le classement de commun t'y attend)
      classement: calculerClassement([...potes, moi], moi.id),

      recommandationsRecues: etat.recommandations.filter((r) => r.a === ID_MOI && !etat.bloques.includes(r.de) && !signales.has(r.id)).sort((a, b) => b.date.localeCompare(a.date)),
      recommandationsEnvoyees: etat.recommandations.filter((r) => r.de === ID_MOI).sort((a, b) => b.date.localeCompare(a.date)),
      envoyerLieu: (lieuId, destinataires, mot) => {
        const verdict = mot && mot.trim() !== "" ? verifierTexte(mot, LONGUEUR_MAX_MOT_RECOMMANDATION) : "ok";
        if (verdict !== "ok") return verdict;
        const date = new Date().toISOString();
        const nouvelles = destinataires.filter((id) => !etat.bloques.includes(id)).map((a) => ({ id: creerIdentifiant("reco"), de: ID_MOI, a, lieuId, mot: mot?.trim() || undefined, date, vue: false }));
        setEtat((e) => ({ ...e, recommandations: [...e.recommandations, ...nouvelles] }));
        return "ok";
      },
      marquerRecommandationVue: (id) => setEtat((e) => ({ ...e, recommandations: e.recommandations.map((r) => (r.id === id ? { ...r, vue: true } : r)) })),
      // Seulement les lieux qu'on t'a envoyés : ton pote n'en sait rien (ce qu'il t'a envoyé reste dans ses envois)
      retirerRecommandations: (ids) => {
        const retirees = etat.recommandations.filter((r) => ids.includes(r.id) && r.a === ID_MOI);
        if (retirees.length > 0) setEtat((e) => ({ ...e, recommandations: e.recommandations.filter((r) => !(ids.includes(r.id) && r.a === ID_MOI)) }));
        return retirees;
      },
      remettreRecommandations: (recommandations) =>
        setEtat((e) => ({ ...e, recommandations: [...e.recommandations, ...recommandations.filter((r) => r.a === ID_MOI && !e.recommandations.some((x) => x.id === r.id))] })),
      estMasque: (id) => masques.has(id),
      masquer: (id) => setEtat((e) => (e.masques.includes(id) ? e : { ...e, masques: [...e.masques, id] })),
      demasquer: (id) => setEtat((e) => ({ ...e, masques: e.masques.filter((m) => m !== id) })),

      commentairesDe: (publicationId) => trierCommentaires(visiblesDe(publicationId), { bloques: etat.bloques, moi: ID_MOI }),
      nombreCommentaires: (publicationId) => trierCommentaires(visiblesDe(publicationId), { bloques: etat.bloques, moi: ID_MOI }).reduce((n, fil) => n + 1 + fil.reponses.length, 0),
      commenter: (publicationId, texte, reponseA) => {
        const verdict = verifierTexte(texte, LONGUEUR_MAX_COMMENTAIRE);
        if (verdict !== "ok") return verdict;
        const id = creerIdentifiant("commentaire");
        setEtat((e) => ({ ...e, commentaires: [...e.commentaires, { id, publicationId, auteur: ID_MOI, texte: texte.trim(), date: new Date().toISOString(), jaimes: [], reponseA, mentions: extraireMentions(texte) }] }));
        // Démo : un pote aime ton commentaire un peu plus tard
        if (potes.length > 0 && Math.random() < 0.6) {
          const fan = auHasard(potes).id;
          plusTard(entre(4000, 9000), (e) => ({ ...e, commentaires: e.commentaires.map((c) => (c.id === id && !c.jaimes.includes(fan) ? { ...c, jaimes: [...c.jaimes, fan] } : c)) }));
        }
        return "ok";
      },
      modifierCommentaire: (id, texte) => {
        const verdict = verifierTexte(texte, LONGUEUR_MAX_COMMENTAIRE);
        if (verdict !== "ok") return verdict;
        setEtat((e) => ({ ...e, commentaires: e.commentaires.map((c) => (c.id === id && c.auteur === ID_MOI ? { ...c, texte: texte.trim(), modifieLe: new Date().toISOString(), mentions: extraireMentions(texte) } : c)) }));
        return "ok";
      },
      supprimerCommentaire: (id) => setEtat((e) => ({ ...e, commentaires: e.commentaires.filter((c) => !(c.id === id && c.auteur === ID_MOI)) })),
      basculerJaimeCommentaire: (id) =>
        setEtat((e) => ({ ...e, commentaires: e.commentaires.map((c) => (c.id !== id ? c : { ...c, jaimes: c.jaimes.includes(ID_MOI) ? c.jaimes.filter((j) => j !== ID_MOI) : [...c.jaimes, ID_MOI] })) })),

      signaler: (signalement) => setEtat((e) => ({ ...e, signalements: [...e.signalements, { ...signalement, date: new Date().toISOString() }] })),
      effacer: async () => {
        minuteries.current.forEach(clearTimeout);
        minuteries.current = [];
        await effacerCommunauteLocale();
        setEtat(creerEtatDepart(new Date()));
      },
    };
  }, [pret, moi, potes, trouverPote, etat, parId, bloques, sorties, lieuExiste, changerSortie, fairerVoterLesPotes, plusTard, signales, masques]);

  return <ContexteCommunaute.Provider value={valeur}>{children}</ContexteCommunaute.Provider>;
}
