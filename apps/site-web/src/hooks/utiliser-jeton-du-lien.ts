import { useEffect, useState } from "react";

/**
 * Le jeton d'un lien reçu par mail (…/nouveau-mot-de-passe#jeton=…, …/verifier-email#jeton=…), lu après le « # » : il
 * n'est jamais envoyé au serveur dans l'adresse, donc jamais écrit dans un journal. Une fois lu, il quitte la barre
 * d'adresse et l'historique (l'état de navigation de React Router est gardé). null : pas de jeton, ou pas encore lu (le
 * premier affichage, côté serveur et sans JavaScript, n'en a jamais : la page montre alors un champ « Code reçu par mail »).
 */
export function utiliserJetonDuLien(): [string | null, (jeton: string | null) => void] {
  const [jeton, setJeton] = useState<string | null>(null);
  useEffect(() => {
    const trouve = /(?:^#|&)jeton=([^&]+)/.exec(window.location.hash);
    if (!trouve) return;
    try {
      setJeton(decodeURIComponent(trouve[1]));
    } catch {
      return;
    }
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}`);
  }, []);
  return [jeton, setJeton];
}
