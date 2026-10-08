import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { ListePartagee } from "@sos-miam/commun/types/potes";
import { Bouton } from "~/composants/interface/Bouton";
import { CarteListe } from "~/composants/potes/CarteListe";
import { FeuilleNouvelleListe } from "~/composants/potes/FeuilleNouvelleListe";
import { MenuContenuPote, type ContenuPote } from "~/composants/potes/MenuContenuPote";
import { publicationsExemples } from "~/contenus/publications-exemples";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";

type Props = {
  /** Lieux que tu peux voir (sans les bars sous 18 ans), par identifiant */
  lieux: ReadonlyMap<number, Lieu>;
};

/** Onglet « Listes » : tes listes, celles que tu suis, celles de ta bande à découvrir (avec leur « ⋯ » : profil, signaler, bloquer), et « Nouvelle liste ». */
export function SectionListes({ lieux }: Props) {
  const router = useRouter();
  const { listes, potes, bloques, trouverPote } = utiliserCommunaute();
  const { estMasquee } = utiliserActivite();
  const [creation, setCreation] = useState(false);
  const [menuPour, setMenuPour] = useState<ContenuPote | null>(null);
  const publications = publicationsExemples.filter((p) => !estMasquee(p.id));

  // Rien de la part des personnes bloquées (les listes signalées, elles, sont déjà retirées par la communauté)
  const visibles = listes.filter((l) => !bloques.some((b) => b.id === l.auteur));
  const miennes = visibles.filter((l) => l.auteur === ID_MOI);
  const suivies = visibles.filter((l) => l.auteur !== ID_MOI && l.abonnes.includes(ID_MOI));
  const aDecouvrir = visibles.filter((l) => l.auteur !== ID_MOI && !l.abonnes.includes(ID_MOI) && potes.some((p) => p.id === l.auteur));

  const ouvrir = (id: string) => router.push({ pathname: "/potes/liste/[id]", params: { id } });
  const carte = (liste: ListePartagee) => {
    const auteur = liste.auteur === ID_MOI ? null : trouverPote(liste.auteur);
    return (
      <CarteListe
        key={liste.id}
        liste={liste}
        auteur={liste.auteur === ID_MOI ? "toi" : (auteur?.prenom ?? "un pote")}
        lieux={liste.lieux.flatMap((id) => {
          const lieu = lieux.get(id);
          return lieu ? [{ lieu, image: trouverVignetteLieu(id, publications) }] : [];
        })}
        onOuvrir={ouvrir}
        onMenu={auteur ? () => setMenuPour({ cible: "liste", id: liste.id, pote: auteur }) : undefined}
      />
    );
  };

  return (
    <View className="gap-8">
      <View className="gap-3">
        <View>
          <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
            Tes listes
          </Text>
          <Text className="font-texte text-sm text-gris">Tes adresses chouchous, rangées par envie.</Text>
        </View>
        {miennes.length === 0 ? (
          <View className="items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-6">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-3xl">
              📋
            </Text>
            <Text className="text-center font-texte text-base leading-6 text-gris">
              {lierPonctuation("Pas encore de liste. « Terrasses au soleil », « Fin de mois serrée »… à toi de jouer !")}
            </Text>
          </View>
        ) : (
          miennes.map(carte)
        )}
        <Bouton libelle="Nouvelle liste" indice="Choisis un emoji et un nom, puis ajoute tes lieux" onPress={() => setCreation(true)} className="mt-2" />
      </View>

      <View className="gap-3">
        <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
          Celles que tu suis
        </Text>
        {suivies.length === 0 ? (
          <Text className="font-texte text-base leading-6 text-gris">
            {lierPonctuation("Tu ne suis aucune liste pour l'instant. Ouvre celle d'un pote et suis-la : elle t'attendra ici.")}
          </Text>
        ) : (
          suivies.map(carte)
        )}
      </View>

      {aDecouvrir.length > 0 ? (
        <View className="gap-3">
          <View>
            <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
              Chez tes potes
            </Text>
            <Text className="font-texte text-sm text-gris">Leurs bonnes adresses, à piocher sans complexe.</Text>
          </View>
          {aDecouvrir.map(carte)}
        </View>
      ) : null}

      <MenuContenuPote contenu={menuPour} onFermer={() => setMenuPour(null)} />

      <FeuilleNouvelleListe
        visible={creation}
        onFermer={() => setCreation(false)}
        onCreee={(id) => {
          setCreation(false);
          ouvrir(id);
        }}
      />
    </View>
  );
}
