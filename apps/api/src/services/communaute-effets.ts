import { construireEffetsCommunaute, type EvenementCommunaute } from "../fonctions/communaute/construire-effets-communaute.ts";
import type { EvenementPushCommunaute } from "../fonctions/communaute/ecrire-push-communaute.ts";
import type { EffetSocial } from "./effets-sociaux-regles.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";

export type AnnonceCommunaute = Omit<EvenementCommunaute, "push"> & { push?: (prenomActeur: string) => EvenementPushCommunaute };

export async function annoncer(relations: Pick<RelationsSociales, "lirePushSocial" | "presenter">, a: AnnonceCommunaute): Promise<EffetSocial[]> {
  const destinataires = [...new Set(a.destinataires)].filter((id) => id !== a.acteurId);
  if (destinataires.length === 0) return [];
  const [autorises, personnes] = await Promise.all([
    a.push ? relations.lirePushSocial(destinataires) : Promise.resolve(new Set<number>()),
    a.acteurId !== null ? relations.presenter([a.acteurId]) : Promise.resolve(new Map()),
  ]);
  const prenom = a.acteurId !== null ? (personnes.get(a.acteurId)?.prenom ?? "Un Miami") : "";
  return construireEffetsCommunaute({ ...a, destinataires, push: a.push ? { evenement: a.push(prenom), autorises } : undefined });
}

export async function annoncerTout(relations: Pick<RelationsSociales, "lirePushSocial" | "presenter">, annonces: readonly AnnonceCommunaute[]): Promise<EffetSocial[]> {
  return (await Promise.all(annonces.map((a) => annoncer(relations, a)))).flat();
}
