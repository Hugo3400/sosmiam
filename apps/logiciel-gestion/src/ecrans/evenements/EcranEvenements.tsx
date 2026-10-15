import { RotateCw } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { Pagination } from "~/composants/interface/Pagination.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerEvenements, type VueEvenements } from "~/services/evenements.ts";
import { CarteEvenement } from "./CarteEvenement.tsx";

/** Les événements publiés par les lieux (concerts, quiz, dégustations…) : les voir, et suspendre celui qui pose problème. */
export function EcranEvenements() {
  const [vue, setVue] = useState<VueEvenements>("a-venir");
  const [ville, setVille] = useState("");
  const [page, setPage] = useState(1);
  const { donnees, erreur, chargement, recharger } = utiliserChargement(() => listerEvenements({ vue, ville: ville.trim(), page }), [vue, ville, page]);
  return (
    <>
      <EnTeteEcran
        titre="Événements"
        sousTitre="Ce que les lieux publient dans l'app : concerts, quiz, dégustations… Suspendre en cache un tout de suite, sans rien effacer."
        actions={<Bouton icone={RotateCw} chargement={chargement && !!donnees} onClick={recharger}>Actualiser</Bouton>}
      />
      <div className="mb-5 flex flex-wrap items-end gap-4">
        <Onglets
          libelle="Événements"
          valeur={vue}
          onChange={(v) => (setVue(v), setPage(1))}
          options={[{ valeur: "a-venir", libelle: "À venir" }, { valeur: "passes", libelle: "Passés" }, { valeur: "suspendus", libelle: "Suspendus", compteur: donnees?.suspendus }]}
        />
        <Champ libelle="Ville" valeur={ville} onChange={(v) => (setVille(v), setPage(1))} placeholder="Toutes" className="w-48" />
      </div>
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {donnees && donnees.evenements.length === 0 && (
        <Carte><EtatVide emoji="🎟️" titre="Rien ici">{vue === "suspendus" ? "Aucun événement suspendu." : "Les lieux publient leurs événements depuis l'espace pro ou l'app."}</EtatVide></Carte>
      )}
      <ul className="grid gap-3 xl:grid-cols-2">
        {donnees?.evenements.map((e) => <CarteEvenement key={e.id} evenement={e} onChange={recharger} />)}
      </ul>
      {donnees && donnees.total > donnees.parPage && <div className="mt-4"><Pagination page={page} parPage={donnees.parPage} total={donnees.total} onChange={setPage} /></div>}
    </>
  );
}
