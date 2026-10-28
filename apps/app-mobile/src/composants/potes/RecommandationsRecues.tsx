import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Recommandation } from "@sos-miam/commun/types/potes";
import { BoutonVoirPlus } from "~/composants/interface/BoutonVoirPlus";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { CarteRecommandation } from "~/composants/potes/CarteRecommandation";
import { MenuContenuPote, type ContenuPote } from "~/composants/potes/MenuContenuPote";
import { TEXTES_ONGLET_SORTIES_PAR_LANGUE } from "~/contenus/textes-onglet-sorties";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserPagination } from "~/hooks/utiliser-pagination";
import { utiliserPublications } from "~/hooks/utiliser-publications";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** Lieux reçus, du plus récent au plus ancien, déjà limités à ceux que tu peux voir (sans ceux que tu as signalés) */
  recommandations: Recommandation[];
  /** Lieux connus de l'app, par identifiant */
  lieux: ReadonlyMap<number, Lieu>;
  /** Après un retrait : le bandeau « Retiré · Annuler » de l'écran */
  onRetire: (texte: string, annuler: () => void) => void;
};

// Les nouveaux d'abord, puis les plus récents : 3, puis 5 de plus à chaque « Voir plus »
const PREMIERS = 3;
const PAR_PAGE = 5;

/**
 * Les lieux que tes potes t'ont envoyés : les nouveaux sont mis en avant ; en ouvrir un l'ouvre en fiche et le marque comme vu.
 * Chacun se retire par son « ⋯ » (pour toi seulement), ceux déjà vus d'un coup ; « Annuler » les remet.
 */
export function RecommandationsRecues({ recommandations, lieux, onRetire }: Props) {
  const router = useRouter();
  const T = utiliserTextes(TEXTES_ONGLET_SORTIES_PAR_LANGUE).recus;
  const { trouverPote, marquerRecommandationVue, retirerRecommandations, remettreRecommandations } = utiliserCommunaute();
  const { estMasquee } = utiliserActivite();
  const { publications: toutesLesPublications } = utiliserPublications();
  const [menuPour, setMenuPour] = useState<ContenuPote | null>(null);
  // Les lieux déjà vus au moment de demander (le texte de la feuille ne bouge pas pendant qu'elle se referme)
  const [nettoyage, setNettoyage] = useState<{ ids: string[]; ouvert: boolean }>({ ids: [], ouvert: false });
  // Chacun de son côté reste du plus récent au plus ancien
  const ordre = useMemo(() => [...recommandations.filter((r) => !r.vue), ...recommandations.filter((r) => r.vue)], [recommandations]);
  const pages = utiliserPagination(ordre, PREMIERS, PAR_PAGE, (r) => r.id);
  // Une publication signalée ou « Pas intéressé » ne sert pas de vignette
  const publications = toutesLesPublications.filter((p) => !estMasquee(p.id));

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
          {T.titre}
        </Text>
        <Text className="font-texte text-sm text-gris">
          {nouvelles > 0 ? T.nouveaux(nouvelles) : T.sousTitre}
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

      <BoutonVoirPlus restants={pages.restants} prochains={pages.prochains} nom={T.nom} onVoirPlus={pages.voirPlus} />

      {vues.length > 1 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityHint={T.retirerVusIndice}
          onPress={() => {
            vibrerLegerement();
            setNettoyage({ ids: vues.map((r) => r.id), ouvert: true });
          }}
          className="min-h-11 items-center justify-center self-center px-4 active:opacity-70"
        >
          <Text className="font-texte-semi text-[15px] text-gris underline">{T.retirerVus(vues.length)}</Text>
        </Pressable>
      ) : null}

      <MenuContenuPote
        contenu={menuPour}
        actionsEnPlus={
          menuPour
            ? [{
                cle: "retirer",
                emoji: "🧹",
                titre: T.retirerTitre,
                detail: T.retirerDetail(menuPour.pote.prenom),
                agir: () => retirer([menuPour.id], T.retire),
              }]
            : undefined
        }
        onFermer={() => setMenuPour(null)}
      />

      <FeuilleConfirmation
        visible={nettoyage.ouvert}
        emoji="🧹"
        titre={T.nettoyageTitre(nettoyage.ids.length)}
        detail={T.nettoyageDetail}
        libelleConfirmer={T.nettoyageConfirmer}
        libelleRester={T.nettoyageRester}
        onConfirmer={() => retirer(nettoyage.ids, T.retires(nettoyage.ids.length))}
        onFermer={() => setNettoyage((n) => ({ ...n, ouvert: false }))}
      />
    </View>
  );
}
