import { CIBLES_SIGNALEMENT_SECURITE } from "../../../../../packages/commun/src/regles/securite.ts";
import type { CibleSignalementSecurite, NouveauSignalementSecurite } from "../../../../../packages/commun/src/types/securite.ts";
import { champsSignalement, type ChampSignalement } from "~/contenus/formulaire-securite";
import { convertirImagesEnBase64 } from "~/fonctions/securite/convertir-images-en-base64";
import { ecrireMessageService } from "~/fonctions/texte/ecrire-message-service";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { verifierEmail } from "~/fonctions/texte/verifier-email";

export type ValeursSignalement = {
  nom: string;
  email: string;
  cible: string;
  titre: string;
  description: string;
  lien: string;
  tableauHonneur: boolean;
  nomTableauHonneur: string;
  majeur: boolean;
  reglesAcceptees: boolean;
};

export type LectureSignalement =
  | { ok: true; signalement: NouveauSignalementSecurite; piege: string }
  | { ok: false; erreurs: Partial<Record<ChampSignalement, string>>; valeurs: ValeursSignalement; imagesEnvoyees: boolean };

const { nom, email, cible, titre, description, lien, nomTableauHonneur, majeur, reglesAcceptees } = champsSignalement;

function estCible(valeur: string): valeur is CibleSignalementSecurite {
  return CIBLES_SIGNALEMENT_SECURITE.some((une) => une === valeur);
}

function horsLimites(texte: string, limites: { min: number; max: number }): boolean {
  return texte.length < limites.min || texte.length > limites.max;
}

export async function lireFormulaireSignalement(formulaire: FormData): Promise<LectureSignalement> {
  const lire = (cle: string) => {
    const valeur = formulaire.get(cle);
    return typeof valeur === "string" ? valeur.replace(/\r\n?/g, "\n").trim() : "";
  };
  const valeurs: ValeursSignalement = {
    nom: lire("nom").replace(/\s+/g, " "),
    email: lire("email"),
    cible: lire("cible"),
    titre: lire("titre").replace(/\s+/g, " "),
    description: lire("description"),
    lien: lire("lien"),
    tableauHonneur: formulaire.get("tableauHonneur") === "oui",
    nomTableauHonneur: lire("nomTableauHonneur").replace(/\s+/g, " "),
    majeur: formulaire.get("majeur") === "oui",
    reglesAcceptees: formulaire.get("reglesAcceptees") === "oui",
  };
  if (valeurs.lien && !/^[a-z][a-z0-9+.-]*:/i.test(valeurs.lien)) valeurs.lien = `https://${valeurs.lien}`;

  const erreurs: Partial<Record<ChampSignalement, string>> = {};
  if (horsLimites(valeurs.nom, nom)) erreurs.nom = nom.erreur;
  if (valeurs.email.length > email.max || !verifierEmail(valeurs.email)) erreurs.email = email.erreur;
  const cibleChoisie = estCible(valeurs.cible) ? valeurs.cible : null;
  if (!cibleChoisie) erreurs.cible = cible.erreur;
  if (horsLimites(valeurs.titre, titre)) erreurs.titre = titre.erreur;
  if (horsLimites(valeurs.description, description)) erreurs.description = description.erreur;
  if (valeurs.lien && (valeurs.lien.length > lien.max || !/^https:\/\/[^\s/?#]+\.[^\s]+$/i.test(valeurs.lien))) erreurs.lien = lien.erreur;
  if (valeurs.tableauHonneur && horsLimites(valeurs.nomTableauHonneur, nomTableauHonneur)) erreurs.nomTableauHonneur = nomTableauHonneur.erreur;
  if (!valeurs.majeur) erreurs.majeur = majeur.erreur;
  if (!valeurs.reglesAcceptees) erreurs.reglesAcceptees = reglesAcceptees.erreur;

  const fichiers = formulaire.getAll("images").filter((fichier): fichier is File => fichier instanceof File && (fichier.size > 0 || fichier.name !== ""));
  let images: NouveauSignalementSecurite["images"] = [];
  if (fichiers.length > 0) {
    const converties = await convertirImagesEnBase64(fichiers);
    if (converties.ok) images = converties.images;
    else erreurs.images = ecrireMessageService(converties.erreur);
  }

  for (const cle of Object.keys(erreurs) as ChampSignalement[]) erreurs[cle] = lierPonctuation(erreurs[cle] ?? "");
  if (Object.keys(erreurs).length > 0 || !cibleChoisie) return { ok: false, erreurs, valeurs, imagesEnvoyees: fichiers.length > 0 };

  const piege = formulaire.get("site_web");
  return {
    ok: true,
    signalement: {
      nom: valeurs.nom,
      email: valeurs.email,
      cible: cibleChoisie,
      titre: valeurs.titre,
      description: valeurs.description,
      lien: valeurs.lien || null,
      majeur: true,
      reglesAcceptees: true,
      nomTableauHonneur: valeurs.tableauHonneur ? valeurs.nomTableauHonneur : null,
      images,
    },
    piege: typeof piege === "string" ? piege : "",
  };
}
