import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, Share, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { calculerMinutesLecture } from "@sos-miam/commun/fonctions/actus/calculer-minutes-lecture";
import type { LieuCiteActus } from "@sos-miam/commun/types/actus";
import { ActionsArticle } from "~/composants/actus/ActionsArticle";
import { AuteurArticle } from "~/composants/actus/AuteurArticle";
import { CommentairesArticle } from "~/composants/actus/CommentairesArticle";
import { CorpsArticle } from "~/composants/actus/CorpsArticle";
import { CouvertureArticle } from "~/composants/actus/CouvertureArticle";
import { LieuCiteArticle } from "~/composants/actus/LieuCiteArticle";
import { MotDuLieu } from "~/composants/actus/MotDuLieu";
import { BarreEtatTheme } from "~/composants/interface/BarreEtatTheme";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/textes-actus";
import { ecrireDateArticle } from "~/fonctions/actus/ecrire-date-article";
import { ouvrirItineraire } from "~/fonctions/lieux/ouvrir-itineraire";
import { utiliserActus } from "~/hooks/utiliser-actus";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserFermerPile } from "~/hooks/utiliser-fermer-pile";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export default function EcranArticleActus() {
  const couleurs = utiliserCouleurs();
  const marges = useSafeAreaInsets();
  const router = useRouter();
  const fermer = utiliserFermerPile();
  const T = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const { id } = useLocalSearchParams<{ id: string }>();
  const actus = utiliserActus();
  const article = actus.trouver(Number(id));
  const { lieux } = utiliserLieux();
  const positions = useMemo(() => new Map(lieux.map((l) => [l.id, l.position ?? null])), [lieux]);
  const [aime, setAime] = useState(false);

  if (!article) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
        <BarreEtatTheme />
        <Text className="px-6 pt-16 text-center font-texte text-base leading-6 text-gris">{T.article.introuvable}</Text>
      </SafeAreaView>
    );
  }

  const A = T.article;
  const minutes = calculerMinutesLecture(article.paragraphes);
  const villes = [...new Set(article.lieux.map((l) => l.ville))].join(", ");
  const date = ecrireDateArticle(article.publieLe, langue);
  const voir = (lieu: LieuCiteActus) => router.push({ pathname: "/lieu/[id]", params: { id: String(lieu.id) } });
  const yAller = (lieu: LieuCiteActus) => void ouvrirItineraire({ nom: lieu.nom, ville: lieu.ville, position: positions.get(lieu.id) ?? null });
  const envoyer = () => void Share.share({ message: A.partage(article.titre) }).catch(() => {});
  const classement = article.rubrique === "top-quartier";

  return (
    <View style={{ flex: 1, backgroundColor: couleurs.creme }}>
      <BarreEtatTheme />
      <ScrollView contentContainerStyle={{ paddingBottom: marges.bottom + 32 }}>
        <CouvertureArticle source={article.couverture} haut={marges.top} retour={A.retour} onRetour={fermer} />
        <View className="gap-6 px-5 pt-5">
          <View className="gap-3">
            <Text className="font-texte-gras text-xs uppercase tracking-wide text-gris">{T.rubriques[article.rubrique]}</Text>
            <Text accessibilityRole="header" className="font-titre text-[30px] leading-[34px] text-encre">
              {article.titre}
            </Text>
            <Text className="font-texte-moyen text-[17px] leading-6 text-gris">{article.accroche}</Text>
            {article.collaboration ? (
              <Text className="self-start rounded-md border border-gris px-2 py-0.5 font-texte-gras text-xs text-gris">{T.collaboration}</Text>
            ) : null}
            {article.finLe ? <Text className="font-texte-gras text-sm text-encre">{A.finLe(ecrireDateArticle(article.finLe, langue))}</Text> : null}
            <AuteurArticle auteur={article.auteur} ambassadeur={T.ambassadeur} details={`${villes} · ${date} · ${T.minutesLecture(minutes)}`} />
          </View>

          <CorpsArticle paragraphes={article.paragraphes} citation={article.citation} photos={article.photos} photoLu={A.photoLu} />

          {article.alcool ? <MentionPrevention variante="bloc" /> : null}

          <View className="gap-3">
            <Text accessibilityRole="header" className="font-titre-gras text-lg text-encre">
              {A.lieuxTitre(article.lieux.length)}
            </Text>
            {article.lieux.map((lieu, i) => (
              <LieuCiteArticle key={lieu.id} lieu={lieu} rang={classement ? i + 1 : null} T={A} onVoir={voir} onYAller={yAller} />
            ))}
          </View>

          {article.reponseLieu ? <MotDuLieu reponse={article.reponseLieu} titre={A.motDuLieu(article.reponseLieu.nomLieu)} mention={A.reponseRelue} /> : null}

          <Text className="font-texte text-[13px] leading-5 text-gris">
            {`${A.relu(date)} ${article.collaboration ? A.collaborationOui(article.auteur.prenom) : A.collaborationNon(article.auteur.prenom)}`}
          </Text>

          <ActionsArticle
            jaime={article.jaime + (aime ? 1 : 0)}
            aime={aime}
            commentaires={article.commentaires}
            T={A}
            onAimer={() => setAime((a) => !a)}
            onEnvoyer={envoyer}
          />

          <CommentairesArticle commentaires={actus.commentaires(article.id)} auteurId={article.auteur.id} titre={A.commentaires(article.commentaires)} plume={A.plume} />
        </View>
      </ScrollView>
    </View>
  );
}
