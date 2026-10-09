import { useState } from "react";

import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerRattachements, type StatutRattachement } from "~/services/rattachements.ts";
import { CarteRattachement } from "./CarteRattachement.tsx";

/** Les demandes de compte pro (« c'est mon lieu ») : à valider, validées (lieux vérifiés ✓), refusées, retirées. */
export function ListeRattachements({ onDecision }: { onDecision: () => void }) {
  const [statut, setStatut] = useState<StatutRattachement>("en-attente");
  const [bilan, setBilan] = useState<string | null>(null);
  // À valider : seulement les gérants (les membres d'équipe sont invités par leur gérant)
  const { donnees, erreur, chargement, recharger } = utiliserChargement(() => listerRattachements({ statut, role: statut === "en-attente" ? "gerant" : "" }), [statut]);
  return (
    <div className="grid gap-4">
      <Onglets
        libelle="Comptes pro"
        valeur={statut}
        onChange={(nouveau) => (setStatut(nouveau), setBilan(null))}
        options={[{ valeur: "en-attente", libelle: "À valider" }, { valeur: "valide", libelle: "Validés" }, { valeur: "refuse", libelle: "Refusés" }, { valeur: "retire", libelle: "Retirés" }]}
      />
      {bilan && <p role="status" className="rounded-xl bg-vert-clair px-4 py-2 text-sm font-semibold text-vert">{bilan}</p>}
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {donnees?.length === 0 && (
        <Carte>
          <EtatVide emoji="🏪" titre={statut === "en-attente" ? "Aucune demande de compte pro" : "Rien ici pour l'instant"}>
            Un restaurateur ou un commerçant demande à gérer la fiche de son lieu depuis l'espace pro (pro.sosmiam.fr). Une fois validé, son lieu est « Vérifié ✓ ».
          </EtatVide>
        </Carte>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        {donnees?.map((rattachement) => <CarteRattachement key={rattachement.id} rattachement={rattachement} onChange={(texte) => { setBilan(texte); recharger(); onDecision(); }} />)}
      </div>
    </div>
  );
}
