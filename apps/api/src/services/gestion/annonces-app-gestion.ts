import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";

export type SaisieAnnonceApp = {
  titre: string;
  texte: string;
  emoji: string | null;
  boutonLibelle: string | null;
  boutonLien: string | null;
  cible: string;
  ville: string | null;
  debut: Date;
  fin: Date | null;
};

export const listerAnnoncesAppGestion = () => baseDeDonnees.annonceApp.findMany({ orderBy: [{ creeLe: "desc" }, { id: "desc" }], take: 200 });

export const creerAnnonceApp = (saisie: SaisieAnnonceApp) => baseDeDonnees.annonceApp.create({ data: saisie });

export async function modifierAnnonceApp(id: number, saisie: SaisieAnnonceApp) {
  const { count } = await baseDeDonnees.annonceApp.updateMany({ where: { id }, data: saisie });
  return count > 0;
}

export async function publierAnnonceApp(id: number, publiee: boolean, maintenant = new Date()) {
  const { count } = await baseDeDonnees.annonceApp.updateMany({
    where: { id },
    data: publiee ? { publieeLe: maintenant, retireeLe: null } : { retireeLe: maintenant },
  });
  return count > 0;
}

export async function supprimerAnnonceApp(id: number): Promise<"ok" | "introuvable" | "deja-publiee"> {
  const annonce = await baseDeDonnees.annonceApp.findUnique({ where: { id }, select: { publieeLe: true } });
  if (!annonce) return "introuvable";
  if (annonce.publieeLe) return "deja-publiee";
  await baseDeDonnees.annonceApp.delete({ where: { id } });
  return "ok";
}
