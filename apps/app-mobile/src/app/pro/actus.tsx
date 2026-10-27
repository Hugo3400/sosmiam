import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CarteArticleCitantLieu } from "~/composants/actus/CarteArticleCitantLieu";
import { FeuilleReponseActus } from "~/composants/actus/FeuilleReponseActus";
import { Annonce } from "~/composants/interface/Annonce";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { articlesCitantLieuExemples } from "~/contenus/actus-exemples";
import { TEXTES_ACTUS_PRO_PAR_LANGUE } from "~/contenus/textes-actus-pro";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export default function EcranActusPro() {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const T = utiliserTextes(TEXTES_ACTUS_PRO_PAR_LANGUE);
  const { lieuPro } = utiliserModes();
  const [articles, setArticles] = useState(articlesCitantLieuExemples);
  const [cible, setCible] = useState<number | null>(null);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);

  function envoyer(texte: string) {
    const id = cible;
    setCible(null);
    if (id === null) return;
    setArticles((avant) => avant.map((a) => (a.id === id ? { ...a, reponse: { texte, statut: "en-relecture", motif: null, peutReecrire: false } } : a)));
    setAnnonce((avant) => ({ texte: T.envoyee, numero: (avant?.numero ?? 0) + 1 }));
  }

  if (!lieuPro) return null;

  return (
    <>
      <EcranReglage titre={T.titre} sousTitre={T.intro}>
        {articles.length === 0 ? <Text className="font-texte text-base leading-6 text-gris">{T.vide}</Text> : null}
        {articles.map((article) => (
          <CarteArticleCitantLieu
            key={article.id}
            article={article}
            T={T}
            onLire={() => router.push({ pathname: "/actus/[id]", params: { id: String(article.id) } })}
            onRepondre={() => setCible(article.id)}
          />
        ))}
      </EcranReglage>
      <FeuilleReponseActus visible={cible !== null} signature={lieuPro.nom} T={T.feuille} onEnvoyer={envoyer} onFermer={() => setCible(null)} />
      <Annonce annonce={annonce} haut={marges.top + 12} onFin={finAnnonce} />
    </>
  );
}
