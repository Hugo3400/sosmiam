import { useEffect, useState } from "react";

import { lireApercuLieu } from "~/fonctions/page-lieux/lire-apercu-lieu";
import type { ApercuLieu } from "~/types/lieux";

export function utiliserApercuLieu(id: number | null): ApercuLieu | null {
  const [apercu, setApercu] = useState<ApercuLieu | null>(null);

  useEffect(() => {
    setApercu(null);
    if (id === null) return;
    const controle = new AbortController();
    fetch(`/lieux/apercu/${id}`, { signal: controle.signal })
      .then((reponse) => (reponse.ok ? reponse.json() : null))
      .then((corps: unknown) => {
        const lieu = typeof corps === "object" && corps !== null ? (corps as { lieu?: unknown }).lieu : null;
        setApercu(lireApercuLieu(lieu));
      })
      .catch(() => {});
    return () => controle.abort();
  }, [id]);

  return apercu;
}
