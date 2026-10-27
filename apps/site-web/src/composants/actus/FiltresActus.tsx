import { Form } from "react-router";

import { LIBELLES_ACTUS_PAR_LANGUE } from "../../../../../packages/commun/src/contenus/libelles-actus.ts";
import { RUBRIQUES_ACTUS, type RubriqueActus } from "../../../../../packages/commun/src/regles/actus.ts";
import { Bouton } from "~/composants/interface/Bouton";
import { PastilleFiltre } from "~/composants/page-lieux/PastilleFiltre";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/actus";
import { ecrireAdresseActus } from "~/fonctions/actus/ecrire-adresse-actus";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { FiltresActus as Filtres, VilleActus } from "~/types/actus";

type Props = { filtres: Filtres; villes: readonly VilleActus[] };

export function FiltresActus({ filtres, villes }: Props) {
  const T = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE);
  const L = utiliserTextes(LIBELLES_ACTUS_PAR_LANGUE);
  const lienLangue = utiliserLienLangue();
  const noms: Record<RubriqueActus | "tout", string> = { ...L.filtres, ...T.filtres.longs };
  const adresse = (rubrique: RubriqueActus | null) => lienLangue(ecrireAdresseActus({ rubrique, ville: filtres.ville }));
  const villeChoisie = villes.some((ville) => ville.identifiant === filtres.ville) ? (filtres.ville ?? "") : "";

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div role="group" aria-label={T.filtres.rubriques} className="flex flex-wrap items-center gap-2.5">
        <PastilleFiltre vers={adresse(null)} actif={filtres.rubrique === null}>{noms.tout}</PastilleFiltre>
        {RUBRIQUES_ACTUS.map((rubrique) => (
          <PastilleFiltre key={rubrique} vers={adresse(rubrique)} actif={filtres.rubrique === rubrique}>
            {noms[rubrique]}
          </PastilleFiltre>
        ))}
      </div>
      <Form method="get" action={lienLangue("/actus")} preventScrollReset className="flex flex-wrap items-center gap-2.5">
        {filtres.rubrique && <input type="hidden" name="rubrique" value={filtres.rubrique} />}
        <label htmlFor="ville-actus" className="text-sm font-bold">{T.filtres.ville}</label>
        <select
          key={villeChoisie}
          id="ville-actus"
          name="ville"
          defaultValue={villeChoisie}
          className="min-h-11 rounded-full border-2 border-encre bg-white px-4 text-sm font-semibold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre"
        >
          <option value="">{T.filtres.toutes}</option>
          {villes.map((ville) => (
            <option key={ville.identifiant} value={ville.identifiant}>{ville.nom}</option>
          ))}
        </select>
        <Bouton type="submit" variante="blanc" petit>{T.filtres.afficher}</Bouton>
      </Form>
    </div>
  );
}
