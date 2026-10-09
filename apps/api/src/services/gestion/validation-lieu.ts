// La validation des visites d'un lieu, réglée dans le logiciel de gestion (décidé par Hugo le 9 octobre 2026 : c'est
// l'équipe SOS Miam qui choisit quels lieux valident) : validation active ou coupée, rayon de vérification de la position,
// et le code public du QR de vitrine (https://sosmiam.fr/l/<code>), créé tout seul et changeable. La logique des visites
// (session App) lit la table validations_lieux.
import { randomInt } from "node:crypto";

import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { creerCodePublic } from "../../fonctions/lieux/creer-code-public.ts";

const CHAMPS = { codePublic: true, validationActive: true, rayonM: true, modifieLe: true } as const;
/** Essais si le code tiré existe déjà (34⁸ codes possibles : presque jamais) */
const ESSAIS_CODE = 5;

/** Écrit avec un code public neuf, et en retire un autre si celui-ci est déjà pris */
async function avecNouveauCode<T>(ecrire: (codePublic: string) => Promise<T>): Promise<T> {
  for (let essai = 1; ; essai++) {
    try {
      return await ecrire(creerCodePublic(randomInt));
    } catch (erreur) {
      if (essai >= ESSAIS_CODE || (erreur as { code?: string }).code !== "P2002") throw erreur;
    }
  }
}

/** La validation du lieu, et ce qui l'empêcherait de marcher (fiche pas publiée, pas de position, pas d'équipe) ; null si pas de lieu */
export async function lireValidationLieu(lieuId: number) {
  const lieu = await baseDeDonnees.lieu.findUnique({
    where: { id: lieuId },
    select: {
      statut: true, latitude: true, longitude: true, validation: { select: CHAMPS },
      _count: { select: { rattachements: { where: { statut: "valide" } } } },
    },
  });
  if (!lieu) return null;
  return {
    validation: lieu.validation,
    publie: lieu.statut === "publie",
    positionConnue: lieu.latitude !== null && lieu.longitude !== null,
    comptesPro: lieu._count.rattachements,
  };
}

/** Active ou coupe la validation, avec le rayon (null : celui par défaut) ; crée le code public la première fois. null si pas de lieu */
export async function reglerValidationLieu(lieuId: number, reglage: { validationActive: boolean; rayonM: number | null }) {
  if (!(await baseDeDonnees.lieu.findUnique({ where: { id: lieuId }, select: { id: true } }))) return null;
  if (await baseDeDonnees.validationLieu.findUnique({ where: { lieuId }, select: { lieuId: true } })) {
    return baseDeDonnees.validationLieu.update({ where: { lieuId }, data: reglage, select: CHAMPS });
  }
  return avecNouveauCode((codePublic) => baseDeDonnees.validationLieu.create({ data: { lieuId, codePublic, ...reglage }, select: CHAMPS }));
}

/** Un nouveau code public : l'ancien QR de vitrine ne mène plus nulle part. null si la validation n'a jamais été réglée */
export async function changerCodePublic(lieuId: number) {
  if (!(await baseDeDonnees.validationLieu.findUnique({ where: { lieuId }, select: { lieuId: true } }))) return null;
  return avecNouveauCode((codePublic) => baseDeDonnees.validationLieu.update({ where: { lieuId }, data: { codePublic }, select: CHAMPS }));
}
