import { useState } from "react";

import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { FONDATEURS_EN_PREPARATION } from "~/contenus/ambassadeurs.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerCandidatures, type Candidature } from "~/services/ambassadeurs.ts";
import { CarteCandidature } from "./CarteCandidature.tsx";

/** Les candidatures au titre d'ambassadeur fondateur : 10 places, numérotées dans l'ordre des acceptations. */
type Props = { onOuvrirCompte: (compteId: number) => void; tour: number; onDecision: () => void };

export function ListeCandidatures({ onOuvrirCompte, tour, onDecision }: Props) {
  const [statut, setStatut] = useState<Candidature["statut"]>("en-attente");
  const [bilan, setBilan] = useState<string | null>(null);
  const { donnees, erreur, chargement, recharger } = utiliserChargement(() => listerCandidatures(statut), [statut, tour]);
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Onglets
          libelle="Candidatures"
          valeur={statut}
          onChange={setStatut}
          options={[{ valeur: "en-attente", libelle: "À décider" }, { valeur: "acceptee", libelle: "Acceptées" }, { valeur: "refusee", libelle: "Refusées" }]}
        />
        {!FONDATEURS_EN_PREPARATION && <p className="text-sm text-gris">10 places de fondateur : chaque acceptation donne le numéro libre suivant et le badge 🏅 Fondateur.</p>}
      </div>
      {FONDATEURS_EN_PREPARATION && (
        <p role="note" className="rounded-xl border-2 border-encre bg-jaune-clair px-4 py-3 text-sm font-semibold">
          🏗️ Nouvelle version par ville en préparation : n'accepte personne pour l'instant. Les candidatures restent ouvertes et
          seront reprises dans la ville (ou le département) de chaque personne, avec des places selon la taille des villes.
        </p>
      )}
      {bilan && <p role="status" className="rounded-xl bg-vert-clair px-4 py-2 text-sm font-semibold text-vert">{bilan}</p>}
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {donnees && donnees.length === 0 && (
        <Carte>
          <EtatVide emoji="🏅" titre={statut === "en-attente" ? "Aucune candidature à décider" : "Rien ici pour l'instant"}>
            Les ambassadeurs candidatent depuis leur espace : leurs 3 pépites, ce qu'ils aimeraient faire, et pourquoi eux.
          </EtatVide>
        </Carte>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        {donnees?.map((candidature) => <CarteCandidature key={candidature.id} candidature={candidature} onChange={(texte) => { setBilan(texte); recharger(); onDecision(); }} onOuvrirCompte={onOuvrirCompte} />)}
      </div>
    </div>
  );
}
