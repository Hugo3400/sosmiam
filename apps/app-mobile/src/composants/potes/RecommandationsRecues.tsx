import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Recommandation } from "@sos-miam/commun/types/potes";
import { CarteRecommandation } from "~/composants/potes/CarteRecommandation";
import { MenuContenuPote, type ContenuPote } from "~/composants/potes/MenuContenuPote";
import { publicationsExemples } from "~/contenus/publications-exemples";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";

type Props = {
  /** Lieux reçus, du plus récent au plus ancien, déjà limités à ceux que tu peux voir (sans ceux que tu as signalés) */
  recommandations: Recommandation[];
  /** Lieux que tu peux voir (sans les bars sous 18 ans), par identifiant */
  lieux: ReadonlyMap<number, Lieu>;
};

// Au-delà, les plus anciens attendent derrière « Voir les autres »
const NOMBRE_VISIBLE = 3;

/** Les lieux que tes potes t'ont envoyés : les nouveaux sont mis en avant ; en ouvrir un l'ouvre en fiche et le marque comme vu. */
export function RecommandationsRecues({ recommandations, lieux }: Props) {
  const router = useRouter();
  const { trouverPote, marquerRecommandationVue } = utiliserCommunaute();
  const { estMasquee } = utiliserActivite();
  const [tout, setTout] = useState(false);
  const [menuPour, setMenuPour] = useState<ContenuPote | null>(null);
  // Une publication signalée ou « Pas intéressé » ne sert pas de vignette
  const publications = publicationsExemples.filter((p) => !estMasquee(p.id));

  const nouvelles = recommandations.filter((r) => !r.vue).length;
  const affichees = tout ? recommandations : recommandations.slice(0, NOMBRE_VISIBLE);
  const cachees = recommandations.length - affichees.length;

  return (
    <View className="gap-3">
      <View>
        <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
          Reçu de tes potes
        </Text>
        <Text className="font-texte text-sm text-gris">
          {nouvelles > 0 ? `${nouvelles} nouveau${nouvelles > 1 ? "x" : ""} lieu${nouvelles > 1 ? "x" : ""} à découvrir` : "Les bonnes adresses que ta bande t'a envoyées"}
        </Text>
      </View>

      {affichees.map((r) => {
        const de = trouverPote(r.de);
        const lieu = lieux.get(r.lieuId);
        if (!de || !lieu) return null;
        return (
          <CarteRecommandation
            key={r.id}
            recommandation={r}
            de={de}
            lieu={lieu}
            image={trouverVignetteLieu(lieu.id, publications)}
            onOuvrir={() => {
              if (!r.vue) marquerRecommandationVue(r.id);
              router.push({ pathname: "/lieu/[id]", params: { id: String(lieu.id) } });
            }}
            onMenu={() => setMenuPour({ cible: "recommandation", id: r.id, pote: de })}
          />
        );
      })}

      {recommandations.length > NOMBRE_VISIBLE ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            vibrerLegerement();
            setTout(!tout);
          }}
          className="min-h-11 items-center justify-center self-center px-4 active:opacity-70"
        >
          <Text className="font-texte-gras text-[15px] text-encre underline">
            {tout ? "Voir moins" : `Voir ${cachees > 1 ? `les ${cachees} autres` : "l'autre"}`}
          </Text>
        </Pressable>
      ) : null}

      <MenuContenuPote contenu={menuPour} onFermer={() => setMenuPour(null)} />
    </View>
  );
}
