import { use, useState } from "react";

import { ContexteFormulaire } from "~/composants/compte/FormulaireCompte";
import { ChampCommune } from "~/composants/fondateurs/ChampCommune";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { CommuneFondateurs } from "~/types/compte";

type Props = {
  libelle: string;
  aide?: string;
  /** Plusieurs communes correspondent à ce qui a été tapé (réponse de l'action) : la liste où choisir la sienne */
  choix?: CommuneFondateurs[] | null;
};

/**
 * « Ta ville » DANS un FormulaireCompte (POST) : le texte tapé part dans « ville », le code INSEE choisi dans
 * « communeCode », avec « communeTexte », le texte pour lequel ce code a été choisi (s'il a changé depuis, sans JavaScript,
 * l'action cherche de nouveau). Avec JavaScript, ChampCommune propose les communes au fil de la frappe ; sans, l'action
 * cherche le texte côté serveur, et s'il correspond à plusieurs communes, elles reviennent ici en boutons radio.
 */
export function ChampCommuneFormulaire({ libelle, aide, choix }: Props) {
  const { prefixe, erreurs, valeurs, focusAuChargement } = use(ContexteFormulaire);
  const id = `${prefixe}-ville`;
  const [code, setCode] = useState(valeurs.communeCode ?? "");
  const [texteDuCode, setTexteDuCode] = useState(valeurs.communeTexte ?? "");
  const [retenue, setRetenue] = useState(valeurs.communeDecrite ?? "");
  const [choixOuverts, setChoixOuverts] = useState(Boolean(choix?.length));
  // Une commune choisie depuis la dernière réponse (suggestion) : l'erreur d'avant ne la concerne plus
  const erreur = code && retenue && retenue !== (valeurs.communeDecrite ?? "") ? undefined : erreurs.ville;
  const listeChoix = choixOuverts && choix?.length ? choix : null;
  const decrit = [aide ? `${id}-aide` : "", erreur ? `${id}-erreur` : "", retenue && !erreur ? `${id}-retenue` : ""].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">{libelle}</label>
      {aide && <p id={`${id}-aide`} className="mb-2 text-sm text-gris">{lierPonctuation(aide)}</p>}
      {/* Une frappe (événement « input », qui remonte jusqu'ici) défait le choix : la commune n'est plus celle tapée */}
      <div
        onInput={() => {
          setCode("");
          setRetenue("");
        }}
      >
        <ChampCommune
          id={id}
          name="ville"
          valeurInitiale={valeurs.ville ?? ""}
          decritPar={decrit}
          invalide={Boolean(erreur)}
          autoFocus={focusAuChargement === "ville"}
          onChoisir={(commune) => {
            setCode(commune.code);
            setTexteDuCode(commune.nom);
            setRetenue(`${commune.nom} (${commune.nomDepartement})`);
            setChoixOuverts(false);
          }}
        />
      </div>
      {!listeChoix && (
        <>
          <input type="hidden" name="communeCode" value={code} />
          <input type="hidden" name="communeTexte" value={texteDuCode} />
        </>
      )}
      {retenue && !erreur && (
        <p id={`${id}-retenue`} className="mt-1.5 text-sm font-semibold">
          <span aria-hidden="true">✓ </span>{lierPonctuation(`Commune choisie : ${retenue}`)}
        </p>
      )}
      {erreur && <p id={`${id}-erreur`} className="mt-1.5 text-sm font-semibold text-rouge-texte">{lierPonctuation(erreur)}</p>}
      {listeChoix && (
        <fieldset className="mt-3">
          <legend className="mb-2 text-sm font-semibold">Ta commune</legend>
          <input type="hidden" name="communeTexte" value={valeurs.ville ?? ""} />
          <div className="grid gap-2.5 sm:grid-cols-2">
            {listeChoix.map((commune) => (
              <label key={commune.code} className="flex cursor-pointer items-start gap-3 font-medium">
                <input type="radio" name="communeCode" value={commune.code} className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-encre" />
                <span>
                  {commune.nom}
                  <span className="text-gris">{` (${commune.codePostal ? `${commune.codePostal}, ` : ""}${commune.nomDepartement})`}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
