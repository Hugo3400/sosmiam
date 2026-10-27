import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CarteArticleCitantLieu } from "~/composants/actus/CarteArticleCitantLieu";
import { FeuilleReponseActus } from "~/composants/actus/FeuilleReponseActus";
import { Annonce } from "~/composants/interface/Annonce";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { TEXTES_ACTUS_PRO_PAR_LANGUE } from "~/contenus/textes-actus-pro";
import { utiliserActusPro } from "~/hooks/utiliser-actus-pro";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export default function EcranActusPro() {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const T = utiliserTextes(TEXTES_ACTUS_PRO_PAR_LANGUE);
  const { lieuPro } = utiliserModes();
  const { articles, chargement, repondre } = utiliserActusPro(lieuPro?.id ?? null);
  const [cible, setCible] = useState<number | null>(null);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);

  async function envoyer(texte: string) {
    const id = cible;
    setCible(null);
    if (id === null) return;
    const ok = await repondre(id, texte);
    const message = ok ? T.envoyee : T.echec;
    setAnnonce((avant) => ({ texte: message, numero: (avant?.numero ?? 0) + 1 }));
  }

  if (!lieuPro) return null;

  return (
    <>
      <EcranReglage titre={T.titre} sousTitre={T.intro}>
        {!chargement && articles.length === 0 ? <Text className="font-texte text-base leading-6 text-gris">{T.vide}</Text> : null}
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
      <FeuilleReponseActus visible={cible !== null} signature={lieuPro.nom} T={T.feuille} onEnvoyer={(texte) => void envoyer(texte)} onFermer={() => setCible(null)} />
      <Annonce annonce={annonce} haut={marges.top + 12} onFin={finAnnonce} />
    </>
  );
}
