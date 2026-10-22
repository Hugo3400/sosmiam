import { RotateCw, Trash2 } from "lucide-react";
import { useState } from "react";

import type { StatutSignalementSecurite } from "../../../../../packages/commun/src/types/securite.ts";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { STATUTS_SECURITE } from "~/contenus/securite.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerSignalementsSecurite, listerTableauHonneur, retirerDuTableauHonneur } from "~/services/securite.ts";
import { CarteSignalementSecurite } from "./CarteSignalementSecurite.tsx";

export function EcranChasseAuxBugs({ onDecision }: { onDecision: () => void }) {
  const [partie, setPartie] = useState<"signalements" | "tableau">("signalements");
  const [statut, setStatut] = useState<StatutSignalementSecurite | "">("");
  const [message, setMessage] = useState<string | null>(null);
  const signalements = utiliserChargement(() => (partie === "signalements" ? listerSignalementsSecurite(statut) : Promise.resolve(null)), [partie, statut]);
  const tableau = utiliserChargement(() => (partie === "tableau" ? listerTableauHonneur() : Promise.resolve(null)), [partie]);
  const apres = (texte: string) => (setMessage(texte), signalements.recharger(), tableau.recharger(), onDecision());

  return (
    <>
      <EnTeteEcran
        titre="Chasse aux bugs"
        sousTitre="Les failles signalées sur sosmiam.fr/securite : réponse sous 7 jours, badge, tableau d'honneur. Un signalement est effacé 2 ans après sa clôture."
        actions={<Bouton icone={RotateCw} onClick={() => (signalements.recharger(), tableau.recharger())}>Actualiser</Bouton>}
      />
      <div className="mb-5 flex flex-wrap gap-3">
        <Onglets libelle="Partie" valeur={partie} onChange={setPartie} options={[{ valeur: "signalements", libelle: "Signalements" }, { valeur: "tableau", libelle: "Tableau d'honneur" }]} />
        {partie === "signalements" && <Onglets libelle="Filtrer par statut" valeur={statut} onChange={setStatut} options={[{ valeur: "", libelle: "Tous" }, ...STATUTS_SECURITE]} />}
      </div>
      {message && <p role="status" className="mb-4 rounded-xl bg-vert-clair px-4 py-2 text-sm font-semibold text-vert">{message}</p>}
      {partie === "signalements" ? (
        <>
          <MessageErreur erreur={signalements.erreur} reessayer={signalements.recharger} />
          {!signalements.donnees && signalements.chargement && <Chargement />}
          {signalements.donnees?.signalements.length === 0 && <Carte><EtatVide emoji="🐛" titre="Aucun signalement">Les failles signalées par le formulaire de sosmiam.fr/securite arrivent ici.</EtatVide></Carte>}
          <ul className="grid gap-3">
            {signalements.donnees?.signalements.map((s) => <CarteSignalementSecurite key={`${s.id}-${s.statut}-${s.gravite}-${s.auTableauHonneur}-${s.badgeDonne}`} signalement={s} onChange={apres} />)}
          </ul>
        </>
      ) : (
        <>
          <MessageErreur erreur={tableau.erreur} reessayer={tableau.recharger} />
          {!tableau.donnees && tableau.chargement && <Chargement />}
          {tableau.donnees && (
            <Carte titre={`Tableau d'honneur (${tableau.donnees.entrees.length})`} sansMarge>
              {tableau.donnees.entrees.length === 0 ? (
                <EtatVide emoji="🏅" titre="Personne pour l'instant">Le nom d'une personne y entre quand tu coches « Au tableau d'honneur » sur son signalement.</EtatVide>
              ) : (
                <ul>
                  {tableau.donnees.entrees.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 border-b border-ligne/70 px-5 py-2.5 text-sm last:border-0">
                      <span className="flex-1 font-semibold">{e.nom}</span>
                      <span className="text-gris">{e.mois}{e.signalementId ? "" : " · signalement effacé"}</span>
                      <Bouton petit variante="danger" icone={Trash2} onClick={() => window.confirm(`Retirer « ${e.nom} » du tableau d'honneur ?`) && retirerDuTableauHonneur(e.id).then(() => apres("Nom retiré du tableau d'honneur"), tableau.recharger)}>
                        Retirer
                      </Bouton>
                    </li>
                  ))}
                </ul>
              )}
            </Carte>
          )}
        </>
      )}
    </>
  );
}
