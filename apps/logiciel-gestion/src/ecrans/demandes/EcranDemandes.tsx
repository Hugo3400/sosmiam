import { RotateCw } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerDemandes, type StatutDemande } from "~/services/demandes.ts";
import { CarteDemande } from "./CarteDemande.tsx";
import { ListeRattachements } from "./ListeRattachements.tsx";

/**
 * Les lieux qui veulent être sur SOS Miam (formulaire du site), les pépites proposées sur Discord, et les demandes de
 * compte pro (« c'est mon lieu », lieu vérifié ✓).
 */
export function EcranDemandes({ onDecision }: { onDecision: () => void }) {
  const [partie, setPartie] = useState<"lieux" | "pros">("lieux");
  const [statut, setStatut] = useState<StatutDemande>("a-traiter");
  const { donnees, erreur, chargement, recharger } = utiliserChargement(() => listerDemandes(statut), [statut]);
  return (
    <>
      <EnTeteEcran
        titre="Demandes de lieux"
        sousTitre="Les lieux qui s'inscrivent depuis le site, et les pépites proposées par la communauté sur Discord. Accepter crée la fiche en brouillon."
        actions={<Bouton icone={RotateCw} chargement={chargement && !!donnees} onClick={recharger}>Actualiser</Bouton>}
      />
      <div className="mb-4">
        <Onglets libelle="Partie" valeur={partie} onChange={setPartie} options={[{ valeur: "lieux", libelle: "Lieux à ajouter" }, { valeur: "pros", libelle: "Comptes pro" }]} />
      </div>
      {partie === "pros" && <ListeRattachements onDecision={onDecision} />}
      {partie === "lieux" && (
        <>
          <div className="mb-5">
            <Onglets
              libelle="Demandes"
              valeur={statut}
              onChange={setStatut}
              options={[
                { valeur: "a-traiter", libelle: "À traiter", compteur: donnees?.compteurs["a-traiter"] },
                { valeur: "acceptee", libelle: "Acceptées" },
                { valeur: "refusee", libelle: "Refusées" },
              ]}
            />
          </div>
          <MessageErreur erreur={erreur} reessayer={recharger} />
          {!donnees && chargement && <Chargement />}
          {donnees && donnees.demandes.length === 0 && (
            <Carte>
              <EtatVide emoji="📬" titre={statut === "a-traiter" ? "Pas de nouvelle demande" : "Rien ici pour l'instant"}>
                Elles arrivent du formulaire « J'inscris mon lieu » du site et de la commande /proposer-lieu sur Discord.
              </EtatVide>
            </Carte>
          )}
          <div className="grid gap-4 xl:grid-cols-2">
            {donnees?.demandes.map((demande) => <CarteDemande key={demande.id} demande={demande} onChange={recharger} />)}
          </div>
        </>
      )}
    </>
  );
}
