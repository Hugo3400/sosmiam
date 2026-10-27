import { RAISONS_SIGNALER_IMAGE, TEXTES_SIGNALER_IMAGE } from "~/contenus/signaler-image";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = { choisie?: string; precision?: string; erreur?: string };

const ID_ERREUR = "signaler-raison-erreur";
const FOCUS = "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre";

export function ChoixRaisonImage({ choisie, precision, erreur }: Props) {
  const T = TEXTES_SIGNALER_IMAGE.raison;
  return (
    <fieldset>
      <legend className="mb-2.5 font-titre text-xl font-extrabold">{lierPonctuation(T.legende)}</legend>
      {erreur && <p id={ID_ERREUR} className="mb-2.5 text-sm font-semibold text-rouge-texte">{erreur}</p>}
      <ul className="flex flex-col gap-2.5">
        {RAISONS_SIGNALER_IMAGE.map((raison) => {
          const id = `signaler-raison-${raison.cle}`;
          return (
            <li
              key={raison.cle}
              className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 rounded-2xl border-2 border-encre bg-white px-4 py-3 has-[[name=raison]:checked]:bg-jaune-clair"
            >
              <input
                id={id}
                type="radio"
                name="raison"
                value={raison.cle}
                defaultChecked={choisie === raison.cle}
                aria-describedby={erreur ? ID_ERREUR : undefined}
                className={`peer mt-1 size-5 accent-encre ${FOCUS}`}
              />
              <label htmlFor={id} className="cursor-pointer">
                <span className="font-bold">
                  <span aria-hidden="true">{raison.emoji} </span>
                  {raison.titre}
                </span>
                <span className="block text-sm text-gris">{raison.detail}</span>
              </label>
              {raison.precisions.length > 0 && (
                <fieldset className="col-start-2 mt-3 hidden peer-checked:block">
                  <legend className="mb-2 text-sm font-semibold">{T.precision}</legend>
                  <div className="flex flex-wrap gap-2">
                    {raison.precisions.map((texte) => (
                      <label key={texte} className="inline-flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-encre bg-white px-3 py-1.5 text-sm has-checked:bg-jaune">
                        <input
                          type="radio"
                          name={`precision-${raison.cle}`}
                          value={texte}
                          defaultChecked={choisie === raison.cle && precision === texte}
                          className={`size-4 shrink-0 accent-encre ${FOCUS}`}
                        />
                        {texte}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
