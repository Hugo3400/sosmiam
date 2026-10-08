import { useEffect, useState } from "react";

import { lireCodeInvitation } from "~/stockage/code-invitation";

// Lu une seule fois par ouverture de l'app (une seule lecture même si deux écrans le demandent en même temps) : partout le même lien
let lecture: Promise<string> | null = null;
let enMemoire: string | null = null;

/** Ton code secret d'invitation (stockage/code-invitation.ts) ; null le temps de le lire sur le téléphone. */
export function utiliserCodeInvitation(): string | null {
  const [code, setCode] = useState<string | null>(enMemoire);

  useEffect(() => {
    if (enMemoire) return;
    let actif = true;
    lecture ??= lireCodeInvitation().then((lu) => (enMemoire = lu));
    lecture.then((lu) => {
      if (actif) setCode(lu);
    });
    return () => {
      actif = false;
    };
  }, []);

  return code;
}
