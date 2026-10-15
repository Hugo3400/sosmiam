import { Plus, RotateCw } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { decrireEtatPopUp, type EtatPopUp } from "~/fonctions/pop-ups/decrire-etat-pop-up.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerPopUps, type PopUpApp } from "~/services/pop-ups-app.ts";
import { CartePopUp } from "./CartePopUp.tsx";
import { FormulairePopUp } from "./FormulairePopUp.tsx";

const GROUPES: { titre: string; etats: EtatPopUp[] }[] = [
  { titre: "En ligne et à venir", etats: ["en-ligne", "a-venir"] },
  { titre: "Brouillons", etats: ["brouillon"] },
  { titre: "Finies et retirées", etats: ["finie", "retiree"] },
];

export function EcranPopUps() {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(listerPopUps, []);
  const [ouverte, setOuverte] = useState<PopUpApp | "nouvelle" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const apres = (texte: string) => (setOuverte(null), setMessage(texte), recharger());
  const popUps = donnees?.annonces ?? [];

  return (
    <>
      <EnTeteEcran
        titre="Pop-ups de l'app"
        sousTitre="Un message qui s'affiche à l'ouverture de l'app, une seule fois par téléphone : la plus récente pas encore vue. Jamais pendant l'accueil, la vérification d'âge ou Miam Safe."
        actions={
          <>
            <Bouton icone={RotateCw} chargement={chargement && !!donnees} onClick={recharger}>Actualiser</Bouton>
            <Bouton variante="principal" icone={Plus} onClick={() => setOuverte("nouvelle")}>Nouvelle pop-up</Bouton>
          </>
        }
      />
      {message && <p role="status" className="mb-4 rounded-xl bg-vert-clair px-4 py-2 text-sm font-semibold text-vert">{message}</p>}
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {donnees && popUps.length === 0 && (
        <Carte><EtatVide emoji="💬" titre="Pas encore de pop-up">Une ville qui ouvre, un BIG SOS, une nouveauté : dis-le aux Miamis dès qu'ils ouvrent l'app.</EtatVide></Carte>
      )}
      <div className="grid gap-6">
        {GROUPES.map((groupe) => {
          const liste = popUps.filter((p) => groupe.etats.includes(decrireEtatPopUp(p)));
          if (liste.length === 0) return null;
          return (
            <section key={groupe.titre} className="grid gap-3">
              <h2 className="font-titre text-lg font-extrabold">{groupe.titre} ({liste.length})</h2>
              <ul className="grid gap-3 xl:grid-cols-2">
                {liste.map((p) => <CartePopUp key={p.id} popUp={p} onModifier={() => setOuverte(p)} onChange={apres} />)}
              </ul>
            </section>
          );
        })}
      </div>
      {ouverte && <FormulairePopUp popUp={ouverte === "nouvelle" ? null : ouverte} onFermer={() => setOuverte(null)} onEnregistree={apres} />}
    </>
  );
}
