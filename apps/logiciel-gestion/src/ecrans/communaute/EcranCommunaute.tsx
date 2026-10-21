import { RotateCw } from "lucide-react";
import { useState } from "react";

import type { StatutIdee } from "../../../../../packages/commun/src/types/idees.ts";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { STATUTS_IDEE } from "~/contenus/statuts-idees.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerIdees } from "~/services/communaute.ts";
import { CarteIdee } from "./CarteIdee.tsx";
import { EtiquettesLibres } from "./EtiquettesLibres.tsx";

export function EcranCommunaute() {
  const [partie, setPartie] = useState<"idees" | "etiquettes">("idees");
  const [statut, setStatut] = useState<StatutIdee | "">("en-relecture");
  const [tour, setTour] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const { donnees, erreur, chargement, recharger } = utiliserChargement(() => listerIdees(statut), [statut, tour]);
  const apres = (texte: string) => (setMessage(texte), recharger());

  return (
    <>
      <EnTeteEcran
        titre="Communauté"
        sousTitre="La boîte à idées des Miamis (statut, réponse de la Brigade, idée du mois) et les étiquettes libres des sorties des Miamis."
        actions={<Bouton icone={RotateCw} chargement={chargement && !!donnees} onClick={() => setTour((t) => t + 1)}>Actualiser</Bouton>}
      />
      <div className="mb-5 flex flex-wrap gap-3">
        <Onglets libelle="Partie" valeur={partie} onChange={setPartie} options={[{ valeur: "idees", libelle: "Idées" }, { valeur: "etiquettes", libelle: "Étiquettes libres" }]} />
        {partie === "idees" && <Onglets libelle="Filtrer par statut" valeur={statut} onChange={setStatut} options={[...STATUTS_IDEE, { valeur: "", libelle: "Toutes" }]} />}
      </div>
      {message && <p role="status" className="mb-4 rounded-xl bg-vert-clair px-4 py-2 text-sm font-semibold text-vert">{message}</p>}
      {partie === "etiquettes" ? (
        <EtiquettesLibres key={tour} onChange={setMessage} />
      ) : (
        <>
          <MessageErreur erreur={erreur} reessayer={recharger} />
          {!donnees && chargement && <Chargement />}
          {donnees && donnees.idees.length === 0 && (
            <Carte><EtatVide emoji="💡" titre="Rien ici">{statut === "en-relecture" ? "Aucune idée n'attend ta relecture." : "Aucune idée avec ce statut."}</EtatVide></Carte>
          )}
          <ul className="grid gap-3 xl:grid-cols-2">
            {donnees?.idees.map((i) => <CarteIdee key={`${i.id}-${i.statut}-${i.reponseBrigade ?? ""}`} idee={i} onChange={apres} />)}
          </ul>
        </>
      )}
    </>
  );
}
