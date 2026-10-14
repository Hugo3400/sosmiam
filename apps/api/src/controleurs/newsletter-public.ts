import type { Request, RequestHandler, Response } from "express";

import { resumerErreur } from "../fonctions/comptes/resumer-erreur.ts";
import { lireJetonDesinscription } from "../fonctions/newsletter/lire-jeton-desinscription.ts";
import { masquerEmail } from "../fonctions/texte/masquer-email.ts";

export type DependancesNewsletterPublic = {
  /** Sous-clé des liens (brancherCleDesinscription) ; null : clé des données absente, les routes répondent 503 */
  cle: Uint8Array | null;
  /** Sous-clés tirées des anciennes clés des données (lireClesAnciennesDesinscription) : les liens signés avant un
   * changement de clé restent bons tant que l'ancienne clé est là. Absent ou vide : la clé courante seule */
  clesAnciennes?: Uint8Array[];
  /** L'id de l'inscrit qui a cette adresse, ou null */
  trouverInscrit: (email: string) => Promise<number | null>;
  /** desinscrire() du logiciel de gestion : efface l'inscrit et note son adresse comme désinscrite ; faux si introuvable */
  desinscrire: (id: number) => Promise<boolean>;
  /** Note une adresse qui n'est pas (ou plus) inscrite comme désinscrite, pour qu'un import ne la remette pas. Sans elle,
   * une adresse inconnue reçoit quand même 200, sans rien noter */
  noterDesinscrit?: (email: string) => Promise<void>;
};

/** Le jeton, dans l'adresse (?jeton=) ou dans le corps (JSON ou formulaire), sinon null. */
function lireJeton(requete: Request): unknown {
  const corps: unknown = requete.body;
  const dansCorps = typeof corps === "object" && corps !== null && "jeton" in corps ? corps.jeton : undefined;
  return requete.query.jeton ?? dansCorps ?? null;
}

/** L'adresse du jeton, ou null après avoir répondu (400 jeton-invalide, 503 sans clé). */
function lireAdresse(dependances: DependancesNewsletterPublic, requete: Request, reponse: Response): string | null {
  if (!dependances.cle) {
    reponse.status(503).json({ ok: false, erreur: "indisponible" });
    return null;
  }
  const jeton = lireJeton(requete);
  let email = lireJetonDesinscription(jeton, dependances.cle);
  for (const ancienne of dependances.clesAnciennes ?? []) email ??= lireJetonDesinscription(jeton, ancienne);
  if (!email) reponse.status(400).json({ ok: false, erreur: "jeton-invalide" });
  return email;
}

export function creerControleursNewsletterPublic(dependances: DependancesNewsletterPublic) {
  /** GET : seulement l'adresse masquée, pour la page du site. Ne désinscrit JAMAIS (les antivirus ouvrent les liens seuls). */
  const lireDesinscription: RequestHandler = (requete, reponse) => {
    const email = lireAdresse(dependances, requete, reponse);
    if (email) reponse.json({ ok: true, email: masquerEmail(email) });
  };

  /** POST : désinscription immédiate (bouton du site, ou « un clic » des messageries, RFC 8058). Toujours 200 si le jeton est bon. */
  const desinscrire: RequestHandler = async (requete, reponse) => {
    const email = lireAdresse(dependances, requete, reponse);
    if (!email) return;
    try {
      const id = await dependances.trouverInscrit(email);
      const fait = id !== null && (await dependances.desinscrire(id));
      if (!fait && dependances.noterDesinscrit) await dependances.noterDesinscrit(email);
      reponse.json({ ok: true });
    } catch (erreur) {
      // Jamais l'adresse dans le journal : seulement le nom et le code de l'erreur
      console.error("Désinscription de la newsletter impossible :", resumerErreur(erreur));
      reponse.status(500).json({ ok: false, erreur: "erreur-serveur" });
    }
  };

  return { lireDesinscription, desinscrire };
}
