import { useState } from "react";

import { Carte } from "~/composants/interface/Carte.tsx";
import { construireGrilleCreneaux } from "~/fonctions/statistiques/construire-grille-creneaux.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
/** Une seule teinte, du plus clair au plus foncé (le rouge des graphiques au milieu) ; zéro reste couleur de fond */
const NUANCES = ["#FDE8E4", "#F9C4B9", "#F2907F", "#E0432F", "#A3291B"];
const nuance = (valeur: number, maximum: number) =>
  valeur === 0 || maximum === 0 ? "#F4EFE4" : NUANCES[Math.min(NUANCES.length - 1, Math.floor((valeur / maximum) * NUANCES.length - 1e-9))]!;

/** Carte de chaleur jours × heures (heure de Paris) : quand les visites commencent. */
export function CarteJoursHeures({ creneaux }: { creneaux: { valeur: string; nombre: number }[] }) {
  const { grille, maximum } = construireGrilleCreneaux(creneaux);
  const [survol, setSurvol] = useState<{ jour: number; heure: number } | null>(null);
  const meilleur = grille.flatMap((ligne, jour) => ligne.map((nombre, heure) => ({ jour, heure, nombre }))).sort((a, b) => b.nombre - a.nombre)[0];

  return (
    <Carte titre="Jours et heures des visites">
      <p className="-mt-1 mb-3 text-[13px] text-gris">
        Début des visites, à l'heure de Paris.
        {meilleur && meilleur.nombre > 0 && <> Le créneau le plus fréquenté : <strong className="text-encre">{JOURS[meilleur.jour]?.toLowerCase()} vers {meilleur.heure} h</strong>.</>}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-[2px] text-[11px]" onPointerLeave={() => setSurvol(null)}>
          <caption className="sr-only">Visites par jour de la semaine et par heure</caption>
          <thead>
            <tr>
              <th scope="col" className="w-20" />
              {Array.from({ length: 24 }, (_, heure) => (
                <th key={heure} scope="col" className="font-normal text-gris">{heure % 3 === 0 ? `${heure} h` : <span className="sr-only">{heure} h</span>}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grille.map((ligne, jour) => (
              <tr key={JOURS[jour]}>
                <th scope="row" className="pr-2 text-left font-semibold">{JOURS[jour]?.slice(0, 3)}.</th>
                {ligne.map((nombre, heure) => (
                  <td
                    key={heure}
                    tabIndex={0}
                    onPointerEnter={() => setSurvol({ jour, heure })}
                    onFocus={() => setSurvol({ jour, heure })}
                    aria-label={`${JOURS[jour]} ${heure} h : ${nombre} visite(s)`}
                    className={`h-6 min-w-4 rounded-[4px] outline-none ${survol?.jour === jour && survol.heure === heure ? "ring-2 ring-encre" : ""}`}
                    style={{ background: nuance(nombre, maximum) }}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[13px] text-gris">
        <p className="chiffres min-h-5">
          {survol ? <><strong className="text-encre">{JOURS[survol.jour]} {survol.heure} h–{survol.heure + 1} h</strong> : {formaterNombre(grille[survol.jour]?.[survol.heure] ?? 0)} visite(s)</> : "Survole une case pour le détail."}
        </p>
        <p className="flex items-center gap-1.5" aria-hidden>
          Moins {NUANCES.map((couleur) => <span key={couleur} className="size-3 rounded-sm" style={{ background: couleur }} />)} Plus
        </p>
      </div>
    </Carte>
  );
}
