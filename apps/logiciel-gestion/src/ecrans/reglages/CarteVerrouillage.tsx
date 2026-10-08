import { Lock } from "lucide-react";

import { Carte } from "~/composants/interface/Carte.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";

const CHOIX = [
  { valeur: "20", libelle: "20 min" },
  { valeur: "60", libelle: "1 h" },
  { valeur: "240", libelle: "4 h" },
  { valeur: "jamais", libelle: "Jamais" },
] as const;

/** Verrouillage automatique : au bout de combien de temps sans activité le logiciel redemande le mot de passe. */
export function CarteVerrouillage({ minutes, onChange }: { minutes: number | null; onChange: (minutes: number | null) => void }) {
  return (
    <Carte titre={<span className="flex items-center gap-2"><Lock className="size-4" aria-hidden /> Verrouillage automatique</span>}>
      <p className="mb-4 text-sm">
        Sans souris ni clavier pendant ce temps, le logiciel oublie la clé de ce PC et redemande ton <strong>mot de passe</strong>.
        Le code à 6 chiffres, lui, n'est redemandé qu'une fois par semaine (ou après 24 h sans te servir du logiciel).
      </p>
      <Onglets
        libelle="Verrouiller après"
        valeur={minutes === null ? "jamais" : String(minutes)}
        onChange={(valeur) => onChange(valeur === "jamais" ? null : Number(valeur))}
        options={[...CHOIX]}
      />
      {minutes === null && (
        <p className="mt-3 text-sm text-gris">Le logiciel reste ouvert tant que Windows l'est : verrouille ta session Windows (⊞ + L) quand tu t'éloignes.</p>
      )}
    </Carte>
  );
}
