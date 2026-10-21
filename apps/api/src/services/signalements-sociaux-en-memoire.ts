// Double EN MÉMOIRE des signalements sociaux et des décisions de la modération vues dans l'app (pour les tests), posé sur les
// tables partagées (tables-sociales-en-memoire.ts) : mêmes règles que signalements-sociaux.ts, instantanes-signalements.ts
// et decisions-moderation-app.ts (visibilité du contenu, un signalement par personne, instantané chiffré, masquage pour tous
// sous conditions, une ligne par contenu pour l'auteur, avis et réponses d'un lieu masqués par l'équipe chez leur auteur
// seulement). Les outils de lecture et d'écriture servent aussi au double des commentaires (masquage par le lieu).
import { peutVoirListe } from "../../../../packages/commun/src/fonctions/social/peut-voir-liste.ts";
import { calculerNiveauProfil } from "../../../../packages/commun/src/regles/calculer-niveau-profil.ts";
import {
  CIBLES_AVEC_MASQUAGE_IMMEDIAT, CIBLES_DECISION_MODERATION, CIBLES_SIGNALEMENT_SOCIAL, RAISONS_AVEC_MASQUAGE_IMMEDIAT,
} from "../../../../packages/commun/src/regles/signalement.ts";
import type { VisibiliteListe } from "../../../../packages/commun/src/types/listes.ts";
import type { CibleDecisionModeration, CibleSignalementSocial } from "../../../../packages/commun/src/types/signalement.ts";
import type { Signalement } from "../base-de-donnees/client-genere/client.ts";
import { construireInstantane, type AuteurInstantane, type ContenuSignale } from "../fonctions/social/construire-instantane.ts";
import { lireMentionsCommentaire } from "../fonctions/social/lire-mentions-commentaire.ts";
import { peutMasquerToutDeSuite } from "../fonctions/social/peut-masquer-tout-de-suite.ts";
import type { ChiffrementSocial } from "./chiffrement-social.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";
import {
  choisirDecisions, ecrireEffetMasque, MAX_SIGNALES_LUS, verifierContestation, type ContenuLu, type LigneSignalementDecision, type NouveauSignalementSocial,
  type ServicesDecisionsModeration, type ServicesSignalementsSociaux,
} from "./signalements-sociaux-regles.ts";
import { prendreId, type TablesSociales } from "./tables-sociales-en-memoire.ts";
import { estMasqueCommunauteEnMemoire, lireContenuCommunauteEnMemoire, masquerCommunauteEnMemoire } from "./communaute-signalements-en-memoire.ts";
import type { VoirSortieMiamis } from "./instantanes-communaute.ts";

type Relations = Pick<RelationsSociales, "bloqueEntre" | "lireLiens" | "trouverCompte">;

/** Une publication visible (le test la prépare : « publiee », et son lieu « publie » s'il le connaît) */
export function publicationVisibleEnMemoire(tables: TablesSociales, publicationId: number): { lieuId: number } | null {
  const publication = tables.publications.get(publicationId);
  if (!publication || publication.statut !== "publiee") return null;
  const lieu = tables.lieux.get(publication.lieuId);
  return lieu && lieu.statut !== "publie" ? null : { lieuId: publication.lieuId };
}

function lireAuteur(tables: TablesSociales, compteId: number | null): AuteurInstantane {
  const compte = compteId === null ? undefined : tables.comptes.get(compteId);
  return compte ? { pseudo: compte.pseudo, prenom: compte.prenom } : null;
}

function relire(dechiffrer: () => string): string | null {
  try {
    return dechiffrer();
  } catch {
    return null;
  }
}

function lireLieuEnvoye(clair: string): { l?: unknown; m?: unknown } | null {
  try {
    const lu: unknown = JSON.parse(clair);
    return typeof lu === "object" && lu !== null ? (lu as { l?: unknown; m?: unknown }) : null;
  } catch {
    return null;
  }
}

const vide = { lieuId: null, fichierMedia: null };

/** Même règle que lireContenuSignale (instantanes-signalements.ts) */
export async function lireContenuSignaleEnMemoire(
  tables: TablesSociales, d: { chiffrement: ChiffrementSocial; relations: Relations; voitLaSortieMiamis?: VoirSortieMiamis }, compteId: number, cible: CibleSignalementSocial, cibleId: string,
  maintenant: Date, o: { pourLeLieu?: boolean } = {},
): Promise<ContenuLu | null> {
  if (cible === "profil") {
    const autre = await d.relations.trouverCompte(cibleId, compteId);
    const compte = autre === null ? undefined : tables.comptes.get(autre);
    if (autre === null || !compte || (autre !== compteId && (await d.relations.bloqueEntre(compteId, autre)))) return null;
    return { contenu: { cible, pseudo: compte.pseudo, prenom: compte.prenom, avatar: compte.avatar }, auteurContenuId: autre, ...vide };
  }
  const id = Number(cibleId);
  if (cible === "idee" || cible === "comment-idee" || cible === "miamis") return lireContenuCommunauteEnMemoire(tables, d, compteId, cible, id, maintenant);
  if (cible === "commentaire") {
    const c = tables.commentaires.get(id);
    const publication = c ? publicationVisibleEnMemoire(tables, c.publicationId) : null;
    if (!c || !publication || c.supprimeLe || c.retireLe || c.suspenduLe || (c.masqueParLieuLe && !o.pourLeLieu)) return null;
    return {
      contenu: {
        cible, texte: c.texte, mentions: lireMentionsCommentaire(c.mentions), publicationId: c.publicationId, lieuId: publication.lieuId,
        commeLieu: c.commeLieuId !== null, masqueParLieu: c.masqueParLieuLe !== null, auteur: lireAuteur(tables, c.auteurId), date: c.creeLe,
      },
      auteurContenuId: c.auteurId ?? c.ecritParId, lieuId: publication.lieuId, fichierMedia: null,
    };
  }
  if (cible === "message") {
    const m = tables.messages.get(id);
    const conversation = m ? tables.conversations.get(m.conversationId) : undefined;
    if (!m || !conversation || m.supprimeLe || m.suspenduLe || m.retireLe) return null;
    const membre = tables.membres.find((x) => x.conversationId === m.conversationId && x.compteId === compteId);
    if (!membre || m.id <= membre.visibleApres) return null;
    if (m.auteurId !== null && m.auteurId !== compteId && (await d.relations.bloqueEntre(compteId, m.auteurId))) return null;
    let texte: string | null = null;
    let lieuId: number | null = null;
    let illisible = false;
    if (m.texteChiffre) {
      const clair = relire(() => d.chiffrement.dechiffrerMessage(m.texteChiffre!, m.conversationId, m.idClient));
      if (clair === null) illisible = true;
      else if (m.type === "lieu") {
        const lu = lireLieuEnvoye(clair);
        lieuId = typeof lu?.l === "number" ? lu.l : null;
        texte = typeof lu?.m === "string" ? lu.m : null;
        illisible = lu === null;
      } else texte = clair;
    }
    const titre = conversation.type === "groupe" && conversation.titreChiffre ? relire(() => d.chiffrement.dechiffrerTitre(conversation.titreChiffre!, conversation.id)) : null;
    const avecMedia = m.fichier !== null && (m.type === "photo" || m.type === "vocal");
    return {
      contenu: {
        cible, type: m.type, texte, lieuId, illisible, media: avecMedia ? { typeMime: m.typeMime, taille: m.taille, dureeSecondes: m.dureeSecondes } : null,
        conversation: { type: conversation.type, titre, emoji: conversation.emoji }, auteur: lireAuteur(tables, m.auteurId), date: m.creeLe,
      },
      auteurContenuId: m.auteurId, lieuId: null,
      fichierMedia: avecMedia && m.mediaExpireLe && m.mediaExpireLe > maintenant ? m.fichier : null,
    };
  }
  if (cible === "liste") {
    const l = tables.listes.get(id);
    if (!l || l.suspendueLe || l.retireeLe) return null;
    if (l.auteurId !== compteId) {
      const lien = (await d.relations.lireLiens(compteId, [l.auteurId])).get(l.auteurId);
      if (!lien || lien.bloqueParMoi || lien.mABloque) return null;
      const niveau = calculerNiveauProfil({ prive: tables.comptes.get(l.auteurId)?.prive ?? false }, { estMoi: false, pote: lien.pote, abonne: lien.jeSuis === "suivi" });
      const coAuteur = tables.coAuteurs.some((x) => x.listeId === id && x.compteId === compteId && x.statut === "accepte");
      if (!peutVoirListe({ visibilite: l.visibilite as VisibiliteListe }, niveau, coAuteur)) return null;
    }
    const lieux = tables.lieuxListes.filter((x) => x.listeId === id).sort((a, b) => b.creeLe.getTime() - a.creeLe.getTime() || b.lieuId - a.lieuId).map((x) => x.lieuId);
    return {
      contenu: { cible, titre: l.titre, emoji: l.emoji, description: l.description, visibilite: l.visibilite, lieux, auteur: lireAuteur(tables, l.auteurId) },
      auteurContenuId: l.auteurId, lieuId: null, fichierMedia: null,
    };
  }
  if (cible === "sortie") {
    const s = tables.sorties.get(id);
    if (!s || !tables.invitationsSorties.some((i) => i.sortieId === id && i.compteId === compteId && (i.statut === "invite" || i.statut === "accepte"))) return null;
    const lieux = [...tables.propositions.values()].filter((p) => p.sortieId === id).sort((a, b) => a.id - b.id).map((p) => p.lieuId);
    return { contenu: { cible, titre: s.titre, emoji: s.emoji, quand: s.quand, lieux, organisateur: lireAuteur(tables, s.organisateurId) }, auteurContenuId: s.organisateurId, ...vide };
  }
  // Membre, ou invité en attente : il voit déjà le titre et l'emoji dans ses invitations
  const c = tables.conversations.get(id);
  const membreOuInvite = tables.membres.some((x) => x.conversationId === id && x.compteId === compteId)
    || tables.invitationsGroupes.some((x) => x.conversationId === id && x.compteId === compteId && x.statut === "invite");
  if (!c || c.type !== "groupe" || !membreOuInvite) return null;
  const titre = c.titreChiffre ? relire(() => d.chiffrement.dechiffrerTitre(c.titreChiffre!, id)) : null;
  return { contenu: { cible: "groupe", titre, emoji: c.emoji, createur: lireAuteur(tables, c.creeParId) }, auteurContenuId: c.creeParId, ...vide };
}

/** Même écriture qu'ecrireSignalementSocial : le signalement, puis son instantané chiffré avec son id */
export function ecrireSignalementSocialEnMemoire(tables: TablesSociales, chiffrement: ChiffrementSocial, s: NouveauSignalementSocial, contenu: ContenuSignale, maintenant: Date): number {
  const id = prendreId(tables, "signalements");
  const ligne: Signalement = {
    id, cible: s.cible, cibleId: s.cibleId, lieuId: s.lieuId, raison: s.raison, precision: s.precision, explication: s.explication, source: s.source,
    statut: "a-traiter", decision: null, motif: null, motivation: null, contestation: null, contesteLe: null, reexamineLe: null,
    creeLe: maintenant, traiteLe: null, signaleParId: s.signaleParId, auteurContenuId: s.auteurContenuId,
    instantaneChiffre: chiffrement.chiffrerInstantane(construireInstantane(contenu), id), fichierMedia: s.fichierMedia,
  };
  tables.signalements.set(id, ligne);
  return id;
}

/** Même règle que compterRejets : tous les rejets passés sur ce contenu, quelle que soit sa date */
export function compterRejetsEnMemoire(tables: TablesSociales, cible: string, cibleId: string, source?: "lieu"): number {
  return [...tables.signalements.values()].filter((s) => s.cible === cible && s.cibleId === cibleId && s.statut === "rejete" && (!source || s.source === source)).length;
}

function masquerPourTousEnMemoire(tables: TablesSociales, cible: CibleSignalementSocial, id: number, maintenant: Date) {
  if (cible === "commentaire") {
    const c = tables.commentaires.get(id);
    if (c && !c.suspenduLe) c.suspenduLe = maintenant;
  } else if (cible === "liste") {
    const l = tables.listes.get(id);
    if (l && !l.suspendueLe) l.suspendueLe = maintenant;
  } else if (cible === "message") {
    const m = tables.messages.get(id);
    const conversation = m ? tables.conversations.get(m.conversationId) : undefined;
    if (m) m.suspenduLe = maintenant;
    if (conversation) Object.assign(conversation, { version: conversation.version + 1, modifieLe: maintenant });
  } else masquerCommunauteEnMemoire(tables, cible, id, maintenant);
}

export function creerSignalementsSociauxEnMemoire(tables: TablesSociales, relations: Relations, chiffrement: ChiffrementSocial | null, voitLaSortieMiamis?: VoirSortieMiamis): ServicesSignalementsSociaux {
  const miens = (compteId: number, cible: string) =>
    [...tables.signalements.values()].filter((s) => s.signaleParId === compteId && s.cible === cible && s.source === "app").sort((a, b) => b.id - a.id);
  return {
    async signaler(compteId, s, maintenant, peutMasquer = true) {
      if (!chiffrement) throw new Error("Signalement social sans clé des données");
      if (miens(compteId, s.cible).some((x) => x.cibleId === s.cibleId)) return { ok: true, deja: true, masquePourTous: false, effets: [] };
      const lu = await lireContenuSignaleEnMemoire(tables, { chiffrement, relations, voitLaSortieMiamis }, compteId, s.cible, s.cibleId, maintenant);
      if (!lu || lu.auteurContenuId === compteId) return { ok: false, erreur: "contenu-inconnu" };
      let masquer = false;
      if (peutMasquer && CIBLES_AVEC_MASQUAGE_IMMEDIAT.includes(s.cible) && RAISONS_AVEC_MASQUAGE_IMMEDIAT.includes(s.raison)) {
        const compte = tables.comptes.get(compteId);
        masquer = !!compte && peutMasquerToutDeSuite(
          { emailVerifie: compte.emailVerifieLe !== null, creeLe: new Date(compte.creeLe) }, compterRejetsEnMemoire(tables, s.cible, s.cibleId) > 0, maintenant,
        );
      }
      const id = ecrireSignalementSocialEnMemoire(tables, chiffrement, {
        ...s, signaleParId: compteId, auteurContenuId: lu.auteurContenuId, lieuId: lu.lieuId, source: "app", fichierMedia: lu.fichierMedia,
      }, lu.contenu, maintenant);
      if (masquer) masquerPourTousEnMemoire(tables, s.cible, Number(s.cibleId), maintenant);
      return { ok: true, deja: false, masquePourTous: masquer, effets: masquer ? ecrireEffetMasque(lu.auteurContenuId, id, "choquant") : [] };
    },
    async listerMiens(compteId, cible) {
      return [...new Set(miens(compteId, cible).map((s) => s.cibleId))].slice(0, MAX_SIGNALES_LUS);
    },
    async lireSignalesPar(compteId, cible, cibleIds) {
      const voulus = new Set(cibleIds);
      return new Set(miens(compteId, cible).map((s) => s.cibleId).filter((id) => voulus.has(id)));
    },
  };
}

export function creerDecisionsModerationAppEnMemoire(
  tables: TablesSociales, contesterSignalement: (id: number, texte: string, maintenant: Date) => Promise<boolean>,
): ServicesDecisionsModeration {
  const dans = (cibles: readonly string[]) => (s: Signalement) => cibles.includes(s.cible);
  const sociale = dans(CIBLES_SIGNALEMENT_SOCIAL);
  const decidables = () => [...tables.signalements.values()].filter(dans(CIBLES_DECISION_MODERATION)) as (Signalement & LigneSignalementDecision)[];
  // Un avis ou une réponse d'un lieu n'est jamais masqué en attendant : l'équipe le masque en décidant
  const estMasque = (cible: CibleDecisionModeration, cibleId: string) => {
    const id = Number(cibleId);
    if (cible === "commentaire") return !!(tables.commentaires.get(id)?.suspenduLe || tables.commentaires.get(id)?.masqueParLieuLe);
    if (cible === "message") return !!tables.messages.get(id)?.suspenduLe;
    if (cible === "liste") return !!tables.listes.get(id)?.suspendueLe;
    return estMasqueCommunauteEnMemoire(tables, cible, id);
  };
  return {
    async listerDecisions(compteId) {
      const lignes = decidables()
        .filter((s) => s.auteurContenuId === compteId || (s.signaleParId === compteId && sociale(s) && (s.statut === "retenu" || s.statut === "rejete")))
        .sort((a, b) => b.creeLe.getTime() - a.creeLe.getTime() || b.id - a.id);
      return choisirDecisions(lignes, compteId, estMasque);
    },
    async contester(compteId, signalementId, texte, maintenant) {
      const ligne = decidables().find((s) => s.id === signalementId) ?? null;
      const duContenu = ligne && ligne.auteurContenuId === compteId ? decidables().filter((s) => s.cible === ligne.cible && s.cibleId === ligne.cibleId) : [];
      const verdict = verifierContestation(ligne, duContenu, compteId, maintenant);
      if (!verdict.ok) return verdict;
      if (!(await contesterSignalement(verdict.id, texte, maintenant))) return { ok: false, erreur: "decision-inconnue" };
      return { ok: true };
    },
  };
}
