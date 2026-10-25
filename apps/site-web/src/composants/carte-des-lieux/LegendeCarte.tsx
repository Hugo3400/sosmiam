import { COULEURS_EPINGLES } from "~/composants/carte-des-lieux/reglages-carte-des-lieux";
import { TEXTES_CARTE_DES_LIEUX } from "~/contenus/carte-des-lieux";

const ORDRE = ["resto", "patisserie", "bar", "sortie", "sos"] as const;

export function LegendeCarte({ className = "" }: { className?: string }) {
  const T = TEXTES_CARTE_DES_LIEUX.legende;
  return (
    <ul aria-label={T.etiquette} className={`flex flex-wrap gap-x-3 gap-y-1 rounded-xl border-2 border-encre bg-white px-3 py-2 text-[13px] font-semibold ${className}`}>
      {ORDRE.map((cle) => (
        <li key={cle} className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block size-3 rounded-full border-[1.5px] border-encre" style={{ background: COULEURS_EPINGLES[cle] }} />
          {T[cle]}
        </li>
      ))}
    </ul>
  );
}
