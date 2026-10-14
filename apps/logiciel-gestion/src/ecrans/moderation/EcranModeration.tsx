import { RotateCw } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { ChoixEnPastilles } from "~/composants/interface/ChoixEnPastilles.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { CIBLES_MODERATION } from "~/contenus/cibles-moderation.ts";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerSignalements, type Signalement, type VueModeration } from "~/services/moderation.ts";
import { CarteContenuSignale } from "./CarteContenuSignale.tsx";

/** Regroupe les signalements par contenu visé : on juge une publication, pas chaque signalement. */
function regrouper(signalements: Signalement[]) {
  const groupes = new Map<string, Signalement[]>();
  for (const signalement of signalements) {
    const cle = `${signalement.cible}|${signalement.cibleId}`;
    groupes.set(cle, [...(groupes.get(cle) ?? []), signalement]);
  }
  return [...groupes.values()];
}

/** File de modération : les signalements de l'app, les graves (publication masquée pour tous) en tête. */
export function EcranModeration() {
  const [statut, setStatut] = useState<VueModeration>("a-traiter");
  const [cible, setCible] = useState("");
  const { donnees, erreur, chargement, recharger } = utiliserChargement(() => listerSignalements(statut, cible), [statut, cible]);
  const groupes = donnees ? regrouper(donnees.signalements) : [];

  return (
    <>
      <EnTeteEcran
        titre="Modération"
        sousTitre="Pour « Violence ou contenu sexuel », le contenu est masqué pour tout le monde dès le premier signalement, en attendant ta décision. Un commentaire, un message ou une liste se juge sur sa copie prise au moment du signalement : jamais sur le contenu vivant."
        actions={<Bouton icone={RotateCw} chargement={chargement && !!donnees} onClick={recharger}>Actualiser</Bouton>}
      />
      <div className="mb-5 grid gap-3">
        <ChoixEnPastilles
          libelle="Contenu"
          valeur={cible}
          onChange={setCible}
          options={[{ valeur: "", libelle: "Tout" }, ...Object.entries(CIBLES_MODERATION).map(([valeur, c]) => ({ valeur, libelle: `${c.emoji} ${c.libelle}` }))]}
        />
        <Onglets
          libelle="Signalements"
          valeur={statut}
          onChange={setStatut}
          options={[
            { valeur: "a-traiter", libelle: "À traiter", compteur: donnees?.compteurs["a-traiter"] },
            { valeur: "retenu", libelle: "Retenus" },
            { valeur: "rejete", libelle: "Rejetés" },
            { valeur: "conteste", libelle: "Contestés", compteur: donnees?.compteurs.conteste },
          ]}
        />
      </div>
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {donnees && groupes.length === 0 && (
        <Carte>
          <EtatVide emoji={statut === "a-traiter" ? "😌" : "🗂️"} titre={statut === "a-traiter" ? "Rien à traiter" : "Rien ici pour l'instant"}>
            {statut === "a-traiter"
              ? "Aucun signalement en attente. Ils arriveront ici quand l'app enverra ses signalements au serveur, et une notification Windows te préviendra pour les plus graves."
              : "Les décisions prises s'affichent ici, avec ta note."}
          </EtatVide>
        </Carte>
      )}
      <div className="grid gap-4">
        {groupes.map((groupe) => <CarteContenuSignale key={`${groupe[0]!.cible}|${groupe[0]!.cibleId}`} signalements={groupe} lieux={donnees?.lieux ?? {}} onDecide={recharger} />)}
      </div>
    </>
  );
}
