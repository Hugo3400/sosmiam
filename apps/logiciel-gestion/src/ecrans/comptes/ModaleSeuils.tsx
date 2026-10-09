import { useEffect, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { CHAMPS_SEUILS } from "~/contenus/seuils-surveillance.ts";
import { reglerSeuilsSurveillance, type SeuilsSurveillance } from "~/services/surveillance.ts";

type Props = { ouverte: boolean; seuils: SeuilsSurveillance; parDefaut: SeuilsSurveillance; onFermer: () => void; onEnregistre: () => void };

const enTextes = (seuils: SeuilsSurveillance) =>
  Object.fromEntries(Object.entries(seuils).map(([cle, valeur]) => [cle, String(valeur)])) as Record<keyof SeuilsSurveillance, string>;

/** Régler les seuils de la surveillance des visites (noté au journal). Rien n'est jamais bloqué tout seul. */
export function ModaleSeuils({ ouverte, seuils, parDefaut, onFermer, onEnregistre }: Props) {
  const [saisies, setSaisies] = useState(enTextes(seuils));
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<unknown>(null);
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
    } catch (e) {
      setErreur(e);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Modale
      titre="Seuils de la surveillance"
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
      <div className="grid gap-4 sm:grid-cols-2">
        {CHAMPS_SEUILS.map((c) => (
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
      <div className="mt-3"><MessageErreur erreur={erreur} /></div>
    </Modale>
  );
}
