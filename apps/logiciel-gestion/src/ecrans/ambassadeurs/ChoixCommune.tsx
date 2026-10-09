import { useEffect, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { chercherCommunes, choisirCommuneCandidature, type CommuneAvecZone, type ZoneCourte } from "~/services/fondateurs.ts";

type Props = { candidatureId: number; onChoisie: (commune: string, zone: ZoneCourte) => void; onAnnuler: () => void };

const decrireZone = (zone: ZoneCourte) =>
  `${zone.nom} (${zone.type === "ville" ? "ville" : "département"}, ${zone.places} place${zone.places > 1 ? "s" : ""})`;

/**
 * Choisir la commune d'une candidature, par son nom ou son code postal : sa zone de fondateurs s'en déduit (la ville
 * dès 50 000 habitants, sinon son département ; un arrondissement compte pour sa ville).
 */
export function ChoixCommune({ candidatureId, onChoisie, onAnnuler }: Props) {
  const [texte, setTexte] = useState("");
  const [communes, setCommunes] = useState<CommuneAvecZone[] | null>(null);
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });

  useEffect(() => {
    if (texte.trim().length < 2) {
      setCommunes(null);
      return;
    }
    let annule = false;
    const minuteur = window.setTimeout(() => {
      chercherCommunes(texte.trim())
        .then((trouvees) => !annule && setCommunes(trouvees))
        .catch((probleme) => !annule && setEtat({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) }));
    }, 250);
    return () => {
      annule = true;
      window.clearTimeout(minuteur);
    };
  }, [texte]);

  async function choisir(commune: CommuneAvecZone) {
    setEtat({ enCours: true, erreur: null });
    try {
      const resultat = await choisirCommuneCandidature(candidatureId, commune.code);
      setEtat({ enCours: false, erreur: null });
      onChoisie(resultat.commune, resultat.zone);
    } catch (probleme) {
      setEtat({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }

  return (
    <div className="grid gap-2 rounded-xl border border-ligne bg-creme p-3">
      <Champ
        libelle="Où vit la personne ?"
        valeur={texte}
        onChange={setTexte}
        placeholder="Nom ou code postal : Lyon, 34000…"
        aide="Sa ville si elle a 50 000 habitants ou plus, sinon son département."
        autoFocus
      />
      {communes && communes.length === 0 && <p className="text-sm text-gris">Aucune commune ne correspond.</p>}
      {communes && communes.length > 0 && (
        <ul className="grid gap-0.5" aria-label="Communes trouvées">
          {communes.map((commune) => (
            <li key={commune.code}>
              <button
                type="button"
                disabled={etat.enCours || !commune.zone}
                onClick={() => choisir(commune)}
                className="flex w-full flex-wrap items-baseline gap-x-2 rounded-lg px-2 py-1.5 text-left hover:bg-jaune-clair disabled:opacity-50"
              >
                <span className="font-semibold">{commune.nom}</span>
                <span className="text-[13px] text-gris">
                  {commune.nomDepartement} ({commune.codeDepartement}) · {formaterNombre(commune.population)} hab.{commune.codePostal ? ` · ${commune.codePostal}` : ""}
                </span>
                <span className="ml-auto text-[13px] font-semibold">→ {commune.zone ? decrireZone(commune.zone) : "zone introuvable"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {etat.erreur && <p role="alert" className="text-sm font-semibold text-rouge-texte">{etat.erreur}</p>}
      <div><Bouton variante="discret" onClick={onAnnuler}>Annuler</Bouton></div>
    </div>
  );
}
