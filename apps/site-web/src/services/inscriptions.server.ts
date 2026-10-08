// Inscriptions à la newsletter : appel à l'API, côté serveur uniquement (l'API n'écoute qu'en local, 127.0.0.1:5192).
const ADRESSE_API = process.env.ADRESSE_API ?? "http://127.0.0.1:5192";

export type DemandeInscription = {
  email: string;
  ville: string;
  ambassadeur: boolean;
  /** Champ piège du formulaire : rempli seulement par les robots */
  piege: string;
};

export type ResultatInscription = "ok" | "email-invalide" | "trop-de-demandes" | "erreur";

/** Envoie l'inscription à l'API. L'adresse IP du visiteur ne sert qu'à limiter les essais : l'API ne la garde pas. */
export async function inscrireNewsletter(demande: DemandeInscription, ipVisiteur: string | null): Promise<ResultatInscription> {
  try {
    const reponse = await fetch(`${ADRESSE_API}/inscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(ipVisiteur ? { "X-IP-Visiteur": ipVisiteur } : {}) },
      body: JSON.stringify({ ...demande, source: "site" }),
      signal: AbortSignal.timeout(5000),
    });
    if (reponse.ok) return "ok";
    const corps: unknown = await reponse.json().catch(() => null);
    const erreur = typeof corps === "object" && corps !== null && "erreur" in corps ? corps.erreur : null;
    return erreur === "email-invalide" || erreur === "trop-de-demandes" ? erreur : "erreur";
  } catch {
    // API arrêtée ou trop lente : on le dit au visiteur sans détail technique
    return "erreur";
  }
}
