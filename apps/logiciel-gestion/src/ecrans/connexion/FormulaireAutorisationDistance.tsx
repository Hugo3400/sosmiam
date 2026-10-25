import { LogIn } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { ChoixEnPastilles } from "~/composants/interface/ChoixEnPastilles.tsx";
import { DUREES_POSTE, TEXTES_AUTORISATION, type DureePoste } from "~/contenus/postes.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { autoriserADistance } from "~/services/session.ts";
import { ecrireCoffre, type CoffreCle } from "~/stockage/coffre-local.ts";

const T = TEXTES_AUTORISATION.distance;

export function FormulaireAutorisationDistance({ coffre, onConnecte }: { coffre: CoffreCle; onConnecte: (poste: string, coffre: CoffreCle) => void }) {
  const [nom, setNom] = useState<string>(T.nomParDefaut);
  const [duree, setDuree] = useState<DureePoste>("passage");
  const [motDePasse, setMotDePasse] = useState("");
  const [code, setCode] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const codePropre = code.replace(/\s/g, "");

  async function autoriser(evenement: FormEvent) {
    evenement.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      const ouverte = await autoriserADistance({ clePublique: coffre.clePublique, nom: nom.trim() || T.nomParDefaut, duree, motDePasse, code: codePropre });
      const misAJour = { ...coffre, expireLe: ouverte.expireLe };
      ecrireCoffre(misAJour);
      setMotDePasse("");
      onConnecte(ouverte.poste, misAJour);
    } catch (probleme) {
      setErreur(expliquerErreur(probleme instanceof ErreurApi ? probleme : new ErreurApi("erreur-inattendue", 0)));
      setCode("");
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={autoriser} className="grid gap-4">
      <p className="text-sm text-gris">{T.intro}</p>
      <Champ libelle={T.nom} valeur={nom} onChange={setNom} maxLength={40} aide={T.aideNom} />
      <div className="grid gap-1.5">
        <p className="text-sm font-semibold">{T.duree}</p>
        <ChoixEnPastilles libelle={T.duree} valeur={duree} options={DUREES_POSTE.map(({ valeur, libelle }) => ({ valeur, libelle }))} onChange={setDuree} />
        <p className="text-[13px] text-gris">{T.aideDuree}</p>
      </div>
      <Champ libelle={T.motDePasse} type="password" autoComplete="off" valeur={motDePasse} onChange={setMotDePasse} aide={T.aideMotDePasse} />
      <Champ libelle={T.code} inputMode="numeric" autoComplete="one-time-code" maxLength={7} placeholder="123 456" valeur={code} onChange={setCode} aide={T.aideCode} />
      {erreur && <div role="alert" className="rounded-xl bg-rose-alerte px-3 py-2 text-sm font-semibold text-rouge-texte">{erreur}</div>}
      <Bouton type="submit" variante="principal" icone={LogIn} chargement={enCours} desactive={!motDePasse || !/^\d{6}$/.test(codePropre)}>{T.bouton}</Bouton>
    </form>
  );
}
