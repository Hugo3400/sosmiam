import { useCallback, useEffect, useRef, useState } from "react";

import { chargerBrouillonsChat, enregistrerBrouillonChat, lireBrouillonsChatEnMemoire } from "~/stockage/brouillons-chat";

const DELAI_ENREGISTREMENT = 400;

export function utiliserBrouillonChat(conversationId: string): { texte: string; changer: (texte: string) => void; vider: () => void } {
  const [texte, setTexte] = useState(() => lireBrouillonsChatEnMemoire().get(conversationId)?.texte ?? "");
  const aEnregistrer = useRef<string | null>(null);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touche = useRef(false);

  useEffect(() => {
    let actif = true;
    void chargerBrouillonsChat().then((lus) => {
      if (actif && !touche.current) setTexte(lus.get(conversationId)?.texte ?? "");
    });
    return () => {
      actif = false;
    };
  }, [conversationId]);

  const enregistrer = useCallback(() => {
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = null;
    if (aEnregistrer.current === null) return;
    void enregistrerBrouillonChat(conversationId, aEnregistrer.current);
    aEnregistrer.current = null;
  }, [conversationId]);

  useEffect(() => enregistrer, [enregistrer]);

  const changer = useCallback(
    (nouveau: string) => {
      touche.current = true;
      setTexte(nouveau);
      aEnregistrer.current = nouveau;
      if (minuterie.current) clearTimeout(minuterie.current);
      if (nouveau.trim().length === 0) return enregistrer();
      minuterie.current = setTimeout(enregistrer, DELAI_ENREGISTREMENT);
    },
    [enregistrer],
  );

  const vider = useCallback(() => changer(""), [changer]);

  return { texte, changer, vider };
}
