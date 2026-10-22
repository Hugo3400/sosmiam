import type { OptionSondageApi, SondageApi } from "../../../../../packages/commun/src/types/messagerie.ts";

export type OptionSondageLue = { id: number; ordre: number; lieuChiffre: string };

export type LigneSondage = {
  messageId: number;
  finLe: Date;
  closLe: Date | null;
  gagnant: number | null;
  options: OptionSondageLue[];
  votes: { compteId: number; ordre: number }[];
};

export function presenterSondage(s: LigneSondage, moi: number, lireLieu: (option: OptionSondageLue) => number | null): SondageApi | "illisible" {
  const options: OptionSondageApi[] = [];
  for (const option of [...s.options].sort((a, b) => a.ordre - b.ordre)) {
    const lieuId = lireLieu(option);
    if (lieuId === null) return "illisible";
    options.push({ ordre: option.ordre, lieuId, votes: s.votes.filter((v) => v.ordre === option.ordre).length });
  }
  return {
    finLe: s.finLe.toISOString(),
    closLe: s.closLe ? s.closLe.toISOString() : null,
    gagnant: s.gagnant,
    options,
    monVote: s.votes.find((v) => v.compteId === moi)?.ordre ?? null,
    votants: s.votes.length,
  };
}
