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
import { listerMiamSafe, type VueMiamSafe } from "~/services/miam-safe.ts";
import { CarteSignalementMiamSafe } from "./CarteSignalementMiamSafe.tsx";
import { ListeAlertesSansReponse, ListeChartes } from "./ListesMiamSafe.tsx";

const VIDES: Record<VueMiamSafe, { emoji: string; titre: string; texte: string }> = {
  "a-traiter": { emoji: "😌", titre: "Rien à lire", texte: "Aucun signalement Miam Safe en attente. On a promis de les lire sous 48 heures : une notification Windows te prévient dès qu'il en arrive un." },
  traite: { emoji: "🗂️", titre: "Rien ici pour l'instant", texte: "Les signalements traités s'affichent ici, avec ta décision et ta note." },
  alertes: { emoji: "🛟", titre: "Aucune alerte oubliée", texte: "Toutes les alertes silencieuses ont reçu « On arrive » de l'équipe du lieu." },
  chartes: { emoji: "🛡", titre: "Aucune charte signée", texte: "Les gérants signent la charte Miam Safe depuis l'espace pro." },
};

/**
 * Miam Safe : les signalements à lire sous 48 heures (les plus anciens d'abord, en rouge après 48 h), les alertes silencieuses
 * restées sans réponse au comptoir, et les lieux qui ont signé la charte. Rien de tout ça n'est public.
 */
export function EcranMiamSafe() {
  const [vue, setVue] = useState<VueMiamSafe>("a-traiter");
  const { donnees, erreur, chargement, recharger } = utiliserChargement(() => listerMiamSafe(vue), [vue]);
  const compteurs = donnees?.compteurs;
  const nombre = donnees ? (donnees.signalements ?? donnees.alertes ?? donnees.chartes ?? []).length : 0;
  const vide = VIDES[vue];

  return (
    <>
      <EnTeteEcran
        titre="Miam Safe"
        sousTitre="Ce que les Miamis racontent sur un lieu où ils ne se sont pas sentis en sécurité, et les alertes du comptoir restées sans réponse. Jamais affiché sur les fiches. Promis : chaque signalement est lu sous 48 heures."
        actions={<Bouton icone={RotateCw} chargement={chargement && !!donnees} onClick={recharger}>Actualiser</Bouton>}
      />
      <div className="mb-5">
        <Onglets
          libelle="Miam Safe"
          valeur={vue}
          onChange={setVue}
          options={[
            { valeur: "a-traiter", libelle: "À lire", compteur: compteurs?.aTraiter },
            { valeur: "alertes", libelle: "Alertes sans réponse", compteur: compteurs?.sansReponse },
            { valeur: "traite", libelle: "Traités" },
            { valeur: "chartes", libelle: "Chartes", compteur: compteurs?.chartes },
          ]}
        />
      </div>
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {donnees && donnees.vue === vue && nombre === 0 && (
        <Carte>
          <EtatVide emoji={vide.emoji} titre={vide.titre}>{vide.texte}</EtatVide>
        </Carte>
      )}
      {donnees?.vue === vue && donnees.signalements && (
        <div className="grid gap-4">
          {donnees.signalements.map((s) => <CarteSignalementMiamSafe key={s.id} signalement={s} onDecide={recharger} />)}
        </div>
      )}
      {donnees?.vue === vue && donnees.alertes && <ListeAlertesSansReponse alertes={donnees.alertes} onChange={recharger} />}
      {donnees?.vue === vue && donnees.chartes && <ListeChartes chartes={donnees.chartes} onChange={recharger} />}
    </>
  );
}
