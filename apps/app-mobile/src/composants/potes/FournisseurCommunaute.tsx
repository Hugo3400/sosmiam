import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { AGE_ALCOOL } from "@sos-miam/commun/regles/ages";
import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { LONGUEUR_MAX_COMMENTAIRE } from "@sos-miam/commun/regles/mots-interdits";
import {
  ID_MOI,
  LONGUEUR_MAX_MESSAGE,
  LONGUEUR_MAX_MOT_RECOMMANDATION,
  LONGUEUR_MAX_TITRE_SORTIE,
  MAX_PARTICIPANTS_SORTIE,
  MAX_PROPOSITIONS_SORTIE,
} from "@sos-miam/commun/regles/potes";
import type { Pote, Sortie } from "@sos-miam/commun/types/potes";
import { contientMotInterdit } from "@sos-miam/commun/validation/contient-mot-interdit";
import { creerCommentairesExemples } from "~/contenus/commentaires-exemples";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { bandeExemple, creerDonneesExemplePotes, potesExemples, reponsesExemples, VERSION_EXEMPLES } from "~/contenus/potes-exemples";
import { calculerPointsLocaux } from "~/fonctions/ambassadeur/calculer-points-locaux";
import { listerBadgesObtenus } from "~/fonctions/ambassadeur/lister-badges-obtenus";
import { ajouterNouveauxExemples } from "~/fonctions/communaute/ajouter-nouveaux-exemples";
import { basculerVote } from "~/fonctions/communaute/basculer-vote";
import { calculerClassement } from "~/fonctions/communaute/calculer-classement";
import { chercherParPseudo } from "~/fonctions/communaute/chercher-par-pseudo";
import { choisirLieuGagnant } from "~/fonctions/communaute/choisir-lieu-gagnant";
import { construireMoi } from "~/fonctions/communaute/construire-moi";
import { creerIdentifiant } from "~/fonctions/communaute/creer-identifiant";
import { estVoteTermine } from "~/fonctions/communaute/est-vote-termine";
import { extraireMentions } from "~/fonctions/communaute/extraire-mentions";
import { trierCommentaires } from "~/fonctions/communaute/trier-commentaires";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { ContexteCommunaute, type EtatCommunaute, type ResultatTexte } from "~/hooks/utiliser-communaute";
import { utiliserProfil } from "~/hooks/utiliser-profil";
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

const verifierTexte = (texte: string, max: number): ResultatTexte => {
  const propre = texte.trim();
  if (propre === "") return "vide";
  if (propre.length > max) return "trop-long";
  return contientMotInterdit(propre) ? "mot-interdit" : "ok";
};
const auHasard = <T,>(liste: T[]): T => liste[Math.floor(Math.random() * liste.length)];
const entre = (min: number, max: number) => min + Math.random() * (max - min);
const parLieu = new Map(lieuxExemples.map((l) => [l.id, l]));

/**
 * Potes, sorties, listes, activité, lieux envoyés entre potes et commentaires, gardés sur le téléphone (démo).
 * Les potes d'exemple votent et répondent tout seuls ; tes vrais potes arriveront avec les comptes.
 */
export function FournisseurCommunaute({ children }: { children: ReactNode }) {
  const { profil, avatar } = utiliserProfil();
  const activite = utiliserActivite();
  const [etat, setEtat] = useState<CommunauteLocale>(() => creerEtatDemo(new Date()));
  const [pret, setPret] = useState(false);
  const charge = useRef(false);
  const minuteries = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    lireCommunauteLocale().then((lue) => {
      charge.current = true;
      // Une démo enregistrée avant les derniers exemples les reçoit une fois (sans rien perdre de ce que tu y as changé)
      if (lue) setEtat(ajouterNouveauxExemples(lue, new Date()));
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

  const age = profil ? calculerAge(profil.dateNaissance) : null;
  const moiMineur = age === null || age < AGE_ALCOOL;
  const mesures = { rescousses: activite.rescoussesDonnees, "premiers-sauvetages": activite.premiersSauvetages.length };
  const moi = useMemo(
    () =>
      construireMoi({
        pseudo: profil?.pseudo ?? "",
        prenom: profil?.prenom ?? "Toi",
        avatar: avatar.type === "emoji" ? avatar.emoji : "📷",
        ville: profil?.ville ?? "",
        mineur: moiMineur,
        points: calculerPointsLocaux(mesures),
        rescoussesDuMois: activite.rescoussesDuMois,
        lieuxSauves: activite.lieuxSauves,
        gardes: activite.gardes,
        badges: listerBadgesObtenus(mesures),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profil, avatar, moiMineur, activite.rescoussesDonnees, activite.premiersSauvetages, activite.rescoussesDuMois, activite.lieuxSauves, activite.gardes],
  );

  const parId = useMemo(() => new Map<string, Pote>([...potesExemples.map((p) => [p.id, p] as const), [ID_MOI, moi]]), [moi]);
  const trouverPote = useCallback((id: string) => parId.get(id) ?? null, [parId]);
  const estMineur = useCallback((id: string) => parId.get(id)?.mineur ?? false, [parId]);
  const lieuPermisDansSortie = useCallback(
    (lieuId: number, participants: string[]) => {
      const lieu = parLieu.get(lieuId);
      if (!lieu) return false;
      // Pas de bar quand un mineur est de la sortie (toi compris)
      return lieu.type !== "bar" || ![ID_MOI, ...participants].some(estMineur);
    },
    [estMineur],
  );

  const signales = useMemo(() => new Set(etat.signalements.map((s) => s.cibleId)), [etat.signalements]);
  const masques = useMemo(() => new Set(etat.masques), [etat.masques]);
  const potes = useMemo(() => etat.bande.filter((id) => !etat.bloques.includes(id)).map((id) => parId.get(id)).filter((p): p is Pote => !!p), [etat.bande, etat.bloques, parId]);
  const bloques = useMemo(() => etat.bloques.map((id) => parId.get(id)).filter((p): p is Pote => !!p), [etat.bloques, parId]);

  const sorties = useMemo(() => {
    const maintenant = new Date().toISOString();
    return etat.sorties
      .filter((s) => s.participants.includes(ID_MOI) && !masques.has(s.id))
      .map((s): Sortie => {
        const propositions = s.propositions.filter((p) => lieuPermisDansSortie(p.lieuId, s.participants));
        const messages = s.messages.filter((m) => !etat.bloques.includes(m.auteur) && !signales.has(m.id));
        const lieuChoisi = s.lieuChoisi ?? (s.finVote < maintenant ? choisirLieuGagnant(propositions) : null);
        return { ...s, propositions, messages, lieuChoisi };
      })
      .sort((a, b) => a.quand.localeCompare(b.quand));
  }, [etat.sorties, etat.bloques, signales, masques, lieuPermisDansSortie]);

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
            if (s.id !== sortieId || e.bloques.includes(id) || estVoteTermine(s)) return s;
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
      demo: true,
      moi,
      moiMineur,
      potes,
      trouverPote,
      chercherParPseudo: (texte) => chercherParPseudo(potesExemples, texte, { moiMineur, bande: etat.bande, bloques: etat.bloques }),
      ajouterPote: (id, moyen) => {
        const pote = parId.get(id);
        if (!pote || id === ID_MOI) return "introuvable";
        if (etat.bloques.includes(id)) return "bloque";
        if (etat.bande.includes(id)) return "deja";
        // Démo : rien ne vérifie encore qu'un lien ou un QR code a été donné en main propre (le pseudo, public, suffit à les fabriquer).
        // Tant que l'API ne vérifie pas les invitations, un adulte n'ajoute donc aucun mineur, quel que soit le moyen.
        if (!moiMineur && pote.mineur) return "mineur";
        setEtat((e) => ({ ...e, bande: [...e.bande, id], moyens: { ...e.moyens, [id]: moyen } }));
        return "ajoute";
      },
      // Démo : le code secret d'un lien ou d'un QR code n'est vérifié nulle part, et les potes d'exemple n'ont pas de vrai QR code.
      // Un ajout par lien ou QR code ne compte donc pas encore « en vrai » (peutDiscuter) : un mineur ne discute pas avec un adulte
      // grâce à un lien fabriqué avec son pseudo public. Ça couvre aussi un ajout enregistré avant ce garde-fou.
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
      lieuPermisDansSortie,
      creerSortie: ({ titre, emoji, quand, invites, lieux, finVote }) => {
        const propre = titre.trim();
        if (propre === "" || propre.length > LONGUEUR_MAX_TITRE_SORTIE || contientMotInterdit(propre)) return { erreur: "titre" };
        const participants = [ID_MOI, ...invites.filter((id) => parId.has(id) && id !== ID_MOI && !etat.bloques.includes(id))];
        if (participants.length < 2 || participants.length > MAX_PARTICIPANTS_SORTIE) return { erreur: "participants" };
        const permis = [...new Set(lieux)].filter((l) => lieuPermisDansSortie(l, participants)).slice(0, MAX_PROPOSITIONS_SORTIE);
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
      voter: (sortieId, lieuId) => changerSortie(sortieId, (s) => (estVoteTermine(s) ? s : basculerVote(s, lieuId, ID_MOI))),
      proposerLieu: (sortieId, lieuId) => {
        const sortie = etat.sorties.find((s) => s.id === sortieId);
        if (!sortie || estVoteTermine(sortie) || !lieuPermisDansSortie(lieuId, sortie.participants)) return "interdit";
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
        changerSortie(sortieId, (s) => (s.organisateur !== ID_MOI || estVoteTermine(s) ? s : { ...s, finVote: new Date().toISOString(), lieuChoisi: choisirLieuGagnant(s.propositions.filter((p) => lieuPermisDansSortie(p.lieuId, s.participants))) })),
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
      classement: calculerClassement(potes, moi),

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
        setEtat(creerEtatDemo(new Date()));
      },
    };
  }, [pret, moi, moiMineur, potes, trouverPote, etat, parId, bloques, sorties, lieuPermisDansSortie, changerSortie, fairerVoterLesPotes, plusTard, signales, masques]);

  return <ContexteCommunaute.Provider value={valeur}>{children}</ContexteCommunaute.Provider>;
}
