import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";

const MEDAILLES = ["🥇", "🥈", "🥉"];

export type LigneClassement = { id: number; prenom: string; ville: string; points: number; extra?: string };

/** Un classement : médailles pour les 3 premiers, prénom (ouvre sa fiche), ville et points. */
export function RangsAmbassadeurs({ lignes, onOuvrirCompte, vide }: { lignes: LigneClassement[]; onOuvrirCompte: (id: number) => void; vide: string }) {
  if (lignes.length === 0) return <p className="text-sm text-gris">{vide}</p>;
  return (
    <ol className="grid gap-1 text-sm">
      {lignes.map((ligne, rang) => (
        <li key={ligne.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 odd:bg-creme/60">
          <span className="chiffres w-7 text-center font-bold">{MEDAILLES[rang] ?? rang + 1}</span>
          <button type="button" className="min-w-0 flex-1 truncate text-left font-semibold hover:underline" onClick={() => onOuvrirCompte(ligne.id)}>
            {ligne.prenom} <span className="font-normal text-gris">· {ligne.ville}{ligne.extra ? ` · ${ligne.extra}` : ""}</span>
          </button>
          <span className="chiffres font-bold">{formaterNombre(ligne.points)} pts</span>
        </li>
      ))}
    </ol>
  );
}
