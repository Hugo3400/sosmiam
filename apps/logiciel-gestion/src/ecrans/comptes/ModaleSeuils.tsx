import { useEffect, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { CHAMPS_SEUILS } from "~/contenus/seuils-surveillance.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { reglerSeuilsSurveillance, type SeuilsSurveillance } from "~/services/surveillance.ts";

type Props = { ouverte: boolean; seuils: SeuilsSurveillance; parDefaut: SeuilsSurveillance; onFermer: () => void; onEnregistre: () => void };

const enTextes = (seuils: SeuilsSurveillance) =>
  Object.fromEntries(Object.entries(seuils).map(([cle, valeur]) => [cle, String(valeur)])) as Record<keyof SeuilsSurveillance, string>;

/** Régler les seuils de la surveillance des visites (noté au journal). Rien n'est jamais bloqué tout seul. */
export function ModaleSeuils({ ouverte, seuils, parDefaut, onFermer, onEnregistre }: Props) {
  const [saisies, setSaisies] = useState(enTextes(seuils));
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  useEffect(() => {
    if (ouverte) {
      setSaisies(enTextes(seuils));
      setErreur(null);
    }
  }, [ouverte, seuils]);
  const invalide = (cle: keyof SeuilsSurveillance) => {
    const champ = CHAMPS_SEUILS.find((c) => c.cle === cle);
    const valeur = Number(saisies[cle]);
    return !champ || !/^\d+$/.test(saisies[cle].trim()) || valeur < champ.min || valeur > champ.max;
  };
  const erreurs = CHAMPS_SEUILS.filter((c) => invalide(c.cle));

  const enregistrer = async () => {
    setEnvoi(true);
    setErreur(null);
    try {
      await reglerSeuilsSurveillance(Object.fromEntries(CHAMPS_SEUILS.map((c) => [c.cle, Number(saisies[c.cle])])) as SeuilsSurveillance);
      onEnregistre();
      onFermer();
    } catch (probleme) {
      setErreur(expliquerErreur(probleme instanceof ErreurApi ? probleme : null));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Modale
      titre="Seuils de la surveillance"
      large
      ouverte={ouverte}
      onFermer={onFermer}
      actions={
        <>
          <Bouton variante="discret" onClick={() => setSaisies(enTextes(parDefaut))}>Remettre les valeurs prudentes</Bouton>
          <Bouton onClick={onFermer}>Annuler</Bouton>
          <Bouton variante="principal" chargement={envoi} desactive={erreurs.length > 0} onClick={enregistrer}>Enregistrer</Bouton>
        </>
      }
    >
      <p className="mb-4 text-sm text-gris">
        Un compte n'est signalé pour ses refus que si au moins 2 lieux différents l'ont refusé : un seul lieu ne suffit jamais.
        Les seuils ne bloquent rien, ils te disent seulement où regarder.
      </p>
      {(["comptes", "lieux"] as const).map((ligne) => (
        <fieldset key={ligne} className="mb-4">
          <legend className="mb-2 font-titre text-[15px] font-extrabold">{ligne === "comptes" ? "Comptes" : "Lieux, et période regardée"}</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            {CHAMPS_SEUILS.filter((c) => c.ligne === ligne).map((c) => (
              <Champ
                key={c.cle}
                libelle={c.libelle}
                type="number"
                min={c.min}
                max={c.max}
                valeur={saisies[c.cle]}
                onChange={(valeur) => setSaisies((avant) => ({ ...avant, [c.cle]: valeur }))}
                aide={c.aide}
                erreur={invalide(c.cle) ? `Un nombre entier entre ${c.min} et ${c.max}.` : null}
              />
            ))}
          </div>
        </fieldset>
      ))}
      {erreur && <p role="alert" className="mt-3 text-sm font-semibold text-tomate">{erreur}</p>}
    </Modale>
  );
}
