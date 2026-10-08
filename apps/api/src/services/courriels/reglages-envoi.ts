// Réglages de l'envoi des mails : la boîte bonjour@sosmiam.fr chez l'hébergement mail (SMTP), dans le même fichier que
// sa lecture en IMAP (scripts/recuperer-inscrits.py). Ce fichier est créé par Hugo lui-même : le mot de passe (un mot de
// passe d'application de la boîte) ne passe jamais par le logiciel, ni par une session Claude.
import { readFile, stat } from "node:fs/promises";

import { lireFichierReglages } from "../../fonctions/texte/lire-fichier-reglages.ts";

export const FICHIER_BOITE_MAIL = process.env.FICHIER_BOITE_MAIL || "/root/sos-miam-secrets/boite-bonjour.env";
/** Limite par défaut : prudente pour une boîte d'hébergement (réglable avec ENVOI_PAR_HEURE dans le fichier) */
const PAR_HEURE_DEFAUT = 100;

export type ReglagesEnvoi = {
  serveur: string;
  port: number;
  utilisateur: string;
  motDePasse: string;
  /** Nom affiché de l'expéditeur ; l'adresse est toujours celle de la boîte (l'hébergement l'exige) */
  nomExpediteur: string;
  parHeure: number;
};
export type EtatReglagesEnvoi =
  | { etat: "pret"; reglages: ReglagesEnvoi }
  | { etat: "absent" | "mal-protege" | "incomplet"; reglages: null };

export async function lireReglagesEnvoi(): Promise<EtatReglagesEnvoi> {
  let texte: string;
  try {
    // Lisible par d'autres comptes que root : on refuse, comme le script de la boîte
    if ((await stat(FICHIER_BOITE_MAIL)).mode & 0o077) return { etat: "mal-protege", reglages: null };
    texte = await readFile(FICHIER_BOITE_MAIL, "utf8");
  } catch {
    return { etat: "absent", reglages: null };
  }
  const r = lireFichierReglages(texte);
  const serveur = (r.SMTP_SERVEUR || r.IMAP_SERVEUR || "").trim();
  const utilisateur = (r.SMTP_UTILISATEUR || r.IMAP_UTILISATEUR || "").trim();
  const motDePasse = r.SMTP_MOT_DE_PASSE || r.IMAP_MOT_DE_PASSE || "";
  if (!serveur || !utilisateur.includes("@") || !motDePasse) return { etat: "incomplet", reglages: null };
  const port = Number.parseInt(r.SMTP_PORT || "465", 10);
  const parHeure = Number.parseInt(r.ENVOI_PAR_HEURE || "", 10);
  return {
    etat: "pret",
    reglages: {
      serveur,
      port: Number.isInteger(port) && port > 0 ? port : 465,
      utilisateur,
      motDePasse,
      nomExpediteur: (r.EXPEDITEUR_NOM || "SOS Miam").trim(),
      parHeure: Number.isInteger(parHeure) && parHeure > 0 ? Math.min(parHeure, 2000) : PAR_HEURE_DEFAUT,
    },
  };
}
