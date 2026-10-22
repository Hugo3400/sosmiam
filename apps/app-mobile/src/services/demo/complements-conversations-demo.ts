import { LONGUEUR_MAX_TITRE_GROUPE, MAX_PARTICIPANTS_GROUPE, MAX_PHOTOS_ALBUM, QUESTION_SONDAGE } from "@sos-miam/commun/regles/chat";
import { LONGUEUR_MAX_MESSAGE } from "@sos-miam/commun/regles/potes";
import { contientMotInterdit } from "@sos-miam/commun/validation/contient-mot-interdit";
import { validerNouveauSondage } from "@sos-miam/commun/validation/valider-nouveau-sondage";
import { GIFS_DEMO } from "~/contenus/gifs-demo";
import type { ConversationEnrichie, MessageChatEnrichi } from "~/contenus/type-discussion-chat";
import { appliquerVoteSondage } from "~/fonctions/chat/appliquer-vote-sondage";
import { lireEtatSondage } from "~/fonctions/chat/lire-etat-sondage";
import { creerIdentifiant } from "~/fonctions/communaute/creer-identifiant";
import { preparerPhotoProfil } from "~/fonctions/compte/preparer-photo-profil";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";
import type { EtatConversations, ResultatEnvoiChat } from "~/hooks/utiliser-conversations";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";
import { garderFichierChat, supprimerFichiersChat } from "~/stockage/conversations-locales";

type Contenu = Omit<MessageChatEnrichi, "id" | "auteur" | "date" | "reactions">;

type Options = {
  conversations: ConversationEnrichie[];
  monId: string;
  ouverte: (id: string) => boolean;
  peutDiscuterAvec: (poteId: string) => boolean;
  changer: (id: string, changer: (c: ConversationEnrichie) => ConversationEnrichie) => void;
  publier: (id: string, messages: MessageChatEnrichi[]) => ResultatEnvoiChat;
  planifier: (faire: () => void, delaiMs: number) => void;
};

type Complements = Pick<
  EtatConversations,
  "envoyerPhotos" | "envoyerGif" | "chercherGifs" | "envoyerSondage" | "voterSondage" | "renommerGroupe" | "inviterAuGroupe" | "changerPhotoGroupe" | "listerPartages" | "couper"
>;

const GIFS_PAR_RECHERCHE = 6;
const PART_VOTANTS = 0.75;

const estAdmin = (c: ConversationEnrichie, monId: string) => (c.admins ? c.admins.includes(monId) : c.creePar === monId);

export function creerComplementsConversationsDemo({ conversations, monId, ouverte, peutDiscuterAvec, changer, publier, planifier }: Options): Complements {
  const trouver = (id: string) => conversations.find((c) => c.id === id);
  const creer = (contenu: Contenu, id = creerIdentifiant("chat")): MessageChatEnrichi => ({ id, auteur: monId, date: new Date().toISOString(), reactions: {}, ...contenu });
  const changerMessage = (id: string, messageId: string, faire: (m: MessageChatEnrichi) => MessageChatEnrichi) =>
    changer(id, (c) => ({ ...c, messages: c.messages.map((m) => (m.id === messageId ? faire(m) : m)) }));

  function faireVoterLesPotes(conversation: ConversationEnrichie, messageId: string, options: number) {
    conversation.participants
      .filter((p) => p !== monId && Math.random() < PART_VOTANTS)
      .forEach((_, i) =>
        planifier(
          () =>
            changerMessage(conversation.id, messageId, (m) => {
              if (!m.vote || lireEtatSondage(m.vote, new Date()).clos) return m;
              const ordre = Math.floor(Math.random() * options);
              return { ...m, vote: { ...m.vote, votants: m.vote.votants + 1, options: m.vote.options.map((o) => (o.ordre === ordre ? { ...o, votes: o.votes + 1 } : o)) } };
            }),
          3000 + i * 2500 + Math.random() * 2000,
        ),
      );
  }

  return {
    envoyerPhotos: async (id, uris, legende) => {
      if (!ouverte(id)) return "interdit";
      const mot = legende?.trim() ?? "";
      if (mot.length > LONGUEUR_MAX_MESSAGE) return "trop-long";
      if (mot !== "" && contientMotInterdit(mot)) return "mot-interdit";
      const choisies = uris.slice(0, MAX_PHOTOS_ALBUM);
      if (choisies.length === 0) return "vide";
      const fichiers: string[] = [];
      try {
        for (const uri of choisies) fichiers.push(await garderFichierChat(uri, "jpg"));
      } catch {
        supprimerFichiersChat(fichiers);
        return "interdit";
      }
      const premier = creerIdentifiant("chat");
      const album = fichiers.length > 1 ? premier : undefined;
      const messages = fichiers.map((fichier, i) =>
        creer({ type: "photo", fichier, ...(album ? { album } : {}), ...(i === 0 && mot !== "" ? { legende: mot } : {}) }, i === 0 ? premier : undefined),
      );
      return publier(id, messages);
    },
    envoyerGif: (id, gif) => publier(id, [creer({ type: "gif", gif: { ...gif } })]),
    chercherGifs: async (requete, page) => {
      if (!DEMO_VISITES_ACTIVE) return { erreur: "indisponible" };
      if (page > 0) return { gifs: [] };
      const q = requete.type === "recherche" ? normaliserRecherche(requete.q) : "";
      const trouves = q === "" ? GIFS_DEMO : GIFS_DEMO.filter((g) => g.mots.some((mot) => normaliserRecherche(mot).includes(q) || q.includes(normaliserRecherche(mot))));
      return { gifs: trouves.slice(0, GIFS_PAR_RECHERCHE).map(({ mots: _mots, ...gif }) => gif) };
    },
    envoyerSondage: (id, lieux, finLe) => {
      const conversation = trouver(id);
      if (!conversation || conversation.type !== "groupe" || !ouverte(id)) return "interdit";
      const verdict = validerNouveauSondage({ lieux, finLe }, new Date());
      if (!verdict.ok) return verdict.champ === "lieux" ? "lieux" : "fin";
      const { sondage } = verdict;
      const message = creer({
        type: "vote",
        texte: QUESTION_SONDAGE,
        vote: { finLe: sondage.finLe, closLe: null, gagnant: null, options: sondage.lieux.map((lieuId, ordre) => ({ ordre, lieuId, votes: 0 })), monVote: null, votants: 0 },
      });
      if (publier(id, [message]) !== "ok") return "interdit";
      faireVoterLesPotes(conversation, message.id, sondage.lieux.length);
      return "ok";
    },
    voterSondage: async (id, messageId, ordre) => {
      const message = trouver(id)?.messages.find((m) => m.id === messageId);
      if (!message?.vote) return "reseau";
      if (lireEtatSondage(message.vote, new Date()).clos) return "clos";
      changerMessage(id, messageId, (m) => (m.vote ? { ...m, vote: appliquerVoteSondage(m.vote, ordre) } : m));
      return "ok";
    },
    renommerGroupe: async (id, titre, emoji) => {
      const conversation = trouver(id);
      if (!conversation || conversation.type !== "groupe" || !estAdmin(conversation, monId)) return "interdit";
      const propre = titre.trim();
      if (propre === "" || propre.length > LONGUEUR_MAX_TITRE_GROUPE || contientMotInterdit(propre)) return "titre";
      changer(id, (c) => ({ ...c, titre: propre, emoji }));
      return "ok";
    },
    inviterAuGroupe: async (id, potes) => {
      const conversation = trouver(id);
      if (!conversation || conversation.type !== "groupe" || !estAdmin(conversation, monId)) return "interdit";
      const nouveaux = [...new Set(potes)].filter((p) => peutDiscuterAvec(p) && !conversation.participants.includes(p));
      if (conversation.participants.length + nouveaux.length > MAX_PARTICIPANTS_GROUPE) return "plein";
      changer(id, (c) => ({ ...c, participants: [...c.participants, ...nouveaux] }));
      return "ok";
    },
    changerPhotoGroupe: async (id, uri) => {
      const conversation = trouver(id);
      if (!conversation || conversation.type !== "groupe" || !estAdmin(conversation, monId)) return "interdit";
      let fichier: string | undefined;
      try {
        fichier = uri ? await garderFichierChat(await preparerPhotoProfil(uri), "jpg") : undefined;
      } catch {
        return "reseau";
      }
      if (conversation.fichierPhoto) supprimerFichiersChat([conversation.fichierPhoto]);
      changer(id, ({ fichierPhoto: _ancienne, ...c }) => (fichier ? { ...c, fichierPhoto: fichier } : c));
      return "ok";
    },
    listerPartages: async (id, type) => {
      const conversation = trouver(id);
      if (!conversation) return null;
      const messages = conversation.messages.filter((m) => !m.etat && (type === "photo" ? m.type === "photo" && !!m.fichier : m.type === "lieu" && m.lieuId !== undefined));
      return { messages: [...messages].reverse(), suite: null };
    },
    couper: (id, coupee) => changer(id, (c) => ({ ...c, coupee })),
  };
}
