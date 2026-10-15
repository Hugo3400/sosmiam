// L'export RGPD fait par l'équipe (demande d'accès) pour la partie sociale de l'app et ses dernières nouveautés (spécification
// sociale F.2, décision 2 de Hugo) : des MÉTADONNÉES seulement. Jamais le texte d'un message, le titre d'un groupe, le lieu
// d'un message, une position, un code d'invitation ou de réservation : ce qui est chiffré reste chiffré, l'équipe ne lit
// qu'un message signalé. Les textes des messages, la personne les télécharge elle-même dans l'app.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";

const AUTRE = { select: { pseudo: true } } as const;
/** Une autre personne, par son seul pseudo public (jamais son prénom ni son adresse) */
const pseudoDe = (compte: { pseudo: string | null } | null) => (compte ? (compte.pseudo ? `@${compte.pseudo}` : "(sans pseudo)") : "(compte supprimé)");

export const NOTE_MESSAGES = "Les textes des messages ne sont lisibles que par la personne elle-même, dans l'app : Réglages, Tes données, Télécharger mes données sociales.";

export async function exporterActiviteSociale(id: number) {
  const [compte, messagesParType] = await Promise.all([
    baseDeDonnees.compte.findUnique({
      where: { id },
      select: {
        profilSocial: { select: { idPublic: true, trouvable: true, suggerable: true, activitePartagee: true, pushSocial: true, arriveesParLien: true, arriveesDepuis: true, creeLe: true } },
        bande: { select: { creeLe: true, pote: AUTRE } },
        demandesBandeEnvoyees: { select: { creeLe: true, refuseeLe: true, a: AUTRE } },
        demandesBandeRecues: { select: { creeLe: true, refuseeLe: true, de: AUTRE } },
        blocagesFaits: { select: { creeLe: true, bloque: AUTRE } },
        suivisDonnes: { select: { statut: true, creeLe: true, accepteLe: true, suivi: AUTRE } },
        suivisRecus: { select: { statut: true, creeLe: true, accepteLe: true, suiveur: AUTRE } },
        elementsMasques: { select: { cible: true, cibleId: true, creeLe: true } },
        conversations: {
          select: {
            role: true, arriveLe: true,
            conversation: { select: { id: true, type: true, creeLe: true, dernierMessageLe: true, membres: { select: { compte: AUTRE } } } },
          },
        },
        reactionsMessages: { select: { reaction: true, creeLe: true } },
        departsGroupes: { select: { partiLe: true } },
        invitationsGroupes: { select: { statut: true, creeLe: true, reponduLe: true, invitePar: AUTRE } },
        sortiesOrganisees: { select: { titre: true, emoji: true, quand: true, creeLe: true, lieuChoisi: { select: { nom: true } } } },
        invitationsSorties: { select: { statut: true, creeLe: true, reponduLe: true, sortie: { select: { titre: true, quand: true } } } },
        propositionsSorties: { select: { creeLe: true, lieu: { select: { nom: true } }, sortie: { select: { titre: true } } } },
        votesSorties: { select: { creeLe: true, proposition: { select: { lieu: { select: { nom: true } } } } } },
        listesEcrites: { select: { titre: true, emoji: true, description: true, visibilite: true, creeLe: true, retireeLe: true, lieux: { select: { lieu: { select: { nom: true } } } } } },
        coAuteurListes: { select: { statut: true, creeLe: true, liste: { select: { titre: true } } } },
        abonnementsListes: { select: { creeLe: true, liste: { select: { titre: true } } } },
        lieuxAjoutesListes: { select: { creeLe: true, lieu: { select: { nom: true } }, liste: { select: { titre: true } } } },
        // Un commentaire est public : son texte fait partie de ses données (pas un message privé)
        commentairesEcrits: { select: { publicationId: true, texte: true, creeLe: true, modifieLe: true, supprimeLe: true, retireLe: true } },
        jaimesCommentaires: { select: { commentaireId: true, creeLe: true } },
        clocheRecue: { select: { type: true, creeLe: true }, orderBy: { creeLe: "asc" } },
        signalementsFaits: { select: { cible: true, raison: true, statut: true, creeLe: true, traiteLe: true } },
        // Le reste de l'app arrivé depuis : avis, réservations (sans le code), événements, défis, partages de position (jamais la position)
        avisEcrits: { select: { lieuId: true, note: true, texte: true, statut: true, creeLe: true, reponseTexte: true, reponseLe: true } },
        reservations: { select: { lieuId: true, personnes: true, creneau: true, message: true, statut: true, motifRefus: true, creeLe: true, reponduLe: true, presenceLe: true } },
        interetsEvenements: { select: { rappel: true, creeLe: true, evenement: { select: { titre: true, debut: true } } } },
        defisReussis: { select: { points: true, reussiLe: true, defi: { select: { titre: true } } } },
        partagesPositionEnvoyes: { select: { creeLe: true, expireLe: true, arreteLe: true, avecPosition: true, pote: AUTRE } },
        partagesPositionRecus: { select: { creeLe: true, expireLe: true, arreteLe: true, compte: AUTRE } },
      },
    }),
    // Par conversation et par type : combien de messages, le premier et le dernier (jamais leur contenu)
    baseDeDonnees.messageConversation.groupBy({ by: ["conversationId", "type"], where: { auteurId: id }, _count: { _all: true }, _min: { creeLe: true }, _max: { creeLe: true } }),
  ]);
  if (!compte) return null;
  const c = compte;
  return {
    note: NOTE_MESSAGES,
    profilSocial: c.profilSocial,
    bande: c.bande.map((m) => ({ pote: pseudoDe(m.pote), depuis: m.creeLe })),
    demandesBandeEnvoyees: c.demandesBandeEnvoyees.map((d) => ({ a: pseudoDe(d.a), le: d.creeLe, refuseeLe: d.refuseeLe })),
    demandesBandeRecues: c.demandesBandeRecues.map((d) => ({ de: pseudoDe(d.de), le: d.creeLe, refuseeLe: d.refuseeLe })),
    blocagesFaits: c.blocagesFaits.map((b) => ({ bloque: pseudoDe(b.bloque), le: b.creeLe })),
    suivisDonnes: c.suivisDonnes.map((s) => ({ suivi: pseudoDe(s.suivi), statut: s.statut, le: s.creeLe, accepteLe: s.accepteLe })),
    suivisRecus: c.suivisRecus.map((s) => ({ suiveur: pseudoDe(s.suiveur), statut: s.statut, le: s.creeLe, accepteLe: s.accepteLe })),
    conversations: c.conversations.map(({ role, arriveLe, conversation }) => ({
      type: conversation.type, role, arriveLe, creeLe: conversation.creeLe, dernierMessageLe: conversation.dernierMessageLe,
      membres: conversation.membres.map((m) => pseudoDe(m.compte)),
      mesMessages: messagesParType.filter((g) => g.conversationId === conversation.id)
        .map((g) => ({ type: g.type, nombre: g._count._all, premier: g._min.creeLe, dernier: g._max.creeLe })),
    })),
    reactionsMessages: c.reactionsMessages,
    departsGroupes: c.departsGroupes,
    invitationsGroupes: c.invitationsGroupes.map((i) => ({ statut: i.statut, le: i.creeLe, reponduLe: i.reponduLe, invitePar: pseudoDe(i.invitePar) })),
    sorties: {
      organisees: c.sortiesOrganisees.map((s) => ({ titre: s.titre, emoji: s.emoji, quand: s.quand, creeLe: s.creeLe, lieuChoisi: s.lieuChoisi?.nom ?? null })),
      invitations: c.invitationsSorties.map((i) => ({ sortie: i.sortie.titre, quand: i.sortie.quand, statut: i.statut, le: i.creeLe, reponduLe: i.reponduLe })),
      propositions: c.propositionsSorties.map((p) => ({ sortie: p.sortie.titre, lieu: p.lieu.nom, le: p.creeLe })),
      votes: c.votesSorties.map((v) => ({ lieu: v.proposition.lieu.nom, le: v.creeLe })),
    },
    listes: {
      ecrites: c.listesEcrites.map((l) => ({ titre: l.titre, emoji: l.emoji, description: l.description, visibilite: l.visibilite, creeLe: l.creeLe, retireeLe: l.retireeLe, lieux: l.lieux.map((x) => x.lieu.nom) })),
      coEcrites: c.coAuteurListes.map((l) => ({ liste: l.liste.titre, statut: l.statut, le: l.creeLe })),
      suivies: c.abonnementsListes.map((l) => ({ liste: l.liste.titre, le: l.creeLe })),
      lieuxAjoutes: c.lieuxAjoutesListes.map((l) => ({ liste: l.liste.titre, lieu: l.lieu.nom, le: l.creeLe })),
    },
    commentaires: c.commentairesEcrits,
    jaimesCommentaires: c.jaimesCommentaires,
    cloche: c.clocheRecue,
    signalementsFaits: c.signalementsFaits,
    avis: c.avisEcrits,
    reservations: c.reservations,
    interetsEvenements: c.interetsEvenements.map((i) => ({ evenement: i.evenement.titre, debut: i.evenement.debut, rappel: i.rappel, le: i.creeLe })),
    defisReussis: c.defisReussis.map((d) => ({ defi: d.defi.titre, points: d.points, le: d.reussiLe })),
    partagesPosition: {
      envoyes: c.partagesPositionEnvoyes.map((p) => ({ a: pseudoDe(p.pote), le: p.creeLe, expireLe: p.expireLe, arreteLe: p.arreteLe, avecPosition: p.avecPosition })),
      recus: c.partagesPositionRecus.map((p) => ({ de: pseudoDe(p.compte), le: p.creeLe, expireLe: p.expireLe, arreteLe: p.arreteLe })),
    },
  };
}
