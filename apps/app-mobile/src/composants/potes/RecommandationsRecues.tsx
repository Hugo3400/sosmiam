import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Recommandation } from "@sos-miam/commun/types/potes";
import { BoutonVoirPlus } from "~/composants/interface/BoutonVoirPlus";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { CarteRecommandation } from "~/composants/potes/CarteRecommandation";
import { MenuContenuPote, type ContenuPote } from "~/composants/potes/MenuContenuPote";
import { publicationsExemples } from "~/contenus/publications-exemples";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserPagination } from "~/hooks/utiliser-pagination";

type Props = {
  /** Lieux reçus, du plus récent au plus ancien, déjà limités à ceux que tu peux voir (sans ceux que tu as signalés) */
  recommandations: Recommandation[];
  /** Lieux que tu peux voir (sans les bars sous 18 ans), par identifiant */
  lieux: ReadonlyMap<number, Lieu>;
  /** Après un retrait : le bandeau « Retiré · Annuler » de l'écran */
  onRetire: (texte: string, annuler: () => void) => void;
};

// Les nouveaux d'abord, puis les plus récents : 3, puis 5 de plus à chaque « Voir plus »
const PREMIERS = 3;
const PAR_PAGE = 5;
const NOM = { un: "lieu", des: "lieux" };

/**
 * Les lieux que tes potes t'ont envoyés : les nouveaux sont mis en avant ; en ouvrir un l'ouvre en fiche et le marque comme vu.
 * Chacun se retire par son « ⋯ » (pour toi seulement), ceux déjà vus d'un coup ; « Annuler » les remet.
 */
export function RecommandationsRecues({ recommandations, lieux, onRetire }: Props) {
  const router = useRouter();
  const { trouverPote, marquerRecommandationVue, retirerRecommandations, remettreRecommandations } = utiliserCommunaute();
  const { estMasquee } = utiliserActivite();
  const [menuPour, setMenuPour] = useState<ContenuPote | null>(null);
  // Les lieux déjà vus au moment de demander (le texte de la feuille ne bouge pas pendant qu'elle se referme)
  const [nettoyage, setNettoyage] = useState<{ ids: string[]; ouvert: boolean }>({ ids: [], ouvert: false });
  // Chacun de son côté reste du plus récent au plus ancien
  const ordre = useMemo(() => [...recommandations.filter((r) => !r.vue), ...recommandations.filter((r) => r.vue)], [recommandations]);
  const pages = utiliserPagination(ordre, PREMIERS, PAR_PAGE, (r) => r.id);
  // Une publication signalée ou « Pas intéressé » ne sert pas de vignette
  const publications = publicationsExemples.filter((p) => !estMasquee(p.id));

  const nouvelles = recommandations.filter((r) => !r.vue).length;
  const vues = recommandations.filter((r) => r.vue);

  const retirer = (ids: string[], texte: string) => {
    const retirees = retirerRecommandations(ids);
    if (retirees.length > 0) onRetire(texte, () => remettreRecommandations(retirees));
  };

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

      {pages.visibles.map((r) => {
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
            refPrincipal={pages.refDe(r.id)}
          />
        );
      })}

      <BoutonVoirPlus restants={pages.restants} prochains={pages.prochains} nom={NOM} onVoirPlus={pages.voirPlus} />

      {vues.length > 1 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Ils disparaissent d'ici, pour toi seulement"
          onPress={() => {
            vibrerLegerement();
            setNettoyage({ ids: vues.map((r) => r.id), ouvert: true });
          }}
          className="min-h-11 items-center justify-center self-center px-4 active:opacity-70"
        >
          <Text className="font-texte-semi text-[15px] text-gris underline">{`Retirer les ${vues.length} déjà vus`}</Text>
        </Pressable>
      ) : null}

      <MenuContenuPote
        contenu={menuPour}
        actionsEnPlus={
          menuPour
            ? [{
                cle: "retirer",
                emoji: "🧹",
                titre: "Retirer de « Reçu de tes potes »",
                detail: `Il disparaît d'ici, pour toi seulement. ${menuPour.pote.prenom} n'en saura rien.`,
                agir: () => retirer([menuPour.id], "Lieu retiré"),
              }]
            : undefined
        }
        onFermer={() => setMenuPour(null)}
      />

      <FeuilleConfirmation
        visible={nettoyage.ouvert}
        emoji="🧹"
        titre={`Retirer les ${nettoyage.ids.length} lieux déjà vus ?`}
        detail="Ceux que tu as déjà ouverts disparaissent d'ici, pour toi seulement. Les nouveaux restent."
        libelleConfirmer="Retirer"
        libelleRester="Je les garde"
        onConfirmer={() => retirer(nettoyage.ids, `${nettoyage.ids.length} lieux retirés`)}
        onFermer={() => setNettoyage((n) => ({ ...n, ouvert: false }))}
      />
    </View>
  );
}
