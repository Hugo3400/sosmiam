import { Carte } from "~/composants/interface/Carte.tsx";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { formaterOctets } from "~/fonctions/texte/formater-octets.ts";
import type { EtatServeur } from "~/services/maintenance.ts";

export function OngletBase({ base }: { base: EtatServeur["base"] }) {
  return (
    <Carte titre="Base de données" actions={<span className="chiffres text-[13px] text-gris">{base.enLigne ? `Répond en ${base.delai} ms · ${formaterOctets(base.octets)}` : "Ne répond pas"}</span>}>
      <ul className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm md:grid-cols-3">
        {base.tables.map((t) => (
          <li key={t.table} className="flex justify-between gap-3"><span className="font-mono text-[13px]">{t.table}</span><span className="chiffres text-gris">{formaterNombre(t.lignes)}</span></li>
        ))}
      </ul>
    </Carte>
  );
}
