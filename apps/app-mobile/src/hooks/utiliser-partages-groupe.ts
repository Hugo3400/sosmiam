import { useCallback, useEffect, useRef, useState } from "react";

import type { TypePartage } from "@sos-miam/commun/types/messagerie";
import type { MessageChatEnrichi } from "~/contenus/type-discussion-chat";
import { utiliserConversations } from "~/hooks/utiliser-conversations";

type Partages = { cle: string; messages: MessageChatEnrichi[]; suite: string | null; etat: "chargement" | "pret" | "erreur" };

export function utiliserPartagesGroupe(conversationId: string, type: TypePartage, repere: string) {
  const { listerPartages } = utiliserConversations();
  const cle = `${conversationId}:${type}:${repere}`;
  const [partages, setPartages] = useState<Partages>({ cle: "", messages: [], suite: null, etat: "chargement" });
  const [suiteEnCours, setSuiteEnCours] = useState(false);
  const derniere = useRef({ listerPartages, cle });
  derniere.current = { listerPartages, cle };

  useEffect(() => {
    let actif = true;
    void listerPartages(conversationId, type).then((page) => {
      if (!actif) return;
      setPartages(page ? { cle, messages: page.messages, suite: page.suite, etat: "pret" } : { cle, messages: [], suite: null, etat: "erreur" });
    });
    return () => {
      actif = false;
    };
  }, [cle, conversationId, type, listerPartages]);

  const aJour = partages.cle === cle;
  const chargerSuite = useCallback(async () => {
    if (!aJour || !partages.suite || suiteEnCours) return;
    setSuiteEnCours(true);
    const page = await derniere.current.listerPartages(conversationId, type, partages.suite);
    setSuiteEnCours(false);
    if (!page || derniere.current.cle !== cle) return;
    setPartages((avant) => {
      const connus = new Set(avant.messages.map((m) => m.id));
      return { ...avant, messages: [...avant.messages, ...page.messages.filter((m) => !connus.has(m.id))], suite: page.suite };
    });
  }, [aJour, partages.suite, suiteEnCours, conversationId, type, cle]);

  return {
    messages: aJour ? partages.messages : [],
    etat: aJour ? partages.etat : ("chargement" as const),
    plus: aJour && partages.suite !== null,
    suiteEnCours,
    chargerSuite,
  };
}
