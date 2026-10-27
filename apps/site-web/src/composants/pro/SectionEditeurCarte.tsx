import { LIMITES_CARTE } from "../../../../../packages/commun/src/regles/carte-du-lieu.ts";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { BoutonGesteCarte } from "~/composants/pro/BoutonGesteCarte";
import { PlatEditeurCarte } from "~/composants/pro/PlatEditeurCarte";
import { TEXTES_EDITEUR_CARTE_PAR_LANGUE } from "~/contenus/editeur-carte";
import { nommerChampCarte } from "~/fonctions/carte/nommer-champ-carte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { BrouillonSection } from "~/types/carte";

type Props = {
  section: BrouillonSection;
  position: number;
  nombre: number;
  /** Il reste de la place sur la carte (250 plats au plus) */
  placeSurLaCarte: boolean;
  focus: string | null;
};

/**
 * Une section dans l'éditeur de carte (« Les entrées », « À boire ») : son titre, ses plats, « Ajouter un plat » et ses
 * propres boutons Monter, Descendre et Supprimer. Une section vide est permise : elle n'apparaît pas sur la fiche.
 */
export function SectionEditeurCarte({ section, position, nombre, placeSurLaCarte, focus }: Props) {
  const T = utiliserTextes(TEXTES_EDITEUR_CARTE_PAR_LANGUE).section;
  const plats = section.elements.length;
  const pleine = plats >= LIMITES_CARTE.elementsParSection;
  const precision = T.precision(position + 1, section.titre.trim());
  return (
    <fieldset className="min-w-0 rounded-carte border-2 border-encre bg-white p-4 shadow-brut md:p-6">
      <legend className="float-left flex w-full flex-wrap items-baseline justify-between gap-x-3 font-titre text-xl font-extrabold">
        <span>{T.titre(position + 1)}</span>
        <span className="font-sans text-sm font-semibold text-gris">{T.plats(plats)}</span>
      </legend>
      <div className="clear-both grid gap-4 pt-3">
        <ChampTexte nom={nommerChampCarte(position, "titre")} libelle={T.libelleTitre} maximum={LIMITES_CARTE.titreSection} exemple={T.exempleTitre} />
        <div className="flex flex-wrap gap-2">
          {position > 0 && <BoutonGesteCarte geste={`monter-section:${position}`} focus={focus} emoji="↑" precision={precision}>{T.monter}</BoutonGesteCarte>}
          {position < nombre - 1 && <BoutonGesteCarte geste={`descendre-section:${position}`} focus={focus} emoji="↓" precision={precision}>{T.descendre}</BoutonGesteCarte>}
          <BoutonGesteCarte geste={`supprimer-section:${position}`} focus={focus} emoji="✕" precision={precision} danger>{T.supprimer}</BoutonGesteCarte>
        </div>
        {plats > 0 ? (
          <ol className="grid gap-4">
            {section.elements.map((element, j) => (
              <PlatEditeurCarte key={j} element={element} section={position} position={j} nombre={plats} focus={focus} />
            ))}
          </ol>
        ) : (
          <p className="text-sm text-gris">{lierPonctuation(T.vide)}</p>
        )}
        <div>
          {pleine || !placeSurLaCarte ? (
            <p className="text-sm font-semibold text-gris">
              {lierPonctuation(pleine ? T.pleine : T.cartePleine)}
            </p>
          ) : (
            <BoutonGesteCarte geste={`ajouter-plat:${position}`} focus={focus} emoji="+" precision={T.dans(precision)} ajout>{T.ajouterPlat}</BoutonGesteCarte>
          )}
        </div>
      </div>
    </fieldset>
  );
}
