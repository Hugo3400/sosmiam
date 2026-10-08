import { Plus, X } from "lucide-react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import type { CreneauOuverture } from "~/services/lieux.ts";

// 0 = dimanche … 6 = samedi (comme packages/commun), affichés du lundi au dimanche
const JOURS = [1, 2, 3, 4, 5, 6, 0];
const INITIALES = ["D", "L", "M", "M", "J", "V", "S"];
const NOMS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

/** Créneaux d'ouverture : jours cochés et heures. Une fin avant le début passe minuit (« 19:00 → 02:00 »). */
export function EditeurCreneaux({ creneaux, onChange }: { creneaux: CreneauOuverture[]; onChange: (creneaux: CreneauOuverture[]) => void }) {
  const modifier = (i: number, modif: Partial<CreneauOuverture>) => onChange(creneaux.map((c, j) => (j === i ? { ...c, ...modif } : c)));
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1.5 text-sm font-semibold">Créneaux d'ouverture (pour « Ouvert maintenant » dans l'app)</legend>
      {creneaux.map((creneau, i) => (
        <div key={i} className="flex flex-wrap items-center gap-3 rounded-xl border border-ligne p-2">
          <div className="flex gap-1" role="group" aria-label={`Jours du créneau ${i + 1}`}>
            {JOURS.map((jour) => {
              const coche = creneau.jours.includes(jour);
              return (
                <button
                  key={jour}
                  type="button"
                  aria-pressed={coche}
                  aria-label={NOMS[jour]}
                  onClick={() => modifier(i, { jours: coche ? creneau.jours.filter((j) => j !== jour) : [...creneau.jours, jour] })}
                  className={`size-8 rounded-full text-xs font-bold ${coche ? "bg-nuit text-jaune" : "bg-creme text-gris hover:bg-ligne"}`}
                >
                  {INITIALES[jour]}
                </button>
              );
            })}
          </div>
          <label className="flex items-center gap-1.5 text-sm">de <input type="time" value={creneau.de} onChange={(e) => modifier(i, { de: e.target.value })} className="h-8 rounded-lg border border-ligne px-2" /></label>
          <label className="flex items-center gap-1.5 text-sm">à <input type="time" value={creneau.a} onChange={(e) => modifier(i, { a: e.target.value })} className="h-8 rounded-lg border border-ligne px-2" /></label>
          <Bouton petit variante="discret" icone={X} titre="Retirer ce créneau" onClick={() => onChange(creneaux.filter((_, j) => j !== i))} className="ml-auto" />
        </div>
      ))}
      <Bouton petit icone={Plus} onClick={() => onChange([...creneaux, { jours: [2, 3, 4, 5, 6], de: "12:00", a: "14:30" }])} className="justify-self-start">
        Ajouter un créneau
      </Bouton>
    </fieldset>
  );
}
