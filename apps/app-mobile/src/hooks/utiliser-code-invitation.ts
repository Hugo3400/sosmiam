import { useEffect, useState } from "react";

import { lireCodeInvitation } from "~/stockage/code-invitation";

// Lu une fois par ouverture de l'app, puis gardé ici : tous les écrans montrent le même lien
let enMemoire: string | null = null;

/** Ton code secret d'invitation (stockage/code-invitation.ts) ; null le temps de le lire sur le téléphone. */
export function utiliserCodeInvitation(): string | null {
  const [code, setCode] = useState<string | null>(enMemoire);

  useEffect(() => {
    if (enMemoire) return;
    let actif = true;
    lireCodeInvitation().then((lu) => {
      enMemoire = lu;
      if (actif) setCode(lu);
    });
    return () => {
      actif = false;
    };
  }, []);

  return code;
}
