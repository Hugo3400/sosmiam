// Désinscription de la newsletter par le lien signé des mails (page /desinscription) : appels à l'API, côté serveur
// uniquement (GET /newsletter/desinscription : l'adresse masquée ; POST : la désinscription).
// Aucun import « ~/… » ici : le test (tests/desinscription.test.ts) lance ce fichier directement avec Node.

/** Ce que la page sait d'un lien : son adresse masquée (« c***@gmail.com »), ou pourquoi elle ne peut pas la montrer */
export type LectureDesinscription =
  | { ok: true; email: string }
  | { ok: false; erreur: "jeton-invalide" | "trop-de-demandes" | "indisponible" };

export type ResultatDesinscription = "ok" | "jeton-invalide" | "trop-de-demandes" | "indisponible";

/** Forme d'un jeton (vérifié pour de vrai par l'API) : pas la peine de l'appeler pour n'importe quoi */
function aFormeDeJeton(jeton: string | null): jeton is string {
  return typeof jeton === "string" && jeton.length <= 400 && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(jeton);
}

function adresseApi(jeton: string): string {
  return `${process.env.ADRESSE_API ?? "http://127.0.0.1:5192"}/newsletter/desinscription?jeton=${encodeURIComponent(jeton)}`;
}

function lireErreur(statut: number): "jeton-invalide" | "trop-de-demandes" | "indisponible" {
  return statut === 400 ? "jeton-invalide" : statut === 429 ? "trop-de-demandes" : "indisponible";
}

/** L'adresse masquée du lien (rien n'est changé). L'IP du visiteur ne sert qu'à la limite de l'API. */
export async function lireDesinscription(jeton: string | null, ipVisiteur: string | null): Promise<LectureDesinscription> {
  if (!aFormeDeJeton(jeton)) return { ok: false, erreur: "jeton-invalide" };
  try {
    const reponse = await fetch(adresseApi(jeton), {
      headers: ipVisiteur ? { "X-IP-Visiteur": ipVisiteur } : {},
      signal: AbortSignal.timeout(5000),
    });
    if (!reponse.ok) return { ok: false, erreur: lireErreur(reponse.status) };
    const corps: unknown = await reponse.json();
    const email = typeof corps === "object" && corps !== null && "email" in corps ? corps.email : null;
    return typeof email === "string" ? { ok: true, email } : { ok: false, erreur: "indisponible" };
  } catch {
    return { ok: false, erreur: "indisponible" };
  }
}

/** Désinscrit l'adresse du lien, tout de suite (« ok » aussi si elle ne l'était déjà plus). */
export async function desinscrireNewsletter(jeton: string | null, ipVisiteur: string | null): Promise<ResultatDesinscription> {
  if (!aFormeDeJeton(jeton)) return "jeton-invalide";
  try {
    const reponse = await fetch(adresseApi(jeton), {
      method: "POST",
      headers: ipVisiteur ? { "X-IP-Visiteur": ipVisiteur } : {},
      signal: AbortSignal.timeout(5000),
    });
    return reponse.ok ? "ok" : lireErreur(reponse.status);
  } catch {
    return "indisponible";
  }
}
