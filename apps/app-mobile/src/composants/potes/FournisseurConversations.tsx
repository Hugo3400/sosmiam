import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { LONGUEUR_MAX_TITRE_GROUPE, MAX_PARTICIPANTS_GROUPE } from "@sos-miam/commun/regles/chat";
import { ID_MOI, LONGUEUR_MAX_MESSAGE } from "@sos-miam/commun/regles/potes";
import { REACTIONS_CHAT, type Conversation, type MessageChat } from "@sos-miam/commun/types/conversations";
import type { Pote } from "@sos-miam/commun/types/potes";
import { contientMotInterdit } from "@sos-miam/commun/validation/contient-mot-interdit";
import { creerConversationsExemples } from "~/contenus/conversations-exemples";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { reponsesExemples } from "~/contenus/potes-exemples";
import { creerIdentifiant } from "~/fonctions/communaute/creer-identifiant";
import { peutDiscuter } from "~/fonctions/communaute/peut-discuter";
import { peutEnvoyerMedias } from "~/fonctions/communaute/peut-envoyer-medias";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { ContexteConversations, type EtatConversations, type ResultatEnvoiChat } from "~/hooks/utiliser-conversations";
import { effacerConversationsLocales, enregistrerConversationsLocales, garderFichierChat, lireConversationsLocales } from "~/stockage/conversations-locales";

const dernierMessage = (c: Conversation) => c.messages[c.messages.length - 1]?.date ?? "";
const auHasard = <T,>(liste: readonly T[]): T => liste[Math.floor(Math.random() * liste.length)];
const lieuxBars = new Set(lieuxExemples.filter((l) => l.type === "bar").map((l) => l.id));

/**
 * Chat entre potes (démo) : messages privés et groupes, gardés sur le téléphone avec leurs photos et notes vocales.
 * Protection des 15-17 ans : seulement avec des potes ajoutés en vrai, et ni photo ni vocal entre mineurs et adultes.
 */
export function FournisseurConversations({ children }: { children: ReactNode }) {
  const communaute = utiliserCommunaute();
  const [conversations, setConversations] = useState<Conversation[]>(() => creerConversationsExemples(new Date()));
  const [pret, setPret] = useState(false);
  const charge = useRef(false);
  const minuteries = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    lireConversationsLocales().then((lues) => {
      charge.current = true;
      if (lues) setConversations(lues);
      setPret(true);
    });
    const enCours = minuteries.current;
    return () => enCours.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (charge.current) enregistrerConversationsLocales(conversations).catch(() => {});
  }, [conversations]);

  const { moi, trouverPote, moyenAjout } = communaute;
  const bloques = useMemo(() => new Set(communaute.bloques.map((p) => p.id)), [communaute.bloques]);
  const participantsDe = useCallback((c: Conversation) => c.participants.map((id) => trouverPote(id)).filter((p): p is Pote => !!p), [trouverPote]);
  const peutDiscuterAvec = useCallback(
    (poteId: string) => {
      const pote = trouverPote(poteId);
      return !!pote && !bloques.has(poteId) && peutDiscuter(moi, pote, moyenAjout(poteId));
    },
    [trouverPote, bloques, moi, moyenAjout],
  );

  const ajouterMessage = useCallback((id: string, message: MessageChat) => {
    setConversations((cs) => cs.map((c) => (c.id === id ? { ...c, messages: [...c.messages, message] } : c)));
  }, []);

  // Démo : un pote de la conversation répond ou réagit un peu plus tard
  const fairerReagir = useCallback(
    (conversation: Conversation, messageId: string) => {
      const autres = conversation.participants.filter((id) => id !== ID_MOI && !bloques.has(id) && trouverPote(id));
      if (autres.length === 0) return;
      const auteur = auHasard(autres);
      minuteries.current.push(
        setTimeout(() => {
          setConversations((cs) =>
            cs.map((c) => {
              if (c.id !== conversation.id) return c;
              if (Math.random() < 0.35) {
                const reaction = auHasard(REACTIONS_CHAT);
                return { ...c, messages: c.messages.map((m) => (m.id !== messageId ? m : { ...m, reactions: { ...m.reactions, [reaction]: [...(m.reactions[reaction] ?? []), auteur] } })) };
              }
              return { ...c, messages: [...c.messages, { id: creerIdentifiant("chat"), auteur, date: new Date().toISOString(), type: "texte", texte: auHasard(reponsesExemples), reactions: {} }] };
            }),
          );
        }, 2500 + Math.random() * 3500),
      );
    },
    [bloques, trouverPote],
  );

  const valeur = useMemo((): EtatConversations => {
    // Visibles : celles où tu es, sans les conversations privées avec quelqu'un de bloqué ni les messages des personnes bloquées
    const visibles = conversations
      .filter((c) => c.participants.includes(ID_MOI))
      .filter((c) => c.type === "groupe" || !c.participants.some((id) => bloques.has(id)))
      .map((c) => ({ ...c, messages: c.messages.filter((m) => !bloques.has(m.auteur) && !(m.lieuId !== undefined && moi.mineur && lieuxBars.has(m.lieuId))) }))
      .sort((a, b) => dernierMessage(b).localeCompare(dernierMessage(a)));
    const nonLusDe = (id: string) => {
      const c = visibles.find((x) => x.id === id);
      return c ? c.messages.filter((m) => m.auteur !== ID_MOI && (!c.luJusqua || m.date > c.luJusqua)).length : 0;
    };
    const mediasPermis = (id: string) => {
      const c = visibles.find((x) => x.id === id);
      return !!c && peutEnvoyerMedias(participantsDe(c));
    };
    const envoyer = (id: string, message: Omit<MessageChat, "id" | "auteur" | "date" | "reactions">): ResultatEnvoiChat => {
      const c = visibles.find((x) => x.id === id);
      if (!c) return "interdit";
      const complet: MessageChat = { id: creerIdentifiant("chat"), auteur: ID_MOI, date: new Date().toISOString(), reactions: {}, ...message };
      ajouterMessage(id, complet);
      fairerReagir(c, complet.id);
      return "ok";
    };
    const envoyerFichier = async (id: string, uri: string, extension: string, autre: Partial<MessageChat> & { type: "photo" | "vocal" }) => {
      if (!mediasPermis(id)) return "interdit" as const;
      try {
        const fichier = await garderFichierChat(uri, extension);
        return envoyer(id, { ...autre, fichier });
      } catch {
        return "interdit" as const;
      }
    };
    return {
      pret,
      conversations: visibles,
      trouverConversation: (id) => visibles.find((c) => c.id === id) ?? null,
      nonLus: visibles.reduce((n, c) => n + nonLusDe(c.id), 0),
      nonLusDe,
      peutDiscuterAvec,
      peutEnvoyerMedias: mediasPermis,
      ouvrirPrive: (poteId) => {
        if (!peutDiscuterAvec(poteId)) return null;
        const existante = conversations.find((c) => c.type === "prive" && c.participants.includes(poteId) && c.participants.includes(ID_MOI));
        if (existante) return existante.id;
        const id = creerIdentifiant("prive");
        setConversations((cs) => [...cs, { id, type: "prive", participants: [ID_MOI, poteId], creePar: ID_MOI, messages: [] }]);
        return id;
      },
      creerGroupe: (titre, emoji, potes) => {
        const propre = titre.trim();
        if (propre === "" || propre.length > LONGUEUR_MAX_TITRE_GROUPE || contientMotInterdit(propre)) return { erreur: "titre" };
        const membres = [...new Set(potes)].filter(peutDiscuterAvec);
        if (membres.length < 1 || membres.length + 1 > MAX_PARTICIPANTS_GROUPE) return { erreur: "participants" };
        const id = creerIdentifiant("groupe");
        setConversations((cs) => [...cs, { id, type: "groupe", titre: propre, emoji, participants: [ID_MOI, ...membres], creePar: ID_MOI, messages: [] }]);
        return { id };
      },
      envoyerTexte: (id, texte) => {
        const propre = texte.trim();
        if (propre === "") return "vide";
        if (propre.length > LONGUEUR_MAX_MESSAGE) return "trop-long";
        if (contientMotInterdit(propre)) return "mot-interdit";
        return envoyer(id, { type: "texte", texte: propre });
      },
      envoyerLieu: (id, lieuId) => {
        const c = visibles.find((x) => x.id === id);
        // Pas de bar dans une conversation où il y a un mineur
        if (!c || (lieuxBars.has(lieuId) && participantsDe(c).some((p) => p.mineur))) return "interdit";
        return envoyer(id, { type: "lieu", lieuId });
      },
      envoyerPhoto: (id, uri) => envoyerFichier(id, uri, "jpg", { type: "photo" }),
      envoyerVocal: (id, uri, duree) => envoyerFichier(id, uri, "m4a", { type: "vocal", dureeSecondes: Math.round(duree) }),
      basculerReaction: (id, messageId, reaction) =>
        setConversations((cs) =>
          cs.map((c) =>
            c.id !== id
              ? c
              : {
                  ...c,
                  messages: c.messages.map((m) => {
                    if (m.id !== messageId) return m;
                    const qui = m.reactions[reaction] ?? [];
                    return { ...m, reactions: { ...m.reactions, [reaction]: qui.includes(ID_MOI) ? qui.filter((x) => x !== ID_MOI) : [...qui, ID_MOI] } };
                  }),
                },
          ),
        ),
      marquerLu: (id) => setConversations((cs) => cs.map((c) => (c.id === id ? { ...c, luJusqua: new Date().toISOString() } : c))),
      quitterGroupe: (id) => setConversations((cs) => cs.map((c) => (c.id === id && c.type === "groupe" ? { ...c, participants: c.participants.filter((p) => p !== ID_MOI) } : c))),
      effacer: async () => {
        minuteries.current.forEach(clearTimeout);
        minuteries.current = [];
        await effacerConversationsLocales();
        setConversations(creerConversationsExemples(new Date()));
      },
    };
  }, [conversations, bloques, moi.mineur, pret, peutDiscuterAvec, participantsDe, ajouterMessage, fairerReagir]);

  return <ContexteConversations.Provider value={valeur}>{children}</ContexteConversations.Provider>;
}
