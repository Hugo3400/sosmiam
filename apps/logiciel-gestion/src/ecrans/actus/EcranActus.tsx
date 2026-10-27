import { RotateCw } from "lucide-react";
import { useEffect, useState } from "react";

import type { StatutArticleActus } from "../../../../../packages/commun/src/types/actus.ts";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { TEXTES_ACTUS as T, VUES_ACTUS, type VueActus } from "~/contenus/actus.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { lireFileActus, type ArticleARelire, type ReponseLieuARelire } from "~/services/actus.ts";
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
};

export function EcranActus() {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(lireFileActus, []);
  const [articles, setArticles] = useState<ArticleARelire[]>([]);
  const [reponses, setReponses] = useState<ReponseLieuARelire[]>([]);
  const [vue, setVue] = useState<VueActus>("a-relire");
  const [choisi, setChoisi] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!donnees) return;
    setArticles(donnees.articles);
    setReponses(donnees.reponses);
  }, [donnees]);

  if (!donnees) return chargement ? <Chargement /> : <MessageErreur erreur={erreur} reessayer={recharger} />;

  const aRelire = reponses.filter((reponse) => reponse.statut === "en-relecture");
  const liste = vue === "reponses" ? [] : articles.filter((article) => article.statut === STATUT_DE_LA_VUE[vue]);
  const actuel = liste.find((article) => article.id === choisi) ?? liste[0] ?? null;
  const compteur = (valeur: VueActus) =>
    valeur === "reponses" ? aRelire.length : valeur === "a-relire" ? articles.filter((article) => article.statut === "en-relecture").length : undefined;
  const maintenant = () => new Date().toISOString();

  function changerArticle(article: ArticleARelire, modification: Partial<ArticleARelire>, texte: string) {
    setArticles((avant) => avant.map((a) => (a.id === article.id ? { ...a, ...modification } : a)));
    setChoisi(null);
    setMessage(texte);
  }

  function changerReponse(reponse: ReponseLieuARelire, statut: ReponseLieuARelire["statut"], texte: string) {
    setReponses((avant) => avant.map((r) => (r.id === reponse.id ? { ...r, statut } : r)));
    setMessage(texte);
  }

  const vide = T.vides[vue];

  return (
    <>
      <EnTeteEcran titre={T.titre} sousTitre={T.sousTitre} actions={<Bouton icone={RotateCw} onClick={recharger}>{T.actualiser}</Bouton>} />
      {donnees.exemple && <p className="mb-4 rounded-xl bg-jaune-clair px-4 py-2 text-sm">{T.exemple}</p>}
      {message && <p role="status" className="mb-4 rounded-xl bg-vert-clair px-4 py-2 text-sm font-semibold text-vert">{message}</p>}
      <Onglets
        libelle={T.titre}
        valeur={vue}
        options={VUES_ACTUS.map(({ valeur, libelle }) => ({ valeur, libelle, compteur: compteur(valeur) }))}
        onChange={(valeur) => {
          setVue(valeur);
          setChoisi(null);
          setMessage(null);
        }}
      />
      <div className="mt-5">
        {vue === "reponses" ? (
          aRelire.length === 0 ? <EtatVide emoji={vide.emoji} titre={vide.titre} /> : (
            <ReponsesLieuxActus
              reponses={aRelire}
              onPublier={(reponse) => changerReponse(reponse, "publie", T.fait.reponsePubliee(reponse.lieu.nom))}
              onRefuser={(reponse) => changerReponse(reponse, "refuse", T.fait.reponseRefusee(reponse.lieu.nom))}
            />
          )
        ) : !actuel ? <EtatVide emoji={vide.emoji} titre={vide.titre} /> : (
          <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_270px]">
            <ListeArticlesActus articles={liste} choisi={actuel.id} onChoisir={setChoisi} />
            <ApercuArticleActus article={actuel} />
            {actuel.statut === "en-relecture" ? (
              <PanneauRelectureActus
                key={actuel.id}
                onPublier={() => changerArticle(actuel, { statut: "publie", publieLe: maintenant() }, T.fait.publie(actuel.titre))}
                onRetoucher={(texte) => changerArticle(actuel, { statut: "a-retoucher", renvoye: false, retouche: { message: texte, le: maintenant() } }, T.fait.retouche(actuel.titre))}
                onRefuser={(refus) => changerArticle(actuel, { statut: "refuse", refus: { ...refus, le: maintenant(), contestation: null } }, T.fait.refuse(actuel.titre))}
              />
            ) : <SuiviArticleActus article={actuel} />}
          </div>
        )}
      </div>
    </>
  );
}
