import type { NouvelleCandidature } from "../../../../../packages/commun/src/types/carriere.ts";
import { champsCandidature, type ChampCandidature } from "~/contenus/carriere";
import { convertirCvEnBase64 } from "~/fonctions/carriere/convertir-cv-en-base64";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { verifierEmail } from "~/fonctions/texte/verifier-email";

export type ValeursCandidature = { nom: string; email: string; message: string; lien: string; majeur: boolean };

export type LectureCandidature =
  | { ok: true; candidature: NouvelleCandidature; piege: string }
  | { ok: false; erreurs: Partial<Record<ChampCandidature, string>>; valeurs: ValeursCandidature; cvEnvoye: boolean };

const { nom, email, message, lien, cv, majeur } = champsCandidature;

export async function lireFormulaireCandidature(formulaire: FormData): Promise<LectureCandidature> {
  const lire = (cle: string) => {
    const valeur = formulaire.get(cle);
    return typeof valeur === "string" ? valeur.replace(/\r\n?/g, "\n").trim() : "";
  };
  const valeurs: ValeursCandidature = {
    nom: lire("nom").replace(/\s+/g, " "),
    email: lire("email"),
    message: lire("message").replace(/[ \t]+/g, " "),
    lien: lire("lien"),
    majeur: formulaire.get("majeur") === "oui",
  };
  if (valeurs.lien && !/^[a-z][a-z0-9+.-]*:/i.test(valeurs.lien)) valeurs.lien = `https://${valeurs.lien}`;

  const erreurs: Partial<Record<ChampCandidature, string>> = {};
  if (valeurs.nom.length < nom.minimum || valeurs.nom.length > nom.maximum) erreurs.nom = nom.erreur;
  if (valeurs.email.length > email.maximum || !verifierEmail(valeurs.email)) erreurs.email = email.erreur;
  if (valeurs.message.length < message.minimum || valeurs.message.length > message.maximum) erreurs.message = message.erreur;
  if (valeurs.lien && (valeurs.lien.length > lien.maximum || !/^https:\/\/[^\s/?#]+\.[^\s]+$/i.test(valeurs.lien))) erreurs.lien = lien.erreur;
  if (!valeurs.majeur) erreurs.majeur = majeur.erreur;

  const fichier = formulaire.get("cv");
  const cvEnvoye = fichier instanceof File && (fichier.size > 0 || fichier.name !== "");
  let cvLu: NouvelleCandidature["cv"] = null;
  if (cvEnvoye) {
    const converti = await convertirCvEnBase64(fichier);
    if (converti.ok) cvLu = converti.cv;
    else erreurs.cv = converti.erreur === "cv-trop-lourd" ? cv.erreurPoids : cv.erreurFormat;
  }

  for (const cle of Object.keys(erreurs) as ChampCandidature[]) erreurs[cle] = lierPonctuation(erreurs[cle] ?? "");
  if (Object.keys(erreurs).length > 0) return { ok: false, erreurs, valeurs, cvEnvoye };

  const piege = formulaire.get("site_web");
  return {
    ok: true,
    candidature: { nom: valeurs.nom, email: valeurs.email, message: valeurs.message, lien: valeurs.lien || null, majeur: true, cv: cvLu },
    piege: typeof piege === "string" ? piege : "",
  };
}
