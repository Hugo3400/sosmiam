import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
import { TEXTES_COMMUNAUTE_LOCALE_PAR_LANGUE } from "~/contenus/textes-communaute-locale";
import { ecrireAvatarPublic } from "~/fonctions/compte/ecrire-avatar-public";
import { basculerVote } from "~/fonctions/communaute/basculer-vote";
import { construireMoi } from "~/fonctions/communaute/construire-moi";
import { creerIdentifiant } from "~/fonctions/communaute/creer-identifiant";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import type { EtatCommunaute, ResultatAjoutBande, ResultatTexte } from "~/hooks/utiliser-communaute";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { effacerCommunauteLocale, enregistrerCommunauteLocale, lireCommunauteLocale, type CommunauteLocale } from "~/stockage/communaute-locale";

/** Personne pour l'instant : tes vrais potes viennent du serveur avec un compte ; « exemples: 0 » la distingue d'un état ancien */
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

const verifierTexte = (texte: string, max: number): ResultatTexte => {
  const propre = texte.trim();
  if (propre === "") return "vide";
  if (propre.length > max) return "trop-long";
  return contientMotInterdit(propre) ? "mot-interdit" : "ok";
};
/** Le lieu retenu d'après le nombre de votes de chaque proposition (à égalité, la première proposée) */
const choisirGagnant = (propositions: PropositionSortie[]) => choisirLieuGagnant(propositions.map((p) => ({ lieuId: p.lieuId, votes: p.votes.length })));

/**
 * La communauté gardée sur le téléphone (le code de FournisseurCommunaute d'avant le lot A2) : potes, sorties, listes,
 * activité, lieux envoyés entre potes et commentaires : vide au départ, et ce qu'une ancienne version avait gardé sur le
 * téléphone est oublié. Ces données te désignent par ID_MOI (« moi ») ;
 * les écrans, eux, lisent ton identifiant par utiliserMonId. Avec un compte, FournisseurCommunaute remplace la bande par
 * celle du serveur (utiliserBandeCompte) et garde le reste d'ici jusqu'aux lots suivants (sorties, listes, commentaires).
 */
export function utiliserCommunauteLocale(): EtatCommunaute {
  const { profil, avatar } = utiliserProfil();
  const T = utiliserTextes(TEXTES_COMMUNAUTE_LOCALE_PAR_LANGUE);
  const activite = utiliserActivite();
  const { compte } = utiliserSession();
  const { trouverLieu } = utiliserLieux();
  const [etat, setEtat] = useState<CommunauteLocale>(creerEtatVide);
  const [pret, setPret] = useState(false);
  const charge = useRef(false);

  useEffect(() => {
    lireCommunauteLocale().then((lue) => {
      charge.current = true;
      // Un état gardé par une ancienne version (exemples reçus) repart à vide
      if (lue && lue.exemples === 0) setEtat(lue);
      setPret(true);
    });
  }, []);

  useEffect(() => {
    if (charge.current) enregistrerCommunauteLocale(etat).catch(() => {});
  }, [etat]);

  const moi = useMemo(
    () =>
      construireMoi({
        // Les données du téléphone te désignent par « moi » : les écrans le lisent par utiliserMonId
        id: ID_MOI,
        pseudo: profil?.pseudo ?? "",
        prenom: profil?.prenom ?? T.prenomParDefaut,
        avatar: ecrireAvatarPublic(avatar) ?? "📷",
        ville: profil?.ville ?? "",
        points: compte?.points ?? 0,
        rescoussesDuMois: activite.rescoussesDuMois,
        lieuxSauves: activite.lieuxSauves,
        gardes: activite.gardes,
        badges: compte?.badges ?? [],
      }),
    [profil, avatar, compte, activite.rescoussesDuMois, activite.lieuxSauves, activite.gardes, T],
  );

  const parId = useMemo(() => new Map<string, Pote>([[ID_MOI, moi]]), [moi]);
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

  const valeur = useMemo((): EtatCommunaute => {
    const visiblesDe = (publicationId: string) => etat.commentaires.filter((c) => c.publicationId === publicationId && !signales.has(c.id));
    const ajouter = (id: string, moyen: "lien" | "qr" | "pseudo"): ResultatAjoutBande => {
      const pote = parId.get(id);
      if (!pote || id === ID_MOI) return { type: "introuvable", pseudo: pote?.pseudo ?? "" };
      if (etat.bloques.includes(id)) return { type: "bloque", pote };
      if (etat.bande.includes(id)) return { type: "deja", pote };
      setEtat((e) => ({ ...e, bande: [...e.bande, id], moyens: { ...e.moyens, [id]: moyen } }));
      return { type: "ajoute", pote };
    };
    return {
      source: "visite",
      pret,
      moi,
      potes,
      trouverPote,
      chercherParPseudo: () => [],
      rejoindreParInvitation: async (pseudo) => (pseudo === moi.pseudo ? { type: "toi" } : { type: "introuvable", pseudo }),
      demanderAjout: async (id) => ajouter(id, "pseudo"),
      demandesRecues: [],
      demandesEnvoyees: [],
      accepterDemandeBande: async () => null,
      retirerDemandeBande: async () => null,
      ouvrirProfilSocial: () => {},
      pseudoRequis: false,
      noterPersonne: () => {},
      relireBande: () => {},
      // Sans compte, le code secret d'un lien ou d'un QR code n'est vérifié nulle part : un ajout par lien ou QR code ne compte
      // pas « en vrai » (estAjouteEnVrai), un lien fabriqué avec un pseudo public n'ouvre pas en entier un compte privé.
      moyenAjout: (id) => {
        // Retiré de ta bande (ou bloqué) : plus aucun lien entre vous, il faudra vous ajouter de nouveau
        if (!etat.bande.includes(id)) return undefined;
        const moyen = etat.moyens[id];
        if (moyen === "lien" || moyen === "qr") return `${moyen}-non-verifie`;
        return moyen;
      },
      estSignale: (cibleId) => signales.has(cibleId),
      retirerPote: (id) => setEtat((e) => ({ ...e, bande: e.bande.filter((b) => b !== id) })),
      bloques,
      bloquer: (id) => setEtat((e) => ({ ...e, bande: e.bande.filter((b) => b !== id), bloques: e.bloques.includes(id) ? e.bloques : [...e.bloques, id] })),
      debloquer: (id) => setEtat((e) => ({ ...e, bloques: e.bloques.filter((b) => b !== id) })),

      sorties,
      trouverSortie: (id) => sorties.find((s) => s.id === id) ?? null,
      creerSortie: async ({ titre, emoji, quand, invites, lieux, finVote }) => {
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
        return { id };
      },
      voter: (sortieId, lieuId) => changerSortie(sortieId, (s) => (estVoteTermine(s, new Date()) ? s : basculerVote(s, lieuId, ID_MOI))),
      proposerLieu: (sortieId, lieuId) => {
        const sortie = etat.sorties.find((s) => s.id === sortieId);
        if (!sortie || estVoteTermine(sortie, new Date()) || !lieuExiste(lieuId)) return "interdit";
        if (sortie.propositions.some((p) => p.lieuId === lieuId)) return "deja";
        if (sortie.propositions.length >= MAX_PROPOSITIONS_SORTIE) return "max";
        changerSortie(sortieId, (s) => ({ ...s, propositions: [...s.propositions, { lieuId, proposePar: ID_MOI, votes: [ID_MOI] }] }));
        return "ok";
      },
      envoyerMessage: (sortieId, texte) => {
        const verdict = verifierTexte(texte, LONGUEUR_MAX_MESSAGE);
        const sortie = etat.sorties.find((s) => s.id === sortieId);
        if (verdict !== "ok" || !sortie) return verdict;
        changerSortie(sortieId, (s) => ({ ...s, messages: [...s.messages, { id: creerIdentifiant("message"), auteur: ID_MOI, texte: texte.trim(), date: new Date().toISOString() }] }));
        return "ok";
      },
      terminerVote: (sortieId) =>
        changerSortie(sortieId, (s) => (s.organisateur !== ID_MOI || estVoteTermine(s, new Date()) ? s : { ...s, finVote: new Date().toISOString(), lieuChoisi: choisirGagnant(s.propositions.filter((p) => lieuExiste(p.lieuId))) })),
      quitterSortie: (sortieId) => changerSortie(sortieId, (s) => ({ ...s, participants: s.participants.filter((id) => id !== ID_MOI) })),
      lireSortie: () => {},
      invitationsSorties: [],
      repondreInvitationSortie: async () => false,
      inviterASortie: async (sortieId, invites) => {
        changerSortie(sortieId, (s) => {
          if (s.organisateur !== ID_MOI) return s;
          const nouveaux = invites.filter((id) => parId.has(id) && !s.participants.includes(id) && !etat.bloques.includes(id));
          return { ...s, participants: [...s.participants, ...nouveaux].slice(0, MAX_PARTICIPANTS_SORTIE) };
        });
        return null;
      },
      retirerParticipant: async (sortieId, poteId) => {
        changerSortie(sortieId, (s) => (s.organisateur !== ID_MOI || poteId === ID_MOI ? s : { ...s, participants: s.participants.filter((id) => id !== poteId) }));
        return null;
      },
      annulerSortie: async (sortieId) => {
        setEtat((e) => ({ ...e, sorties: e.sorties.filter((s) => s.id !== sortieId || s.organisateur !== ID_MOI) }));
        return null;
      },

      // Une liste signalée disparaît pour toi (une liste écartée de « À découvrir » reste sur le profil de son auteur : estMasque)
      listes: etat.listes.filter((l) => !signales.has(l.id)),
      creerListe: async ({ titre, emoji, description, visibilite = "tous" }) => {
        const id = creerIdentifiant("liste");
        setEtat((e) => ({ ...e, listes: [...e.listes, { id, titre: titre.trim(), emoji, description: description.trim(), auteur: ID_MOI, lieux: [], abonnes: [], visibilite }] }));
        return { id };
      },
      modifierListe: async (listeId, changements) => {
        const propres = {
          ...changements,
          ...(changements.titre !== undefined ? { titre: changements.titre.trim() } : {}),
          ...(changements.description !== undefined ? { description: changements.description.trim() } : {}),
        };
        setEtat((e) => ({ ...e, listes: e.listes.map((l) => (l.id === listeId && l.auteur === ID_MOI ? { ...l, ...propres } : l)) }));
        return null;
      },
      supprimerListe: async (listeId) => {
        setEtat((e) => ({ ...e, listes: e.listes.filter((l) => l.id !== listeId || l.auteur !== ID_MOI) }));
        return null;
      },
      lireListe: () => {},
      noterListes: () => {},
      invitationsListes: [],
      repondreCoAuteur: async () => false,
      inviterCoAuteur: async (listeId, poteId) => {
        const changerCoAuteurs = (e: CommunauteLocale, statut: "invite" | "accepte") => ({
          ...e,
          listes: e.listes.map((l) => (l.id !== listeId || l.auteur !== ID_MOI ? l : { ...l, coAuteurs: [...(l.coAuteurs ?? []).filter((c) => c.id !== poteId), { id: poteId, statut }] })),
        });
        if (!etat.bande.includes(poteId) || etat.bloques.includes(poteId)) return "pas-dans-la-bande";
        setEtat((e) => changerCoAuteurs(e, "invite"));
        return null;
      },
      retirerCoAuteur: async (listeId, poteId) => {
        const qui = poteId === "moi" ? ID_MOI : poteId;
        setEtat((e) => ({ ...e, listes: e.listes.map((l) => (l.id !== listeId ? l : { ...l, coAuteurs: (l.coAuteurs ?? []).filter((c) => c.id !== qui) })) }));
        return null;
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
      // Sur le téléphone, les masques restent rangés par identifiant
      estMasque: (_cible, id) => masques.has(id),
      masquer: (_cible, id) => setEtat((e) => (e.masques.includes(id) ? e : { ...e, masques: [...e.masques, id] })),
      demasquer: (_cible, id) => setEtat((e) => ({ ...e, masques: e.masques.filter((m) => m !== id) })),

      commentairesDe: (publicationId) => trierCommentaires(visiblesDe(publicationId), { bloques: etat.bloques, moi: ID_MOI }),
      nombreCommentaires: (publicationId) => trierCommentaires(visiblesDe(publicationId), { bloques: etat.bloques, moi: ID_MOI }).reduce((n, fil) => n + 1 + fil.reponses.length, 0),
      commenter: (publicationId, texte, reponseA) => {
        const verdict = verifierTexte(texte, LONGUEUR_MAX_COMMENTAIRE);
        if (verdict !== "ok") return verdict;
        const id = creerIdentifiant("commentaire");
        setEtat((e) => ({ ...e, commentaires: [...e.commentaires, { id, publicationId, auteur: ID_MOI, texte: texte.trim(), date: new Date().toISOString(), jaimes: [], reponseA, mentions: extraireMentions(texte) }] }));
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
        await effacerCommunauteLocale();
        setEtat(creerEtatVide());
      },
    };
  }, [pret, moi, potes, trouverPote, etat, parId, bloques, sorties, lieuExiste, changerSortie, signales, masques]);

  return valeur;
}
