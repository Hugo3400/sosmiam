import { useState } from "react";

import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { FONDATEURS_EN_PREPARATION } from "~/contenus/ambassadeurs.ts";
import { grouperCandidaturesParZone } from "~/fonctions/fondateurs/grouper-candidatures-par-zone.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerCandidatures, type StatutCandidature } from "~/services/fondateurs.ts";
import { CarteCandidature } from "./CarteCandidature.tsx";
import { ZonesFondateurs } from "./ZonesFondateurs.tsx";

type Vue = StatutCandidature | "zones";

const VUES: { valeur: Vue; libelle: string }[] = [
  { valeur: "en-attente", libelle: "À décider" },
  { valeur: "acceptee", libelle: "Fondateurs" },
  { valeur: "zones", libelle: "Places par zone" },
  { valeur: "souvenir", libelle: "Souvenirs" },
  { valeur: "refusee", libelle: "Refusées" },
];

const VIDES: Record<StatutCandidature, string> = {
  "en-attente": "Aucune candidature à décider",
  acceptee: "Pas encore de fondateur",
  souvenir: "Aucun fondateur parti",
  refusee: "Aucune candidature refusée",
};

type Props = { onOuvrirCompte: (compteId: number) => void; tour: number; onDecision: () => void };

/**
 * Les fondateurs par ville (docs/decisions.md) : candidatures à décider, fondateurs en place rangés par zone, places
 * de chaque ville et département, anciens fondateurs partis (souvenirs) et candidatures refusées.
 */
export function ListeCandidatures({ onOuvrirCompte, tour, onDecision }: Props) {
  const [vue, setVue] = useState<Vue>("en-attente");
  const [bilan, setBilan] = useState<string | null>(null);
  const statut = vue === "zones" ? null : vue;
  const { donnees, erreur, chargement, recharger } = utiliserChargement(async () => (statut ? listerCandidatures(statut) : null), [statut, tour]);
  const apresAction = (texte: string) => {
    setBilan(texte);
    recharger();
    onDecision();
  };
  const carte = (candidature: NonNullable<typeof donnees>[number]) => (
    <CarteCandidature key={candidature.id} candidature={candidature} onChange={apresAction} onOuvrirCompte={onOuvrirCompte} />
  );

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Onglets libelle="Fondateurs" valeur={vue} onChange={(nouvelle) => (setVue(nouvelle), setBilan(null))} options={VUES} />
        {!FONDATEURS_EN_PREPARATION && (
          <p className="text-sm text-gris">
            Chaque acceptation donne le numéro suivant de la zone et le numéro national suivant (jamais redonnés), et le badge 🏅 Fondateur.
          </p>
        )}
      </div>
      {FONDATEURS_EN_PREPARATION && (
        <p role="note" className="rounded-xl border-2 border-encre bg-jaune-clair px-4 py-3 text-sm font-semibold">
          🏗️ Fondateurs par ville en préparation : n'accepte ni ne refuse personne pour l'instant. Tu peux déjà ranger chaque
          candidature dans sa ville ou son département (« Choisir sa commune »).
        </p>
      )}
      {bilan && <p role="status" className="rounded-xl bg-vert-clair px-4 py-2 text-sm font-semibold text-vert">{bilan}</p>}
      {vue === "zones" && <ZonesFondateurs tour={tour} />}
      {statut && (
        <>
          <MessageErreur erreur={erreur} reessayer={recharger} />
          {!donnees && chargement && <Chargement />}
          {donnees && donnees.length === 0 && (
            <Carte>
              <EtatVide emoji="🏅" titre={VIDES[statut]}>
                Les ambassadeurs candidatent depuis leur espace, pour leur ville (ou leur département) : leurs 3 pépites, ce
                qu'ils aimeraient faire, et pourquoi eux.
              </EtatVide>
            </Carte>
          )}
          {donnees && donnees.length > 0 && statut === "acceptee" ? (
            grouperCandidaturesParZone(donnees).map(({ zone, candidatures }) => (
              <section key={zone?.code ?? "sans-zone"} className="grid gap-3">
                <h3 className="font-titre text-lg font-extrabold">
                  {zone ? `${zone.nom} · ${candidatures.length} sur ${zone.places} place${zone.places > 1 ? "s" : ""}` : "Sans zone"}
                </h3>
                <div className="grid gap-4 xl:grid-cols-2">{candidatures.map(carte)}</div>
              </section>
            ))
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">{donnees?.map(carte)}</div>
          )}
        </>
      )}
    </div>
  );
}
