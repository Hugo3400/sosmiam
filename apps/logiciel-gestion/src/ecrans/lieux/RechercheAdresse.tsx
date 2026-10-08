import { MapPin } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { chercherAdresse, type ResultatAdresse } from "~/services/lieux.ts";

/** « Trouver les coordonnées » : cherche l'adresse saisie (service public de l'IGN) et propose les résultats. */
export function RechercheAdresse({ adresse, ville, onChoisir }: { adresse: string; ville: string; onChoisir: (resultat: ResultatAdresse) => void }) {
  const [resultats, setResultats] = useState<ResultatAdresse[] | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function chercher() {
    setEnCours(true);
    try {
      setResultats(await chercherAdresse(`${adresse} ${ville}`.trim()));
    } catch {
      setResultats([]);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="grid gap-2 md:col-span-2">
      <Bouton petit icone={MapPin} chargement={enCours} desactive={`${adresse}${ville}`.trim().length < 3} onClick={chercher} className="justify-self-start">
        Trouver les coordonnées
      </Bouton>
      {resultats && resultats.length === 0 && <p className="text-sm text-gris">Rien trouvé : vérifie l'adresse et la ville.</p>}
      {resultats && resultats.length > 0 && (
        <ul className="grid gap-1 rounded-xl border border-ligne p-1">
          {resultats.map((resultat) => (
            <li key={`${resultat.latitude},${resultat.longitude}`}>
              <button
                type="button"
                onClick={() => {
                  onChoisir(resultat);
                  setResultats(null);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-creme"
              >
                <span>{resultat.libelle}</span>
                <span className="chiffres text-xs text-gris">{resultat.latitude.toFixed(5)}, {resultat.longitude.toFixed(5)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
