import { formaterPrixLangue } from "../../../../../packages/commun/src/fonctions/langue/formater-prix-langue.ts";
import { EMOJIS_ETIQUETTES, TEXTES_CARTE_DU_LIEU_PAR_LANGUE } from "~/contenus/carte-du-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { ElementCarte } from "~/types/carte";

/**
 * Une ligne de la carte d'un lieu : nom, description, prix à droite (« 12,50 € », avec son unité), puis les repères
 * (⭐ spécialité de la maison, végé, fait maison…). Les emoji sont cachés aux lecteurs d'écran, qui lisent les mots.
 */
export function ElementCarteDuLieu({ element }: { element: ElementCarte }) {
  const T = utiliserTextes(TEXTES_CARTE_DU_LIEU_PAR_LANGUE);
  const langue = utiliserLangue();
  const langueInterface = langue === "fr" ? undefined : langue;
  const etiquettes = element.etiquettes ?? [];
  return (
    <li className="border-t border-encre/10 py-3.5 first:border-t-0">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold [overflow-wrap:anywhere]">{lierPonctuation(element.nom)}</p>
          {element.description && <p className="mt-0.5 text-sm text-gris [overflow-wrap:anywhere]">{lierPonctuation(element.description)}</p>}
        </div>
        <p className="max-w-[40%] shrink-0 text-right">
          <span lang={langueInterface} className="font-semibold whitespace-nowrap">{element.prix === 0 ? T.gratuit : formaterPrixLangue(element.prix, langue)}</span>
          {element.unite && <span className="block text-xs text-gris [overflow-wrap:anywhere]">{element.unite}</span>}
        </p>
      </div>
      {(element.signature || etiquettes.length > 0) && (
        <ul lang={langueInterface} aria-label={T.reperes} className="mt-2 flex flex-wrap gap-1.5 text-xs">
          {element.signature && (
            <li className="rounded-full bg-encre px-2.5 py-1 font-semibold text-jaune"><span aria-hidden="true">⭐ </span>{T.specialiteMaison}</li>
          )}
          {etiquettes.map((etiquette) => (
            <li key={etiquette} className="rounded-full bg-jaune-clair px-2.5 py-1 font-medium">
              <span aria-hidden="true">{`${EMOJIS_ETIQUETTES[etiquette]} `}</span>
              <span aria-hidden="true">{T.etiquettes[etiquette].libelle}</span>
              <span className="sr-only">{T.etiquettes[etiquette].lu}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
