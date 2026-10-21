import { Lock } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { lireDeverrouillageRetenu, oublierDeverrouillageRetenu } from "~/stockage/deverrouillage-retenu.ts";

const CHOIX = [
  { valeur: "20", libelle: "20 min" },
  { valeur: "60", libelle: "1 h" },
  { valeur: "240", libelle: "4 h" },
  { valeur: "jamais", libelle: "Jamais" },
] as const;

/** Verrouillage automatique : au bout de combien de temps sans activité le logiciel redemande le mot de passe. */
export function CarteVerrouillage({ minutes, onChange }: { minutes: number | null; onChange: (minutes: number | null) => void }) {
  const [retenu, setRetenu] = useState(() => lireDeverrouillageRetenu());
  return (
    <Carte titre={<span className="flex items-center gap-2"><Lock className="size-4" aria-hidden /> Verrouillage automatique</span>}>
      <p className="mb-4 text-sm">
        Sans souris ni clavier pendant ce temps, le logiciel oublie la clé de ce PC et redemande ton <strong>mot de passe</strong>.
        Le code à 6 chiffres, lui, n'est redemandé que tous les 30 jours.
      </p>
      {retenu && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-jaune-clair px-3 py-2 text-sm">
          <span>Mot de passe retenu sur ce PC jusqu'au <strong>{formaterDate(new Date(retenu.expireLe).toISOString(), true)}</strong> : pas de verrouillage automatique d'ici là.</span>
          <Bouton petit onClick={() => (oublierDeverrouillageRetenu(), setRetenu(null))}>L'oublier maintenant</Bouton>
        </div>
      )}
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
