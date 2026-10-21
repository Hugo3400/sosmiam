import { Plus, RotateCw } from "lucide-react";
import { useState } from "react";

import type { OffreCarriereGestion, StatutCandidature } from "../../../../../packages/commun/src/types/carriere.ts";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { STATUTS_CANDIDATURE } from "~/contenus/carriere.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerCandidaturesCarriere, listerOffresCarriere } from "~/services/carriere.ts";
import { CarteCandidature } from "./CarteCandidature.tsx";
import { CarteOffre } from "./CarteOffre.tsx";
import { FormulaireOffre } from "./FormulaireOffre.tsx";

export function EcranCarriere({ onDecision }: { onDecision: () => void }) {
  const [partie, setPartie] = useState<"offres" | "candidatures">("offres");
  const [offreChoisie, setOffreChoisie] = useState("");
  const [statut, setStatut] = useState<StatutCandidature | "">("");
  const [ouverte, setOuverte] = useState<OffreCarriereGestion | "nouvelle" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const offres = utiliserChargement(listerOffresCarriere, []);
  const candidatures = utiliserChargement(() => (partie === "candidatures" ? listerCandidaturesCarriere(offreChoisie, statut) : Promise.resolve(null)), [partie, offreChoisie, statut]);
  const apres = (texte: string) => (setOuverte(null), setMessage(texte), offres.recharger(), candidatures.recharger(), onDecision());
  const nouvelles = offres.donnees?.offres.reduce((n, o) => n + o.nouvelles, 0) ?? 0;

  return (
    <>
      <EnTeteEcran
        titre="Carrière"
        sousTitre="Les offres de la page Carrière de sosmiam.fr (bénévolat, freelance ou mission) et les candidatures reçues, effacées 6 mois après leur envoi."
        actions={
          <>
            <Bouton icone={RotateCw} onClick={() => (offres.recharger(), candidatures.recharger())}>Actualiser</Bouton>
            <Bouton variante="principal" icone={Plus} onClick={() => setOuverte("nouvelle")}>Nouvelle offre</Bouton>
          </>
        }
      />
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <Onglets libelle="Partie" valeur={partie} onChange={setPartie} options={[{ valeur: "offres", libelle: "Offres" }, { valeur: "candidatures", libelle: "Candidatures", compteur: nouvelles || undefined }]} />
        {partie === "candidatures" && (
          <>
            <Selecteur libelle="Offre" valeur={offreChoisie} onChange={setOffreChoisie} options={[{ valeur: "", libelle: "Toutes les offres" }, ...(offres.donnees?.offres ?? []).map((o) => ({ valeur: o.id, libelle: o.titre }))]} className="w-64" />
            <Selecteur libelle="Statut" valeur={statut} onChange={setStatut} options={[{ valeur: "", libelle: "Tous" }, ...STATUTS_CANDIDATURE]} className="w-44" />
          </>
        )}
      </div>
      {message && <p role="status" className="mb-4 rounded-xl bg-vert-clair px-4 py-2 text-sm font-semibold text-vert">{message}</p>}
      {partie === "offres" ? (
        <>
          <MessageErreur erreur={offres.erreur} reessayer={offres.recharger} />
          {!offres.donnees && offres.chargement && <Chargement />}
          {offres.donnees?.offres.length === 0 && <Carte><EtatVide emoji="💼" titre="Pas encore d'offre">Une offre de bénévolat ou de mission s'écrit ici, puis se publie sur sosmiam.fr.</EtatVide></Carte>}
          <ul className="grid gap-3 xl:grid-cols-2">
            {offres.donnees?.offres.map((o) => (
              <CarteOffre key={o.id} offre={o} onModifier={() => setOuverte(o)} onVoirCandidatures={() => (setOffreChoisie(o.id), setPartie("candidatures"))} onChange={apres} />
            ))}
          </ul>
        </>
      ) : (
        <>
          <MessageErreur erreur={candidatures.erreur} reessayer={candidatures.recharger} />
          {!candidatures.donnees && candidatures.chargement && <Chargement />}
          {candidatures.donnees?.candidatures.length === 0 && <Carte><EtatVide emoji="📬" titre="Pas de candidature">Les candidatures envoyées depuis la page Carrière arrivent ici.</EtatVide></Carte>}
          <ul className="grid gap-3 xl:grid-cols-2">
            {candidatures.donnees?.candidatures.map((c) => <CarteCandidature key={`${c.id}-${c.statut}`} candidature={c} onChange={apres} />)}
          </ul>
        </>
      )}
      {ouverte && <FormulaireOffre offre={ouverte === "nouvelle" ? null : ouverte} onFermer={() => setOuverte(null)} onEnregistree={apres} />}
    </>
  );
}
