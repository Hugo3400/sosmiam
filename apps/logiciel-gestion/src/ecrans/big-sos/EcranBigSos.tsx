import { Plus, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerBigSos, type PhaseBigSos } from "~/services/big-sos.ts";
import { CarteBigSos } from "./CarteBigSos.tsx";
import { FicheBigSos } from "./FicheBigSos.tsx";
import { ModaleNouveauBigSos } from "./ModaleNouveauBigSos.tsx";

type Vue = "a-traiter" | "en-cours" | "termines";
const VUES: Record<Vue, PhaseBigSos[]> = {
  "a-traiter": ["demande", "verification", "vote", "a-cloturer"],
  "en-cours": ["programme", "a-la-une"],
  termines: ["termine", "refuse"],
};

/** Les BIG SOS : un lieu en vraie difficulté, à la une pendant 7 jours. De la demande au bilan. */
export function EcranBigSos({ ouvrir }: { ouvrir?: { id: number } | null }) {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(listerBigSos, []);
  const [vue, setVue] = useState<Vue>("a-traiter");
  const [ouvert, setOuvert] = useState<number | null>(null);
  // Ouvert depuis ailleurs (recherche Ctrl+K…) sur un élément précis
  useEffect(() => {
    if (ouvrir) setOuvert(ouvrir.id);
  }, [ouvrir]);
  const [creation, setCreation] = useState(false);
  const compter = (v: Vue) => donnees?.filter((b) => VUES[v].includes(b.phase)).length;
  const liste = donnees?.filter((b) => VUES[vue].includes(b.phase)) ?? [];

  return (
    <>
      <EnTeteEcran
        titre="BIG SOS"
        sousTitre="Un lieu en vraie difficulté passe à la une 7 jours : vérification sur place par un ambassadeur, vote de la communauté (avec l'app), ta validation, puis le bilan. On en parle avec dignité."
        actions={
          <>
            <Bouton icone={RotateCw} chargement={chargement && !!donnees} onClick={recharger}>Actualiser</Bouton>
            <Bouton variante="principal" icone={Plus} onClick={() => setCreation(true)}>Nouveau BIG SOS</Bouton>
          </>
        }
      />
      <div className="mb-5">
        <Onglets
          libelle="BIG SOS"
          valeur={vue}
          onChange={setVue}
          options={[
            { valeur: "a-traiter", libelle: "À traiter", compteur: compter("a-traiter") },
            { valeur: "en-cours", libelle: "Programmés et à la une", compteur: compter("en-cours") },
            { valeur: "termines", libelle: "Terminés et refusés" },
          ]}
        />
      </div>
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {donnees && liste.length === 0 && (
        <Carte>
          <EtatVide emoji="🛟" titre={vue === "a-traiter" ? "Rien à traiter" : vue === "en-cours" ? "Aucun BIG SOS en cours" : "Rien ici pour l'instant"}>
            Les demandes arriveront de l'espace pro et des ambassadeurs. En attendant, tu peux en ouvrir un toi-même avec « Nouveau BIG SOS ».
          </EtatVide>
        </Carte>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        {liste.map((bigSos) => <CarteBigSos key={bigSos.id} bigSos={bigSos} onOuvrir={() => setOuvert(bigSos.id)} />)}
      </div>
      {creation && <ModaleNouveauBigSos onFermer={() => setCreation(false)} onCree={(id) => { setCreation(false); recharger(); setOuvert(id); }} />}
      {ouvert !== null && <FicheBigSos id={ouvert} onFermer={() => { setOuvert(null); recharger(); }} onChange={recharger} />}
    </>
  );
}
