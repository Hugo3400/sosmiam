import * as Crypto from "expo-crypto";
import { File } from "expo-file-system";
import { useMemo, type Dispatch, type RefObject, type SetStateAction } from "react";

import type { ReponseMessage } from "@sos-miam/commun/client-api/contrat-messagerie";
import type { ServicesSociaux } from "@sos-miam/commun/client-api/services-sociaux";
import { MAX_PHOTOS_ALBUM, QUESTION_SONDAGE } from "@sos-miam/commun/regles/chat";
import { LONGUEUR_MAX_MESSAGE } from "@sos-miam/commun/regles/potes";
import type { ConversationApi } from "@sos-miam/commun/types/messagerie";
import { contientMotInterdit } from "@sos-miam/commun/validation/contient-mot-interdit";
import { validerNouveauSondage } from "@sos-miam/commun/validation/valider-nouveau-sondage";
import type { MessageChatEnrichi } from "~/contenus/type-discussion-chat";
import { appliquerVoteSondage } from "~/fonctions/chat/appliquer-vote-sondage";
import { convertirMessageApi } from "~/fonctions/chat/convertir-message-api";
import { lireEtatSondage } from "~/fonctions/chat/lire-etat-sondage";
import { preparerPhotoChat } from "~/fonctions/chat/preparer-photo-chat";
import type { EtatConversations, ResultatEnvoiChat } from "~/hooks/utiliser-conversations";
import { garderEnvoiChat } from "~/stockage/medias-chat-compte";

type Fil = { messages: MessageChatEnrichi[]; suite: string | null; version: number };

type Contenu = Omit<MessageChatEnrichi, "id" | "auteur" | "date" | "reactions">;

export type LancerEnvoiChat = (conversationId: string, contenu: Contenu, partir: (idClient: string) => Promise<ReponseMessage>, idClient?: string) => void;

type Options = {
  sociaux: ServicesSociaux;
  generation: RefObject<number>;
  fils: Record<string, Fil>;
  setFils: Dispatch<SetStateAction<Record<string, Fil>>>;
  liste: ConversationApi[];
  sorties: Record<string, ConversationApi>;
  lancer: LancerEnvoiChat;
  lireFil: (id: string) => Promise<void>;
};

type Envois = Pick<EtatConversations, "envoyerPhotos" | "envoyerVocal" | "envoyerGif" | "envoyerSondage" | "voterSondage">;

export function utiliserEnvoisConversationsCompte({ sociaux, generation, fils, setFils, liste, sorties, lancer, lireFil }: Options): Envois {
  return useMemo((): Envois => {
    const ouverte = (id: string) => (liste.find((c) => c.id === id) ?? sorties[id])?.ouverte === true;
    const remplacer = (id: string, messageId: string, changer: (m: MessageChatEnrichi) => MessageChatEnrichi, version?: number) =>
      setFils((avant) => {
        const fil = avant[id];
        if (!fil) return avant;
        return { ...avant, [id]: { ...fil, messages: fil.messages.map((m) => (m.id === messageId ? changer(m) : m)), version: Math.max(fil.version, version ?? 0) } };
      });

    return {
      envoyerPhotos: async (id, uris, legende) => {
        if (!ouverte(id)) return "interdit";
        const mot = legende?.trim() ?? "";
        if (mot.length > LONGUEUR_MAX_MESSAGE) return "trop-long";
        if (mot !== "" && contientMotInterdit(mot)) return "mot-interdit";
        const choisies = uris.slice(0, MAX_PHOTOS_ALBUM);
        if (choisies.length === 0) return "vide";
        const g = generation.current;
        const photos: { uri: string; largeur: number; hauteur: number }[] = [];
        try {
          for (const uri of choisies) photos.push(await preparerPhotoChat(uri));
        } catch {
          return "interdit";
        }
        if (g !== generation.current) return "interdit";
        const ids = photos.map(() => Crypto.randomUUID());
        const album = photos.length > 1 ? ids[0] : undefined;
        let precedent: Promise<void> = Promise.resolve();
        photos.forEach((photo, i) => {
          const avecMot = i === 0 && mot !== "" ? mot : undefined;
          const ajouts = { ...(album ? { album } : {}), ...(avecMot ? { legende: avecMot } : {}) };
          const attendre = precedent;
          let fini: () => void = () => {};
          precedent = new Promise<void>((suite) => {
            fini = suite;
          });
          lancer(
            id,
            { type: "photo", fichier: photo.uri, media: { etat: "disponible", largeur: photo.largeur, hauteur: photo.hauteur, dureeSecondes: null }, ...ajouts },
            async (idClient) => {
              await attendre;
              try {
                return await sociaux.messagerie.envoyerMedia(id, idClient, new File(photo.uri), "image/jpeg", ajouts);
              } finally {
                fini();
              }
            },
            ids[i],
          );
        });
        return "ok";
      },
      envoyerVocal: async (id, uri, duree, onde): Promise<ResultatEnvoiChat> => {
        if (!ouverte(id)) return "interdit";
        const dureeSecondes = Math.round(duree);
        let fichier: string;
        try {
          fichier = await garderEnvoiChat(uri, "m4a");
        } catch {
          return "interdit";
        }
        lancer(id, { type: "vocal", fichier, dureeSecondes, ...(onde ? { onde } : {}), media: { etat: "disponible", largeur: null, hauteur: null, dureeSecondes } }, (idClient) =>
          sociaux.messagerie.envoyerMedia(id, idClient, new File(fichier), "audio/mp4", onde ? { onde } : {}),
        );
        return "ok";
      },
      envoyerGif: (id, gif) => {
        if (!ouverte(id)) return "interdit";
        lancer(id, { type: "gif", gif: { ...gif } }, (idClient) => sociaux.messagerie.envoyerGif(id, idClient, gif.id));
        return "ok";
      },
      envoyerSondage: (id, lieux, finLe) => {
        if (!ouverte(id) || liste.find((c) => c.id === id)?.type !== "groupe") return "interdit";
        const verdict = validerNouveauSondage({ lieux, finLe }, new Date());
        if (!verdict.ok) return verdict.champ === "lieux" ? "lieux" : "fin";
        const { sondage } = verdict;
        const vote = { finLe: sondage.finLe, closLe: null, gagnant: null, options: sondage.lieux.map((lieuId, i) => ({ ordre: i + 1, lieuId, votes: 0 })), monVote: null, votants: 0 };
        lancer(id, { type: "vote", texte: QUESTION_SONDAGE, vote }, (idClient) => sociaux.messagerie.envoyerSondage(id, idClient, sondage.lieux, sondage.finLe));
        return "ok";
      },
      voterSondage: async (id, messageId, ordre) => {
        const message = fils[id]?.messages.find((m) => m.id === messageId);
        if (!message?.vote || message.etat) return "reseau";
        if (lireEtatSondage(message.vote, new Date()).clos) return "clos";
        const apres = appliquerVoteSondage(message.vote, ordre);
        if (apres === message.vote) return "ok";
        remplacer(id, messageId, (m) => ({ ...m, vote: apres }));
        const g = generation.current;
        const r = ordre === null ? await sociaux.messagerie.retirerVoteSondage(id, messageId) : await sociaux.messagerie.voterSondage(id, messageId, ordre);
        if (g !== generation.current) return "reseau";
        if (!r.ok) {
          void lireFil(id);
          const code: string = r.erreur;
          return code === "sondage-clos" ? "clos" : "reseau";
        }
        const recu = convertirMessageApi(r.message);
        remplacer(id, messageId, () => recu, r.version);
        return "ok";
      },
    };
  }, [sociaux, generation, fils, setFils, liste, sorties, lancer, lireFil]);
}
