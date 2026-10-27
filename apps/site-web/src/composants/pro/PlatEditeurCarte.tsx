import { ETIQUETTES_CARTE, LIMITES_CARTE } from "../../../../../packages/commun/src/regles/carte-du-lieu.ts";
import { CaseACocher } from "~/composants/compte/CaseACocher";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { ChoixMultiples } from "~/composants/compte/ChoixMultiples";
import { BoutonGesteCarte } from "~/composants/pro/BoutonGesteCarte";
import { EMOJIS_ETIQUETTES, TEXTES_CARTE_DU_LIEU_PAR_LANGUE } from "~/contenus/carte-du-lieu";
import { EXEMPLE_NOM_PLAT, TEXTES_EDITEUR_CARTE_PAR_LANGUE } from "~/contenus/editeur-carte";
import { nommerChampCarte } from "~/fonctions/carte/nommer-champ-carte";
import { utiliserTextes } from "~/hooks/utiliser-textes";
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

/**
 * Un plat dans l'éditeur de carte : nom, prix (en euros, virgule acceptée), unité, description, « Spécialité de la
 * maison », « Contient de l'alcool » et les repères ; puis Monter, Descendre et Supprimer (boutons d'envoi).
 */
export function PlatEditeurCarte({ element, section, position, nombre, focus }: Props) {
  const T = utiliserTextes(TEXTES_EDITEUR_CARTE_PAR_LANGUE).plat;
  const C = utiliserTextes(TEXTES_CARTE_DU_LIEU_PAR_LANGUE);
  const options = ETIQUETTES_CARTE.map((valeur) => ({ valeur, libelle: `${EMOJIS_ETIQUETTES[valeur]} ${C.etiquettes[valeur].libelle}` }));
  const nom = (champ: string) => nommerChampCarte(section, champ, position);
  const precision = T.precision(position + 1, element.nom.trim());
  return (
    <li>
      <fieldset className="min-w-0 rounded-2xl border-2 border-encre/20 bg-creme/40 p-4 md:p-5">
        <legend className="px-1 text-sm font-bold text-gris">{T.titre(position + 1)}</legend>
        <div className="grid gap-4">
          <ChampTexte nom={nom("nom")} libelle={T.nom} maximum={LIMITES_CARTE.nom} exemple={EXEMPLE_NOM_PLAT} />
          <div className="grid gap-4 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
            <ChampTexte nom={nom("prix")} libelle={T.prix} inputMode="decimal" maximum={12} exemple={T.exemplePrix} autoComplete="off" />
            <ChampTexte nom={nom("unite")} libelle={T.unite} facultatif maximum={LIMITES_CARTE.unite} exemple={T.exempleUnite} />
          </div>
          <ChampTexte nom={nom("description")} libelle={T.description} facultatif lignes={2} maximum={LIMITES_CARTE.description} />
          <div className="grid gap-2.5">
            <CaseACocher nom={nom("signature")} facultatif><span aria-hidden="true">⭐ </span>{C.specialiteMaison}</CaseACocher>
            <CaseACocher nom={nom("alcool")} facultatif><span aria-hidden="true">🍷 </span>{T.alcool}</CaseACocher>
          </div>
          <ChoixMultiples nom={nom("etiquettes")} legende={C.reperes} type="checkbox" enLigne options={options} />
          <div className="flex flex-wrap gap-2">
            {position > 0 && <BoutonGesteCarte geste={`monter-plat:${section}:${position}`} focus={focus} emoji="↑" precision={precision}>{T.monter}</BoutonGesteCarte>}
            {position < nombre - 1 && <BoutonGesteCarte geste={`descendre-plat:${section}:${position}`} focus={focus} emoji="↓" precision={precision}>{T.descendre}</BoutonGesteCarte>}
            <BoutonGesteCarte geste={`supprimer-plat:${section}:${position}`} focus={focus} emoji="✕" precision={precision} danger>{T.supprimer}</BoutonGesteCarte>
          </div>
        </div>
      </fieldset>
    </li>
  );
}
