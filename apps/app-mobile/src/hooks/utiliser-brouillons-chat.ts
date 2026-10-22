import { useEffect, useSyncExternalStore } from "react";

import type { BrouillonsChat } from "~/contenus/type-brouillon-chat";
import { chargerBrouillonsChat, ecouterBrouillonsChat, lireBrouillonsChatEnMemoire } from "~/stockage/brouillons-chat";

export function utiliserBrouillonsChat(): BrouillonsChat {
  const brouillons = useSyncExternalStore(ecouterBrouillonsChat, lireBrouillonsChatEnMemoire, lireBrouillonsChatEnMemoire);
  useEffect(() => {
    void chargerBrouillonsChat();
  }, []);
  return brouillons;
}
