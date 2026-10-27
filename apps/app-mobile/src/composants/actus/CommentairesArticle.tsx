import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { CommentaireActus } from "@sos-miam/commun/types/actus";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import { ChampCommentaireActus } from "~/composants/actus/ChampCommentaireActus";
import { FeuilleSignalerArticle, type ChoixSignalementActus } from "~/composants/actus/FeuilleSignalerArticle";
import { LigneCommentaireActus } from "~/composants/actus/LigneCommentaireActus";
import type { TEXTES_ACTUS } from "~/contenus/textes-actus";
import { utiliserCommentairesActus } from "~/hooks/utiliser-commentaires-actus";
import { utiliserCompteRequis } from "~/hooks/utiliser-compte-requis";
import { utiliserProfil } from "~/hooks/utiliser-profil";

type Props = { articleId: number; exemple: boolean; nombre: number; nomLieu: string; T: Traduction<typeof TEXTES_ACTUS>["article"] };

export function CommentairesArticle({ articleId, exemple, nombre, nomLieu, T }: Props) {
  const { profil } = utiliserProfil();
  const exiger = utiliserCompteRequis();
  const { commentaires, aUneSuite, chargerSuite, envoyer, supprimer } = utiliserCommentairesActus(articleId, exemple);
  const [reponseA, setReponseA] = useState<CommentaireActus | null>(null);
  const [signale, setSignale] = useState<ChoixSignalementActus | null>(null);
  const avecCompte = profil !== null;
  const total = Math.max(nombre, commentaires.filter((c) => !c.supprime).length);

  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-titre-gras text-lg text-encre">
        {T.commentaires(total)}
      </Text>
      {commentaires.length === 0 ? <Text className="font-texte text-sm text-gris">{T.commenter.aucun}</Text> : null}
      {commentaires.map((c) => (
        <LigneCommentaireActus
          key={c.id}
          commentaire={c}
          T={T}
          avecCompte={avecCompte}
          onRepondre={() => setReponseA(c)}
          onSupprimer={() => void supprimer(c.id)}
          onSignaler={() => setSignale({ cle: `commentaire-${c.id}`, libelle: T.commenter.sousTitre(c.auteur.prenom), nomLieu, sousTitre: T.commenter.sousTitre(c.auteur.prenom), corps: { cible: "comment-actu", articleId, commentaireId: c.id } })}
        />
      ))}
      {aUneSuite ? (
        <Pressable accessibilityRole="button" onPress={() => void chargerSuite()} className="min-h-11 justify-center self-start active:opacity-70">
          <Text className="font-texte-gras text-sm text-encre underline">{T.commenter.voirPlus}</Text>
        </Pressable>
      ) : null}
      {avecCompte ? (
        <ChampCommentaireActus
          reponseA={reponseA?.auteur.prenom ?? null}
          T={T.commenter}
          onAnnulerReponse={() => setReponseA(null)}
          onEnvoyer={async (texte) => {
            const erreur = await envoyer(texte, reponseA?.id ?? null);
            if (!erreur) setReponseA(null);
            return erreur;
          }}
        />
      ) : (
        <Pressable accessibilityRole="button" onPress={() => void exiger("commenter")} className="min-h-11 justify-center self-start active:opacity-70">
          <Text className="font-texte-gras text-sm text-encre underline">{T.commenter.creerCompte}</Text>
        </Pressable>
      )}
      <FeuilleSignalerArticle visible={signale !== null} choix={signale ? [signale] : []} onFermer={() => setSignale(null)} />
    </View>
  );
}
