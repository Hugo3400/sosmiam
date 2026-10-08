import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";

/** La jauge d'un BIG SOS : où en est l'objectif de mobilisation (rien s'il n'y en a pas encore). */
export function JaugeObjectif({ titre, cible, atteint }: { titre: string | null; cible: number | null; atteint: number }) {
  if (!titre || !cible) return <p className="text-[13px] text-gris">Pas encore d'objectif.</p>;
  const part = Math.min(100, Math.round((atteint / cible) * 100));
  return (
    <div className="grid gap-1">
      <div className="flex justify-between gap-3 text-[13px]">
        <span className="font-semibold">{titre}</span>
        <span className="chiffres text-gris">{formaterNombre(atteint)} / {formaterNombre(cible)} ({part} %)</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-ligne" role="progressbar" aria-valuenow={part} aria-valuemin={0} aria-valuemax={100} aria-label={titre}>
        <div className="h-full rounded-full bg-tomate" style={{ width: `${part}%` }} />
      </div>
    </div>
  );
}
