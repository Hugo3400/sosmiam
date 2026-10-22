import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { LONGUEUR_MAX_TITRE_GROUPE, MAX_CONVERSATIONS_EPINGLEES, MAX_PARTICIPANTS_GROUPE } from "@sos-miam/commun/regles/chat";
import { LONGUEUR_MAX_MESSAGE } from "@sos-miam/commun/regles/potes";
import { REACTIONS_CHAT } from "@sos-miam/commun/types/conversations";
import { contientMotInterdit } from "@sos-miam/commun/validation/contient-mot-interdit";
import { creerConversationsExemples } from "~/contenus/conversations-exemples";
import { potesExemples, reponsesExemples } from "~/contenus/potes-exemples";
import type { ConversationEnrichie, LectureChat, MessageChatEnrichi } from "~/contenus/type-discussion-chat";
import { calculerMinutesPourModifier } from "~/fonctions/chat/calculer-minutes-pour-modifier";
import { citerMessage } from "~/fonctions/chat/citer-message";
import { filtrerMessagesSignales } from "~/fonctions/chat/filtrer-messages-signales";
import { listerMentionsMessage } from "~/fonctions/chat/lister-mentions-message";
import { creerIdentifiant } from "~/fonctions/communaute/creer-identifiant";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import type { EtatConversations, ResultatEnvoiChat } from "~/hooks/utiliser-conversations";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { creerComplementsConversationsDemo } from "~/services/demo/complements-conversations-demo";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";
import { ecouterReglagesMessagerieDemo, lireReglagesMessagerieDemo } from "~/services/demo/reglages-messagerie-demo";
import {
  effacerConversationsLocales,
  enregistrerConversationsLocales,
  garderFichierChat,
  lireConversationsLocales,
  supprimerFichiersChat,
} from "~/stockage/conversations-locales";

const dernierMessage = (c: ConversationEnrichie) => c.messages[c.messages.length - 1]?.date ?? "";
const auHasard = <T,>(liste: readonly T[]): T => liste[Math.floor(Math.random() * liste.length)];
// Hors démo, on part de zéro : une conversation gardée par une ancienne démo (avec un pote d'exemple) est oubliée
const idsPotesExemples = new Set(potesExemples.map((p) => p.id));
const creerConversationsDepart = (maintenant: Date) => (DEMO_VISITES_ACTIVE ? creerConversationsExemples(maintenant) : []);
// Rien ne part au serveur : aucun message en pause
const AUCUN_EN_PAUSE: ReadonlySet<string> = new Set();
const PART_LECTURE_GROUPE = 0.6;

const noterLecture = (lectures: readonly LectureChat[] | undefined, membre: string, luJusqua: string, luLe: string): LectureChat[] => [
  ...(lectures ?? []).filter((l) => l.membre !== membre),
  { membre, luJusqua, luLe },
];

/**
 * Le chat gardé sur le téléphone : messages privés et groupes, avec leurs photos et notes vocales. Mode démo : des
 * conversations d'exemple, et des potes qui répondent tout seuls ; en visite, rien. Avec un compte, c'est
 * utiliserConversationsCompte (le serveur) qui sert.
 */
export function utiliserConversationsLocales(): EtatConversations {
  const communaute = utiliserCommunaute();
  const monId = utiliserMonId();
  const [conversations, setConversations] = useState<ConversationEnrichie[]>(() => creerConversationsDepart(new Date()));
  const { accusesLecture } = useSyncExternalStore(ecouterReglagesMessagerieDemo, lireReglagesMessagerieDemo, lireReglagesMessagerieDemo);
  const [pret, setPret] = useState(false);
  const charge = useRef(false);
  const minuteries = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    lireConversationsLocales().then((lues) => {
      charge.current = true;
      // Démo : une liste vide gardée hors démo (ou effacée juste avant d'y entrer) n'est pas une démo : on garde les exemples.
      // Hors démo : une conversation gardée par une ancienne démo (avec un pote d'exemple) est oubliée
      if (lues && DEMO_VISITES_ACTIVE && lues.length > 0) setConversations(lues);
      else if (lues && !DEMO_VISITES_ACTIVE) setConversations(lues.filter((c) => !c.participants.some((id) => idsPotesExemples.has(id))));
      setPret(true);
    });
    const enCours = minuteries.current;
    return () => enCours.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (charge.current) enregistrerConversationsLocales(conversations).catch(() => {});
  }, [conversations]);

  const { trouverPote, estSignale } = communaute;
  const monPseudo = communaute.moi.pseudo;
  const bloques = useMemo(() => new Set(communaute.bloques.map((p) => p.id)), [communaute.bloques]);
  // Ta bande, sans les personnes bloquées : retirer quelqu'un de sa bande met aussi votre discussion en pause
  const bande = useMemo(() => new Set(communaute.potes.map((p) => p.id)), [communaute.potes]);
  const peutDiscuterAvec = useCallback((poteId: string) => !!trouverPote(poteId) && bande.has(poteId) && !bloques.has(poteId), [trouverPote, bande, bloques]);

  const ajouterMessage = useCallback((id: string, message: MessageChatEnrichi) => {
    setConversations((cs) => cs.map((c) => (c.id === id ? { ...c, messages: [...c.messages, message] } : c)));
  }, []);

  // Démo : un pote de la conversation répond ou réagit un peu plus tard
  const faireReagir = useCallback(
    (conversation: ConversationEnrichie, message: MessageChatEnrichi) => {
      const autres = conversation.participants.filter((id) => id !== monId && !bloques.has(id) && trouverPote(id));
      if (autres.length === 0) return;
      const mentionne = message.mentions?.find((id) => autres.includes(id));
      const auteur = mentionne ?? auHasard(autres);
      minuteries.current.push(
        setTimeout(() => {
          const maintenant = new Date().toISOString();
          setConversations((cs) =>
            cs.map((c) => {
              if (c.id !== conversation.id) return c;
              const lecteurs = autres.filter((id) => id === auteur || (c.type === "groupe" && Math.random() < PART_LECTURE_GROUPE));
              const lectures = lecteurs.reduce<LectureChat[] | undefined>((l, id) => noterLecture(l, id, message.id, maintenant), c.lectures);
              if (!mentionne && Math.random() < 0.35) {
                const reaction = auHasard(REACTIONS_CHAT);
                return { ...c, lectures, messages: c.messages.map((m) => (m.id !== message.id ? m : { ...m, reactions: { ...m.reactions, [reaction]: [...(m.reactions[reaction] ?? []), auteur] } })) };
              }
              const reponse = auHasard(reponsesExemples);
              const texte = mentionne && monPseudo ? `@${monPseudo} ${reponse}` : reponse;
              const mentions = mentionne && monPseudo ? [monId] : undefined;
              return { ...c, lectures, messages: [...c.messages, { id: creerIdentifiant("chat"), auteur, date: maintenant, type: "texte", texte, reactions: {}, ...(mentions ? { mentions } : {}) }] };
            }),
          );
        }, 2500 + Math.random() * 3500),
      );
    },
    [bloques, trouverPote, monId, monPseudo],
  );

  const valeur = useMemo((): EtatConversations => {
    const visibles = conversations
      .filter((c) => c.participants.includes(monId))
      .filter((c) => c.type === "groupe" || !c.participants.some((id) => bloques.has(id)))
      .map(({ lectures, ...c }) => ({
        ...c,
        ...(accusesLecture && lectures ? { lectures: lectures.filter((l) => !bloques.has(l.membre)) } : {}),
        coupee: c.coupee ?? false,
        messages: filtrerMessagesSignales(c.messages.filter((m) => !bloques.has(m.auteur)), estSignale),
      }))
      .sort((a, b) => dernierMessage(b).localeCompare(dernierMessage(a)));
    const nonLusDe = (id: string) => {
      const c = visibles.find((x) => x.id === id);
      return c ? c.messages.filter((m) => m.auteur !== monId && (!c.luJusqua || m.date > c.luJusqua)).length : 0;
    };

    const ouverte = (c: ConversationEnrichie | undefined): c is ConversationEnrichie =>
      !!c && (c.type === "groupe" || c.participants.every((p) => p === monId || peutDiscuterAvec(p)));
    const envoyer = (id: string, message: Omit<MessageChatEnrichi, "id" | "auteur" | "date" | "reactions">): ResultatEnvoiChat => {
      const c = visibles.find((x) => x.id === id);
      if (!ouverte(c)) return "interdit";
      const complet: MessageChatEnrichi = { id: creerIdentifiant("chat"), auteur: monId, date: new Date().toISOString(), reactions: {}, ...message };
      ajouterMessage(id, complet);
      faireReagir(c, complet);
      return "ok";
    };
    const mentionsDe = (c: ConversationEnrichie | undefined, texte: string) =>
      c?.type === "groupe"
        ? listerMentionsMessage(texte, c.participants.flatMap((p) => (p === monId ? [] : [{ id: p, pseudo: trouverPote(p)?.pseudo ?? "" }])))
        : [];
    const publier = (id: string, messages: MessageChatEnrichi[]): ResultatEnvoiChat => {
      const c = visibles.find((x) => x.id === id);
      if (!ouverte(c) || messages.length === 0) return "interdit";
      setConversations((cs) => cs.map((x) => (x.id === id ? { ...x, messages: [...x.messages, ...messages] } : x)));
      faireReagir(c, messages[0]);
      return "ok";
    };
    const complements = creerComplementsConversationsDemo({
      conversations: visibles,
      monId,
      ouverte: (id) => ouverte(visibles.find((x) => x.id === id)),
      peutDiscuterAvec,
      changer: (id, changer) => setConversations((cs) => cs.map((c) => (c.id === id ? changer(c) : c))),
      publier,
      planifier: (faire, delaiMs) => {
        minuteries.current.push(setTimeout(faire, delaiMs));
      },
    });
    const envoyerFichier = async (id: string, uri: string, extension: string, autre: Partial<MessageChatEnrichi> & { type: "photo" | "vocal" }) => {
      if (!ouverte(visibles.find((x) => x.id === id))) return "interdit" as const;
      try {
        const fichier = await garderFichierChat(uri, extension);
        return envoyer(id, { ...autre, fichier });
      } catch {
        return "interdit" as const;
      }
    };
    return {
      source: DEMO_VISITES_ACTIVE ? "demo" : "visite",
      pret,
      conversations: visibles,
      trouverConversation: (id) => visibles.find((c) => c.id === id) ?? null,
      nonLus: visibles.reduce((n, c) => n + nonLusDe(c.id), 0),
      nonLusDe,
      peutDiscuterAvec,
      ouvrirPrive: async (poteId) => {
        if (!peutDiscuterAvec(poteId)) return null;
        const existante = conversations.find((c) => c.type === "prive" && c.participants.includes(poteId) && c.participants.includes(monId));
        if (existante) return existante.id;
        const id = creerIdentifiant("prive");
        setConversations((cs) => [...cs, { id, type: "prive", participants: [monId, poteId], creePar: monId, messages: [] }]);
        return id;
      },
      creerGroupe: async (titre, emoji, potes) => {
        const propre = titre.trim();
        if (propre === "" || propre.length > LONGUEUR_MAX_TITRE_GROUPE || contientMotInterdit(propre)) return { erreur: "titre" };
        const membres = [...new Set(potes)].filter(peutDiscuterAvec);
        if (membres.length < 1 || membres.length + 1 > MAX_PARTICIPANTS_GROUPE) return { erreur: "participants" };
        const id = creerIdentifiant("groupe");
        setConversations((cs) => [...cs, { id, type: "groupe", titre: propre, emoji, participants: [monId, ...membres], creePar: monId, admins: [monId], messages: [] }]);
        return { id };
      },
      envoyerTexte: (id, texte, o) => {
        const propre = texte.trim();
        if (propre === "") return "vide";
        if (propre.length > LONGUEUR_MAX_MESSAGE) return "trop-long";
        if (contientMotInterdit(propre)) return "mot-interdit";
        const c = visibles.find((x) => x.id === id);
        const cite = o?.reponseA ? c?.messages.find((m) => m.id === o.reponseA && !m.systeme) : undefined;
        const mentions = mentionsDe(c, propre);
        return envoyer(id, { type: "texte", texte: propre, ...(cite ? { reponseA: citerMessage(cite) } : {}), ...(mentions.length > 0 ? { mentions } : {}) });
      },
      modifierMessage: async (id, messageId, texte) => {
        const propre = texte.trim();
        if (propre === "") return "vide";
        if (propre.length > LONGUEUR_MAX_MESSAGE) return "trop-long";
        if (contientMotInterdit(propre)) return "mot-interdit";
        const c = visibles.find((x) => x.id === id);
        const message = c?.messages.find((m) => m.id === messageId);
        if (!c || !message || message.auteur !== monId || message.type !== "texte" || message.etat || message.systeme) return "non-modifiable";
        if (calculerMinutesPourModifier(message.date, new Date()) <= 0) return "trop-tard";
        if (propre === message.texte) return "ok";
        const mentions = mentionsDe(c, propre);
        const modifieLe = new Date().toISOString();
        setConversations((cs) =>
          cs.map((x) =>
            x.id !== id
              ? x
              : {
                  ...x,
                  messages: x.messages.map((m) => {
                    if (m.id !== messageId) return m;
                    const { mentions: _avant, ...reste } = m;
                    return { ...reste, texte: propre, modifieLe, ...(mentions.length > 0 ? { mentions } : {}) };
                  }),
                },
          ),
        );
        return "ok";
      },
      epingler: async (id, epinglee) => {
        const c = visibles.find((x) => x.id === id);
        if (!c) return "reseau";
        if (epinglee && !c.epinglee && visibles.filter((x) => x.epinglee).length >= MAX_CONVERSATIONS_EPINGLEES) return "plein";
        setConversations((cs) => cs.map((x) => (x.id === id ? { ...x, epinglee } : x)));
        return "ok";
      },
      envoyerLieu: (id, lieuId) => envoyer(id, { type: "lieu", lieuId }),
      envoyerVocal: (id, uri, duree, onde) => envoyerFichier(id, uri, "m4a", { type: "vocal", dureeSecondes: Math.round(duree), ...(onde ? { onde } : {}) }),
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
                    return { ...m, reactions: { ...m.reactions, [reaction]: qui.includes(monId) ? qui.filter((x) => x !== monId) : [...qui, monId] } };
                  }),
                },
          ),
        ),
      marquerLu: (id) => setConversations((cs) => cs.map((c) => (c.id === id ? { ...c, luJusqua: new Date().toISOString() } : c))),
      // Démo : pas d'invitations ni de fil à relire ; tout est déjà sur le téléphone
      invitations: [],
      repondreInvitation: async () => false,
      suivreFil: () => () => {},
      chargerPlusAnciens: () => {},
      renvoyer: () => {},
      envoisEnPause: AUCUN_EN_PAUSE,
      retirerEnPause: () => {},
      supprimerMessage: () => {},
      effacerPourMoi: (id) => {
        const conversation = conversations.find((c) => c.id === id);
        if (!conversation) return;
        // Sur le téléphone, les messages partent avec leurs photos et notes vocales (démo : les potes n'ont rien à garder)
        setConversations((cs) => cs.map((c) => (c.id === id ? { ...c, messages: [] } : c)));
        supprimerFichiersChat(conversation.messages.flatMap((m) => (m.fichier ? [m.fichier] : [])));
      },
      quitterGroupe: (id) => {
        const groupe = conversations.find((c) => c.id === id && c.type === "groupe");
        if (!groupe) return;
        // Le groupe disparaît du téléphone avec ses photos et notes vocales (une réponse déjà en route ne le retrouvera plus)
        setConversations((cs) => cs.filter((c) => c.id !== id));
        supprimerFichiersChat([...groupe.messages.flatMap((m) => (m.fichier ? [m.fichier] : [])), ...(groupe.fichierPhoto ? [groupe.fichierPhoto] : [])]);
      },
      ...complements,
      effacer: async () => {
        minuteries.current.forEach(clearTimeout);
        minuteries.current = [];
        await effacerConversationsLocales();
        setConversations(creerConversationsDepart(new Date()));
      },
    };
  }, [conversations, bloques, estSignale, pret, peutDiscuterAvec, ajouterMessage, faireReagir, monId, accusesLecture, trouverPote]);

  return valeur;
}
