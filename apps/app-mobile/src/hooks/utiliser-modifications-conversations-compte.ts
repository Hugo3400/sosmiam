import { useMemo, type Dispatch, type RefObject, type SetStateAction } from "react";

import type { ServicesSociaux } from "@sos-miam/commun/client-api/services-sociaux";
import { MAX_CONVERSATIONS_EPINGLEES } from "@sos-miam/commun/regles/chat";
import { LONGUEUR_MAX_MESSAGE } from "@sos-miam/commun/regles/potes";
import type { ConversationApi } from "@sos-miam/commun/types/messagerie";
import { contientMotInterdit } from "@sos-miam/commun/validation/contient-mot-interdit";
import type { MessageChatEnrichi } from "~/contenus/type-discussion-chat";
import { calculerMinutesPourModifier } from "~/fonctions/chat/calculer-minutes-pour-modifier";
import { convertirMessageApi } from "~/fonctions/chat/convertir-message-api";
import type { EtatConversations, ResultatModificationChat } from "~/hooks/utiliser-conversations";

type Fil = { messages: MessageChatEnrichi[]; suite: string | null; version: number };

type Options = {
  sociaux: ServicesSociaux;
  monId: string;
  generation: RefObject<number>;
  fils: Record<string, Fil>;
  setFils: Dispatch<SetStateAction<Record<string, Fil>>>;
  liste: ConversationApi[];
  setListe: Dispatch<SetStateAction<ConversationApi[]>>;
  chargerListe: () => Promise<void>;
};

const REFUS_MODIFICATION: Readonly<Record<string, ResultatModificationChat>> = {
  "trop-tard": "trop-tard",
  "non-modifiable": "non-modifiable",
  "message-inconnu": "non-modifiable",
  "pas-l-auteur": "non-modifiable",
  "conversation-fermee": "interdit",
  "conversation-inconnue": "interdit",
  "message-refuse": "mot-interdit",
  "compte-limite": "compte-limite",
};

export function utiliserModificationsConversationsCompte({ sociaux, monId, generation, fils, setFils, liste, setListe, chargerListe }: Options): Pick<EtatConversations, "modifierMessage" | "epingler"> {
  return useMemo(
    () => ({
      modifierMessage: async (id: string, messageId: string, texte: string): Promise<ResultatModificationChat> => {
        const propre = texte.trim();
        if (propre === "") return "vide";
        if (propre.length > LONGUEUR_MAX_MESSAGE) return "trop-long";
        if (contientMotInterdit(propre)) return "mot-interdit";
        const message = fils[id]?.messages.find((m) => m.id === messageId);
        if (!message || message.auteur !== monId || message.type !== "texte" || message.etat || message.systeme) return "non-modifiable";
        if (calculerMinutesPourModifier(message.date, new Date()) <= 0) return "trop-tard";
        if (propre === message.texte) return "ok";
        const g = generation.current;
        const r = await sociaux.messagerie.modifierMessage(id, messageId, propre);
        if (g !== generation.current) return "reseau";
        if (!r.ok) {
          const code: string = r.erreur;
          return REFUS_MODIFICATION[code] ?? "reseau";
        }
        const recu = convertirMessageApi(r.message);
        setFils((avant) => {
          const fil = avant[id];
          if (!fil) return avant;
          return { ...avant, [id]: { ...fil, messages: fil.messages.map((m) => (m.id === recu.id ? recu : m)), version: Math.max(fil.version, r.version) } };
        });
        return "ok";
      },
      epingler: async (id: string, epinglee: boolean) => {
        const conversation = liste.find((c) => c.id === id);
        if (!conversation) return "reseau" as const;
        if ((conversation.epinglee === true) === epinglee) return "ok" as const;
        if (epinglee && liste.filter((c) => c.epinglee).length >= MAX_CONVERSATIONS_EPINGLEES) return "plein" as const;
        const changer = (valeur: boolean) => setListe((avant) => avant.map((c) => (c.id === id ? { ...c, epinglee: valeur } : c)));
        changer(epinglee);
        const g = generation.current;
        const r = await sociaux.messagerie.epingler(id, epinglee);
        if (g !== generation.current) return "reseau" as const;
        if (!r.ok) {
          changer(!epinglee);
          const code: string = r.erreur;
          return code === "trop-d-epinglees" ? ("plein" as const) : ("reseau" as const);
        }
        void chargerListe();
        return "ok" as const;
      },
    }),
    [sociaux, monId, generation, fils, setFils, liste, setListe, chargerListe],
  );
}
