import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ReponseMessage } from "@sos-miam/commun/client-api/contrat-messagerie";
import { convertirReactionEnCode } from "@sos-miam/commun/fonctions/messagerie/convertir-reaction-en-code";
import { LONGUEUR_MAX_TITRE_GROUPE, MAX_PARTICIPANTS_GROUPE } from "@sos-miam/commun/regles/chat";
import { LONGUEUR_MAX_MESSAGE } from "@sos-miam/commun/regles/potes";
import type { ConversationApi, InvitationGroupeApi } from "@sos-miam/commun/types/messagerie";
import { contientMotInterdit } from "@sos-miam/commun/validation/contient-mot-interdit";
import type { MessageChatEnrichi } from "~/contenus/type-discussion-chat";
import { citerMessage } from "~/fonctions/chat/citer-message";
import { convertirConversationApi } from "~/fonctions/chat/convertir-conversation-api";
import { convertirMessageApi } from "~/fonctions/chat/convertir-message-api";
import { filtrerMessagesSignales } from "~/fonctions/chat/filtrer-messages-signales";
import { fusionnerFil } from "~/fonctions/chat/fusionner-fil";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import type { EtatConversations, ResultatEnvoiChat } from "~/hooks/utiliser-conversations";
import { utiliserEnvoisConversationsCompte, type LancerEnvoiChat } from "~/hooks/utiliser-envois-conversations-compte";
import { utiliserGroupesConversationsCompte } from "~/hooks/utiliser-groupes-conversations-compte";
import { utiliserModificationsConversationsCompte } from "~/hooks/utiliser-modifications-conversations-compte";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserPoulsSocial } from "~/hooks/utiliser-pouls-social";
import { utiliserSession } from "~/hooks/utiliser-session";
import { effacerMediasChatCompte, oublierEnvoiChat, oublierMediaChat } from "~/stockage/medias-chat-compte";

type Fil = { messages: MessageChatEnrichi[]; suite: string | null; version: number };
/** Un envoi en cours ou raté : son message à l'écran, et de quoi le renvoyer tel quel (même idClient : jamais deux fois) */
type Envoi = { conversationId: string; message: MessageChatEnrichi };

// Une discussion ouverte est relue toutes les 5 s pendant une minute, puis toutes les 15 s (C.3)
const RELECTURE_RAPIDE_MS = 5000;
const RELECTURES_RAPIDES = 12;
const RELECTURE_LENTE_MS = 15_000;

/**
 * Le chat d'un compte connecté : tout vient du serveur (/app/conversations), relu quand le pouls dit que les messages ont
 * bougé, et chaque discussion ouverte relue régulièrement (suivreFil). Un message s'affiche tout de suite (« envoi »),
 * puis il est remplacé par celui du serveur, ou passe en « echec » (toucher pour le renvoyer, même idClient). Les groupes
 * s'ouvrent par invitation à accepter. Les discussions des sorties n'y sont pas : elles vivent dans les sorties.
 */
export function utiliserConversationsCompte(actif: boolean): EtatConversations {
  const { sociaux } = utiliserSession();
  const { pouls, relire: relirePouls } = utiliserPoulsSocial();
  const communaute = utiliserCommunaute();
  const monId = utiliserMonId();
  const [liste, setListe] = useState<ConversationApi[]>([]);
  // Les discussions des sorties : hors de la liste des messages, mais lues, écrites et relues ici (utiliserDiscussionSortie)
  const [sorties, setSorties] = useState<Record<string, ConversationApi>>({});
  const [invitationsApi, setInvitationsApi] = useState<InvitationGroupeApi[]>([]);
  const [fils, setFils] = useState<Record<string, Fil>>({});
  const [envois, setEnvois] = useState<Record<string, Envoi>>({});
  // Les envois refusés parce que le compte est limité (id du message à l'écran) : ils ne repartent plus
  const [enPause, setEnPause] = useState<ReadonlySet<string>>(new Set());
  const [pret, setPret] = useState(false);
  const generation = useRef(0);
  const filsLus = useRef(fils);
  filsLus.current = fils;
  const envoisLus = useRef(envois);
  envoisLus.current = envois;
  const departs = useRef(new Map<string, () => Promise<ReponseMessage>>());
  const etaitActif = useRef(false);
  const suivis = useRef(new Set<string>());
  const { noterPersonne } = communaute;

  const tant = useCallback((g: number) => g === generation.current, []);
  const noterPersonnes = useCallback(
    (c: ConversationApi) => {
      c.membres.forEach((m) => noterPersonne(m.personne));
      if (c.autre) noterPersonne(c.autre);
    },
    [noterPersonne],
  );
  const garderConversation = useCallback((c: ConversationApi) => {
    if (c.type === "sortie") return setSorties((avant) => ({ ...avant, [c.id]: c }));
    setListe((avant) => [c, ...avant.filter((x) => x.id !== c.id)]);
  }, []);

  const chargerListe = useCallback(async () => {
    const g = generation.current;
    const r = await sociaux.messagerie.listerConversations();
    if (!tant(g)) return;
    if (r.ok) {
      const premieres = r.conversations.filter((c) => c.type !== "sortie");
      const gardees = [...premieres, ...(r.epinglees ?? []).filter((e) => e.type !== "sortie" && !premieres.some((c) => c.id === e.id))];
      const deSorties = r.conversations.filter((c) => c.type === "sortie");
      gardees.forEach(noterPersonnes);
      if (deSorties.length > 0) setSorties((avant) => ({ ...avant, ...Object.fromEntries(deSorties.map((c) => [c.id, c])) }));
      r.invitations.forEach((i) => i.invitePar && noterPersonne(i.invitePar));
      setListe(gardees);
      setInvitationsApi(r.invitations);
    }
    setPret(true);
  }, [sociaux, tant, noterPersonnes, noterPersonne]);

  const lireFil = useCallback(
    async (id: string, plusAnciens = false) => {
      const g = generation.current;
      const deja = filsLus.current[id];
      if (plusAnciens && !deja?.suite) return;
      const r = await sociaux.messagerie.lireFil(id, plusAnciens ? { avant: deja!.suite! } : deja ? { version: deja.version } : {});
      if (!tant(g)) return;
      if (!r.ok) {
        // Plus membre (quitté, retiré, bloqué) : la discussion disparaît
        if (r.erreur === "conversation-inconnue") {
          setListe((avant) => avant.filter((c) => c.id !== id));
          setSorties(({ [id]: _partie, ...reste }) => reste);
          setFils(({ [id]: _parti, ...reste }) => reste);
        }
        return;
      }
      if (!("fil" in r)) return;
      const { fil } = r;
      noterPersonnes(fil.conversation);
      garderConversation(fil.conversation);
      const page = fil.messages.map(convertirMessageApi);
      setFils((avant) => {
        const ancien = avant[id];
        const messages = fusionnerFil(ancien?.messages ?? [], page, plusAnciens);
        return { ...avant, [id]: { messages, suite: plusAnciens || !ancien ? fil.suite : ancien.suite, version: plusAnciens && ancien ? ancien.version : fil.version } };
      });
    },
    [sociaux, tant, noterPersonnes, garderConversation],
  );

  // Connexion : la liste est lue ; déconnexion (ou démo) : tout est oublié
  useEffect(() => {
    generation.current += 1;
    departs.current.clear();
    if (!actif) {
      // Déconnexion (ou entrée en démo) : les photos et notes vocales téléchargées partent avec le reste
      if (etaitActif.current) effacerMediasChatCompte();
      etaitActif.current = false;
      setListe([]);
      setSorties({});
      setInvitationsApi([]);
      setFils({});
      setEnvois({});
      setEnPause(new Set());
      setPret(false);
      return;
    }
    etaitActif.current = true;
    void chargerListe();
  }, [actif, chargerListe]);

  // Le pouls dit que les messages ont bougé : la liste et les discussions ouvertes sont relues
  const signature = pouls?.messages.signature ?? null;
  const derniere = useRef<string | null>(null);
  useEffect(() => {
    if (!actif || signature === null) return;
    if (derniere.current !== null && derniere.current !== signature) {
      void chargerListe();
      suivis.current.forEach((id) => void lireFil(id));
    }
    derniere.current = signature;
  }, [actif, signature, chargerListe, lireFil]);

  // Le pouls dit qu'une discussion de sortie a bougé : celles ouvertes à l'écran sont relues
  const signatureSorties = pouls?.sorties.signature ?? null;
  const derniereSorties = useRef<string | null>(null);
  useEffect(() => {
    if (!actif || signatureSorties === null) return;
    if (derniereSorties.current !== null && derniereSorties.current !== signatureSorties) suivis.current.forEach((id) => sorties[id] && void lireFil(id));
    derniereSorties.current = signatureSorties;
    // sorties : lu au moment où la signature change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actif, signatureSorties, lireFil]);

  const suivreFil = useCallback(
    (id: string) => {
      if (!actif) return () => {};
      suivis.current.add(id);
      let arrete = false;
      let tours = 0;
      let minuterie: ReturnType<typeof setTimeout> | undefined;
      const relire = async () => {
        await lireFil(id);
        if (arrete) return;
        tours += 1;
        minuterie = setTimeout(() => void relire(), tours < RELECTURES_RAPIDES ? RELECTURE_RAPIDE_MS : RELECTURE_LENTE_MS);
      };
      void relire();
      return () => {
        arrete = true;
        suivis.current.delete(id);
        clearTimeout(minuterie);
      };
    },
    [actif, lireFil],
  );

  /** Fait partir un envoi (ou le refait, même idClient) ; le message du serveur remplace celui de l'écran */
  const essayer = useCallback(
    async (idClient: string) => {
      const partir = departs.current.get(idClient);
      if (!partir) return;
      const g = generation.current;
      setEnvois((avant) => (avant[idClient] ? { ...avant, [idClient]: { ...avant[idClient], message: { ...avant[idClient].message, etat: "envoi" } } } : avant));
      const r = await partir();
      if (!tant(g)) return;
      if (!r.ok) {
        setEnvois((avant) => (avant[idClient] ? { ...avant, [idClient]: { ...avant[idClient], message: { ...avant[idClient].message, etat: "echec" } } } : avant));
        // Compte limité : pas une panne, il ne repart plus (sans départ, renvoyer ne fait rien) ; la bulle dit pourquoi
        if (r.erreur === "compte-limite") {
          departs.current.delete(idClient);
          setEnPause((avant) => new Set(avant).add(`envoi:${idClient}`));
        }
        return;
      }
      departs.current.delete(idClient);
      const recu = convertirMessageApi(r.message);
      const conversationId = envoisLus.current[idClient]?.conversationId;
      // La note vocale gardée pour l'envoi ne sert plus : le serveur l'a
      const copie = envoisLus.current[idClient]?.message.fichier;
      if (copie) oublierEnvoiChat(copie);
      setEnvois(({ [idClient]: _parti, ...reste }) => reste);
      // Le message du serveur prend la place de celui de l'écran (la discussion ouverte n'attend pas sa prochaine relecture)
      if (conversationId) {
        setFils((avant) => {
          const fil = avant[conversationId];
          if (!fil) return avant;
          return { ...avant, [conversationId]: { ...fil, messages: [...fil.messages.filter((m) => m.id !== recu.id), recu], version: Math.max(fil.version, r.version) } };
        });
      }
      void chargerListe();
    },
    [tant, chargerListe],
  );

  const lancer = useCallback<LancerEnvoiChat>(
    (conversationId, contenu, partir, idClient = Crypto.randomUUID()) => {
      const message: MessageChatEnrichi = { id: `envoi:${idClient}`, idClient, auteur: monId, date: new Date().toISOString(), reactions: {}, etat: "envoi", ...contenu };
      departs.current.set(idClient, () => partir(idClient));
      setEnvois((avant) => ({ ...avant, [idClient]: { conversationId, message } }));
      void essayer(idClient);
    },
    [monId, essayer],
  );

  const modifications = utiliserModificationsConversationsCompte({ sociaux, monId, generation, fils, setFils, liste, setListe, chargerListe });
  const envoisRiches = utiliserEnvoisConversationsCompte({ sociaux, generation, fils, setFils, liste, sorties, lancer, lireFil });
  const groupes = utiliserGroupesConversationsCompte({ sociaux, generation, noterPersonne, noterPersonnes, garderConversation });

  return useMemo((): EtatConversations => {
    const bloques = new Set(communaute.bloques.map((p) => p.id));
    const bande = new Set(communaute.potes.map((p) => p.id));
    const peutDiscuterAvec = (poteId: string) => bande.has(poteId) && !bloques.has(poteId);
    const enCours = Object.values(envois);
    const conversations = liste
      .map((c) => {
        const fil = fils[c.id];
        const enAttente = enCours.filter((e) => e.conversationId === c.id).map((e) => e.message);
        const base = convertirConversationApi(c, fil ? { messages: fil.messages, plusAnciens: fil.suite !== null } : undefined);
        const messages = filtrerMessagesSignales([...base.messages, ...enAttente], communaute.estSignale);
        return { ...base, messages };
      })
      .sort((a, b) => (b.messages[b.messages.length - 1]?.date ?? "").localeCompare(a.messages[a.messages.length - 1]?.date ?? ""));
    const discussionDeSortie = (id: string) => {
      const c = sorties[id];
      if (!c) return null;
      const fil = fils[id];
      const base = convertirConversationApi(c, fil ? { messages: fil.messages, plusAnciens: fil.suite !== null } : undefined);
      const enAttente = enCours.filter((e) => e.conversationId === id).map((e) => e.message);
      return { ...base, messages: filtrerMessagesSignales([...base.messages, ...enAttente], communaute.estSignale) };
    };
    const trouver = (id: string) => conversations.find((c) => c.id === id) ?? discussionDeSortie(id);
    const ouverte = (id: string) => (liste.find((c) => c.id === id) ?? sorties[id])?.ouverte === true;
    const verifierTexte = (texte: string): ResultatEnvoiChat => {
      const propre = texte.trim();
      if (propre === "") return "vide";
      if (propre.length > LONGUEUR_MAX_MESSAGE) return "trop-long";
      return contientMotInterdit(propre) ? "mot-interdit" : "ok";
    };
    const changerConversation = (id: string, changer: (c: ConversationApi) => ConversationApi) => {
      setListe((avant) => avant.map((c) => (c.id === id ? changer(c) : c)));
      setSorties((avant) => (avant[id] ? { ...avant, [id]: changer(avant[id]) } : avant));
    };

    return {
      source: "compte",
      pret,
      conversations,
      trouverConversation: trouver,
      nonLus: pret ? liste.reduce((n, c) => n + c.nonLus, 0) : (pouls?.messages.nonLus ?? 0),
      nonLusDe: (id) => liste.find((c) => c.id === id)?.nonLus ?? 0,
      peutDiscuterAvec,
      ouvrirPrive: async (poteId) => {
        const existante = liste.find((c) => c.type === "prive" && c.autre?.id === poteId);
        if (existante) return existante.id;
        if (!peutDiscuterAvec(poteId)) return null;
        const r = await sociaux.messagerie.ouvrirPrive(poteId);
        if (!r.ok) return null;
        noterPersonnes(r.conversation);
        garderConversation(r.conversation);
        return r.conversation.id;
      },
      creerGroupe: async (titre, emoji, potes) => {
        const propre = titre.trim();
        if (propre === "" || propre.length > LONGUEUR_MAX_TITRE_GROUPE || contientMotInterdit(propre)) return { erreur: "titre" };
        const invites = [...new Set(potes)].filter(peutDiscuterAvec);
        if (invites.length < 1 || invites.length + 1 > MAX_PARTICIPANTS_GROUPE) return { erreur: "participants" };
        const r = await sociaux.messagerie.creerGroupe({ titre: propre, emoji, invites }, Crypto.randomUUID());
        if (!r.ok) {
          if (r.erreur === "message-refuse" || r.champ === "titre") return { erreur: "titre" };
          if (r.erreur === "pas-dans-la-bande" || r.erreur === "groupe-plein" || r.champ === "invites") return { erreur: "participants" };
          if (r.erreur === "compte-limite") return { erreur: "compte-limite" };
          return { erreur: "reseau" };
        }
        noterPersonnes(r.conversation);
        garderConversation(r.conversation);
        return { id: r.conversation.id };
      },
      invitations: invitationsApi.map((i) => ({ id: i.id, titre: i.titre, emoji: i.emoji, invitePar: i.invitePar?.id ?? null, membres: i.membres, date: i.date })),
      repondreInvitation: async (id, rejoint) => {
        const r = await sociaux.messagerie.repondreInvitation(id, rejoint);
        if (!r.ok) return false;
        setInvitationsApi((avant) => avant.filter((i) => i.id !== id));
        if (r.conversation) {
          noterPersonnes(r.conversation);
          garderConversation(r.conversation);
        }
        relirePouls();
        return true;
      },
      suivreFil,
      chargerPlusAnciens: (id) => void lireFil(id, true),
      envoyerTexte: (id, texte, o) => {
        const verdict = verifierTexte(texte);
        if (verdict !== "ok") return verdict;
        if (!ouverte(id)) return "interdit";
        const propre = texte.trim();
        const cite = o?.reponseA ? fils[id]?.messages.find((m) => m.id === o.reponseA && !m.id.startsWith("envoi:") && !m.systeme) : undefined;
        lancer(id, { type: "texte", texte: propre, ...(cite ? { reponseA: citerMessage(cite) } : {}) }, async (idClient) => {
          if (!cite) return sociaux.messagerie.envoyerTexte(id, idClient, propre);
          const r = await sociaux.messagerie.envoyerTexte(id, idClient, propre, { reponseA: cite.id });
          const code: string = r.ok ? "" : r.erreur;
          return code === "reponse-introuvable" || code === "erreur-serveur" ? sociaux.messagerie.envoyerTexte(id, idClient, propre) : r;
        });
        return "ok";
      },
      envoyerLieu: (id, lieuId) => {
        if (!ouverte(id)) return "interdit";
        lancer(id, { type: "lieu", lieuId }, (idClient) => sociaux.messagerie.envoyerLieu(id, idClient, lieuId));
        return "ok";
      },
      envoisEnPause: enPause,
      retirerEnPause: (messageId) => {
        const envoi = enCours.find((e) => e.message.id === messageId);
        const idClient = envoi?.message.idClient;
        if (!envoi || !idClient || !enPause.has(messageId)) return;
        // Jamais parti (le serveur l'a refusé) : rien à effacer chez les autres, seulement l'écran et la copie de la note vocale
        if (envoi.message.fichier) oublierEnvoiChat(envoi.message.fichier);
        departs.current.delete(idClient);
        setEnvois(({ [idClient]: _retire, ...reste }) => reste);
        setEnPause((avant) => {
          const apres = new Set(avant);
          apres.delete(messageId);
          return apres;
        });
      },
      renvoyer: (_conversationId, messageId) => {
        const envoi = enCours.find((e) => e.message.id === messageId);
        if (envoi?.message.idClient) void essayer(envoi.message.idClient);
      },
      basculerReaction: (id, messageId, reaction) => {
        const code = convertirReactionEnCode(reaction);
        const message = fils[id]?.messages.find((m) => m.id === messageId);
        if (!code || !message || message.etat) return;
        const oui = !(message.reactions[reaction] ?? []).includes(monId);
        // Tout de suite à l'écran ; si le serveur refuse, la relecture du fil remet les choses en place
        setFils((avant) => {
          const fil = avant[id];
          if (!fil) return avant;
          const messages = fil.messages.map((m) => {
            if (m.id !== messageId) return m;
            const qui = m.reactions[reaction] ?? [];
            return { ...m, reactions: { ...m.reactions, [reaction]: oui ? [...qui, monId] : qui.filter((x) => x !== monId) } };
          });
          return { ...avant, [id]: { ...fil, messages } };
        });
        void sociaux.messagerie.reagir(id, messageId, code, oui).then((r) => {
          if (!r.ok) void lireFil(id);
        });
      },
      marquerLu: (id) => {
        const derniereLue = [...(fils[id]?.messages ?? [])].reverse().find((m) => !m.id.startsWith("envoi:"))?.id ?? (liste.find((c) => c.id === id) ?? sorties[id])?.dernierMessage?.id;
        if (!derniereLue) return;
        changerConversation(id, (c) => ({ ...c, nonLus: 0 }));
        void sociaux.messagerie.marquerLu(id, derniereLue).then(() => relirePouls());
      },
      couper: (id, coupee) => {
        changerConversation(id, (c) => ({ ...c, coupee }));
        void sociaux.messagerie.couper(id, coupee).then((r) => {
          if (!r.ok) void chargerListe();
        });
      },
      supprimerMessage: (id, messageId) => {
        void sociaux.messagerie.supprimerMessage(id, messageId).then(() => lireFil(id));
      },
      effacerPourMoi: (id) => {
        // Tout de suite à l'écran (avec les photos et notes gardées en cache), puis le serveur ; la relecture remet ce qui reste
        (fils[id]?.messages ?? []).forEach((m) => (m.type === "photo" || m.type === "vocal") && oublierMediaChat(monId, m.id, m.type));
        setFils(({ [id]: _efface, ...reste }) => reste);
        changerConversation(id, (c) => ({ ...c, nonLus: 0, dernierMessage: null }));
        void sociaux.messagerie.effacerPourMoi(id).then(() => {
          void lireFil(id);
          void chargerListe();
        });
      },
      quitterGroupe: (id) => {
        setListe((avant) => avant.filter((c) => c.id !== id));
        setFils(({ [id]: _parti, ...reste }) => reste);
        void sociaux.messagerie.retirerMembre(id, "moi").then(() => relirePouls());
      },
      ...modifications,
      ...envoisRiches,
      ...groupes,
      effacer: async () => {
        departs.current.clear();
        setFils({});
        setEnvois({});
        setEnPause(new Set());
        effacerMediasChatCompte();
      },
    };
  }, [
    pret, liste, sorties, invitationsApi, fils, envois, enPause, communaute, monId, pouls, sociaux, suivreFil, lireFil, lancer, essayer, noterPersonnes, garderConversation, relirePouls, chargerListe, modifications, envoisRiches, groupes,
  ]);
}
