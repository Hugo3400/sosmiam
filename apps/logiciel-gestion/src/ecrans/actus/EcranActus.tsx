import { RotateCw } from "lucide-react";
import { useState } from "react";

import type { StatutArticleActus } from "../../../../../packages/commun/src/types/actus.ts";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { TEXTES_ACTUS as T, VUES_ACTUS, type VueActus } from "~/contenus/actus.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import {
  lireFileActus,
  publierArticleActus,
  publierReponseActus,
  refuserArticleActus,
  refuserReponseActus,
  retoucherArticleActus,
} from "~/services/actus.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { ApercuArticleActus } from "./ApercuArticleActus.tsx";
import { ListeArticlesActus } from "./ListeArticlesActus.tsx";
import { PanneauRelectureActus } from "./PanneauRelectureActus.tsx";
import { ReponsesLieuxActus } from "./ReponsesLieuxActus.tsx";
import { SuiviArticleActus } from "./SuiviArticleActus.tsx";

const STATUT_DE_LA_VUE: Record<Exclude<VueActus, "reponses">, StatutArticleActus> = {
  "a-relire": "en-relecture",
  "a-retoucher": "a-retoucher",
  publies: "publie",
  refuses: "refuse",
  retires: "retire",
  supprimes: "supprime",
};

export function EcranActus({ onDecision }: { onDecision: () => void }) {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(lireFileActus, []);
  const [vue, setVue] = useState<VueActus>("a-relire");
  const [choisi, setChoisi] = useState<number | null>(null);
  const [retour, setRetour] = useState<{ texte: string; erreur: boolean } | null>(null);
  const [enCours, setEnCours] = useState(false);

  if (!donnees) return chargement ? <Chargement /> : <MessageErreur erreur={erreur} reessayer={recharger} />;

  const { articles, reponses } = donnees;
  const aRelire = reponses.filter((reponse) => reponse.statut === "en-relecture");
  const liste = vue === "reponses" ? [] : articles.filter((article) => article.statut === STATUT_DE_LA_VUE[vue]);
  const actuel = liste.find((article) => article.id === choisi) ?? liste[0] ?? null;
  const compteur = (valeur: VueActus) =>
    valeur === "reponses" ? aRelire.length : valeur === "a-relire" ? articles.filter((article) => article.statut === "en-relecture").length : undefined;

  async function decider(action: () => Promise<unknown>, texte: string) {
    setEnCours(true);
    setRetour(null);
    try {
      await action();
      setChoisi(null);
      setRetour({ texte, erreur: false });
      recharger();
      onDecision();
    } catch (probleme) {
      const code = probleme instanceof ErreurApi ? probleme.code : null;
      const connue = code === "deja-decide" || code === "article-introuvable" || code === "introuvable";
      setRetour({ texte: connue ? T.erreurs[code] : expliquerErreur(probleme instanceof ErreurApi ? probleme : null), erreur: true });
      if (connue) {
        recharger();
        onDecision();
      }
    } finally {
      setEnCours(false);
    }
  }

  const vide = T.vides[vue];

  return (
    <>
      <EnTeteEcran titre={T.titre} sousTitre={T.sousTitre} actions={<Bouton icone={RotateCw} chargement={chargement} onClick={recharger}>{T.actualiser}</Bouton>} />
      {retour && (
        <p role={retour.erreur ? "alert" : "status"} className={`mb-4 rounded-xl px-4 py-2 text-sm font-semibold ${retour.erreur ? "bg-rose-alerte text-rouge-texte" : "bg-vert-clair text-vert"}`}>
          {retour.texte}
        </p>
      )}
      <Onglets
        libelle={T.titre}
        valeur={vue}
        options={VUES_ACTUS.map(({ valeur, libelle }) => ({ valeur, libelle, compteur: compteur(valeur) }))}
        onChange={(valeur) => {
          setVue(valeur);
          setChoisi(null);
          setRetour(null);
        }}
      />
      <div className="mt-5">
        {vue === "reponses" ? (
          aRelire.length === 0 ? <EtatVide emoji={vide.emoji} titre={vide.titre} /> : (
            <ReponsesLieuxActus
              reponses={aRelire}
              enCours={enCours}
              onPublier={(reponse) => decider(() => publierReponseActus(reponse.id), T.fait.reponsePubliee(reponse.lieu.nom))}
              onRefuser={(reponse, refus) => decider(() => refuserReponseActus(reponse.id, refus), T.fait.reponseRefusee(reponse.lieu.nom))}
            />
          )
        ) : !actuel ? <EtatVide emoji={vide.emoji} titre={vide.titre} /> : (
          <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_270px]">
            <ListeArticlesActus articles={liste} choisi={actuel.id} onChoisir={setChoisi} />
            <ApercuArticleActus article={actuel} />
            {actuel.statut === "en-relecture" ? (
              <PanneauRelectureActus
                key={actuel.id}
                alcoolRepere={actuel.alcool}
                enCours={enCours}
                onPublier={(publication) => decider(() => publierArticleActus(actuel.id, publication), T.fait.publie(actuel.titre, publication.aLaUne))}
                onRetoucher={(message) => decider(() => retoucherArticleActus(actuel.id, message), T.fait.retouche(actuel.titre))}
                onRefuser={(refus) => decider(() => refuserArticleActus(actuel.id, refus), T.fait.refuse(actuel.titre))}
              />
            ) : <SuiviArticleActus article={actuel} />}
          </div>
        )}
      </div>
    </>
  );
}
