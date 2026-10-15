import { RotateCw } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { Pagination } from "~/composants/interface/Pagination.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerAvisARelire } from "~/services/avis.ts";
import { CarteAvisARelire } from "./CarteAvisARelire.tsx";
import { CarteReponseARelire } from "./CarteReponseARelire.tsx";

type Props = { ouvrirCompte: (id: number) => void; onDecision: () => void };

/**
 * Les avis en relecture (filtre, compte neuf, tirage…) et les réponses des lieux, publiées tout de suite puis relues. Les
 * ambassadeurs donnent un avis consultatif ; c'est ici qu'on tranche : publier, ou masquer avec la règle et le pourquoi.
 */
export function EcranAvis({ ouvrirCompte, onDecision }: Props) {
  const [quoi, setQuoi] = useState<"avis" | "reponses">("avis");
  const [page, setPage] = useState(1);
  const { donnees, erreur, chargement, recharger } = utiliserChargement(() => listerAvisARelire(quoi, page), [quoi, page]);
  const decide = () => (recharger(), onDecision());
  const vide = donnees && (quoi === "avis" ? donnees.avis : donnees.reponses).length === 0;
  const total = donnees ? (quoi === "avis" ? donnees.compteurs.avis : donnees.compteurs.reponses) : 0;
  return (
    <>
      <EnTeteEcran
        titre="Avis à relire"
        sousTitre="Publier ne change rien pour personne. Masquer retire l'avis (ou la réponse) avec la règle enfreinte et ton explication : l'auteur peut contester pendant 6 mois, depuis l'app."
        actions={<Bouton icone={RotateCw} chargement={chargement && !!donnees} onClick={recharger}>Actualiser</Bouton>}
      />
      <div className="mb-5">
        <Onglets
          libelle="À relire"
          valeur={quoi}
          onChange={(v) => (setQuoi(v), setPage(1))}
          options={[{ valeur: "avis", libelle: "Avis", compteur: donnees?.compteurs.avis }, { valeur: "reponses", libelle: "Réponses des lieux", compteur: donnees?.compteurs.reponses }]}
        />
      </div>
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {vide && <Carte><EtatVide emoji="⭐" titre="Rien à relire">{quoi === "avis" ? "Les avis relus arrivent ici : un mot filtré, un compte tout neuf, une rafale de notes, un tirage au hasard." : "Les réponses des lieux à leurs avis arrivent ici, déjà en ligne."}</EtatVide></Carte>}
      <ul className="grid gap-3">
        {donnees?.avis.map((a) => <CarteAvisARelire key={a.id} avis={a} onDecide={decide} ouvrirCompte={ouvrirCompte} />)}
        {donnees?.reponses.map((r) => <CarteReponseARelire key={r.id} reponse={r} onDecide={decide} ouvrirCompte={ouvrirCompte} />)}
      </ul>
      {donnees && <div className="mt-4"><Pagination page={page} parPage={donnees.parPage} total={total} onChange={setPage} /></div>}
    </>
  );
}
