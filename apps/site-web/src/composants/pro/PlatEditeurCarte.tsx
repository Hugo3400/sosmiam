import { ETIQUETTES_CARTE, LIMITES_CARTE } from "../../../../../packages/commun/src/regles/carte-du-lieu.ts";
import { CaseACocher } from "~/composants/compte/CaseACocher";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { ChoixMultiples } from "~/composants/compte/ChoixMultiples";
import { BoutonGesteCarte } from "~/composants/pro/BoutonGesteCarte";
import { ETIQUETTES } from "~/contenus/carte-du-lieu";
import { nommerChampCarte } from "~/fonctions/carte/nommer-champ-carte";
import type { BrouillonElement } from "~/types/carte";

type Props = {
  element: BrouillonElement;
  /** Place de la section et du plat (à partir de 0) */
  section: number;
  position: number;
  nombre: number;
  /** Le bouton qui reprend le focus (BoutonGesteCarte) */
  focus: string | null;
};

const OPTIONS_ETIQUETTES = ETIQUETTES_CARTE.map((valeur) => ({ valeur, libelle: `${ETIQUETTES[valeur].emoji} ${ETIQUETTES[valeur].libelle}` }));

/**
 * Un plat dans l'éditeur de carte : nom, prix (en euros, virgule acceptée), unité, description, « Spécialité de la
 * maison », « Contient de l'alcool » et les repères ; puis Monter, Descendre et Supprimer (boutons d'envoi).
 */
export function PlatEditeurCarte({ element, section, position, nombre, focus }: Props) {
  const nom = (champ: string) => nommerChampCarte(section, champ, position);
  const precision = `le plat ${position + 1}${element.nom.trim() ? `, ${element.nom.trim()}` : ""}`;
  return (
    <li>
      <fieldset className="min-w-0 rounded-2xl border-2 border-encre/20 bg-creme/40 p-4 md:p-5">
        <legend className="px-1 text-sm font-bold text-gris">{`Plat ${position + 1}`}</legend>
        <div className="grid gap-4">
          <ChampTexte nom={nom("nom")} libelle="Nom" maximum={LIMITES_CARTE.nom} exemple="Cacio e pepe" />
          <div className="grid gap-4 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
            <ChampTexte nom={nom("prix")} libelle="Prix (€)" inputMode="decimal" maximum={12} exemple="12,50" autoComplete="off" />
            <ChampTexte nom={nom("unite")} libelle="Unité" facultatif maximum={LIMITES_CARTE.unite} exemple="le verre, par personne…" />
          </div>
          <ChampTexte nom={nom("description")} libelle="Description" facultatif lignes={2} maximum={LIMITES_CARTE.description} />
          <div className="grid gap-2.5">
            <CaseACocher nom={nom("signature")} facultatif><span aria-hidden="true">⭐ </span>Spécialité de la maison</CaseACocher>
            <CaseACocher nom={nom("alcool")} facultatif><span aria-hidden="true">🍷 </span>{"Contient de l'alcool"}</CaseACocher>
          </div>
          <ChoixMultiples nom={nom("etiquettes")} legende="Repères" type="checkbox" enLigne options={OPTIONS_ETIQUETTES} />
          <div className="flex flex-wrap gap-2">
            {position > 0 && <BoutonGesteCarte geste={`monter-plat:${section}:${position}`} focus={focus} emoji="↑" precision={precision}>Monter</BoutonGesteCarte>}
            {position < nombre - 1 && <BoutonGesteCarte geste={`descendre-plat:${section}:${position}`} focus={focus} emoji="↓" precision={precision}>Descendre</BoutonGesteCarte>}
            <BoutonGesteCarte geste={`supprimer-plat:${section}:${position}`} focus={focus} emoji="✕" precision={precision} danger>Supprimer</BoutonGesteCarte>
          </div>
        </div>
      </fieldset>
    </li>
  );
}
