import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { AppState, Text, View } from "react-native";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Recommandation, Sortie } from "@sos-miam/commun/types/potes";
import { Bouton } from "~/composants/interface/Bouton";
import { BoutonVoirPlus } from "~/composants/interface/BoutonVoirPlus";
import { MenuOptions, type OptionMenu } from "~/composants/interface/MenuOptions";
import { CarteSortie } from "~/composants/potes/CarteSortie";
import { RecommandationsRecues } from "~/composants/potes/RecommandationsRecues";
import { annoncerLecteurEcran } from "~/fonctions/interaction/annoncer-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserPagination } from "~/hooks/utiliser-pagination";

type Props = {
  /** Lieux reçus de tes potes, déjà limités à ceux que tu peux voir */
  recommandations: Recommandation[];
  /** Lieux que tu peux voir (sans les bars sous 18 ans), par identifiant */
  lieux: ReadonlyMap<number, Lieu>;
  /** Après un retrait : le bandeau « Retiré · Annuler » de l'écran */
  onRetire: (texte: string, annuler: () => void) => void;
};

// Une sortie reste « à venir » quelques heures après son début (le temps du repas)
const DUREE_SORTIE = 4 * 3_600_000;
// L'heure de l'onglet avance toute seule : une fin de vote passe sans qu'il faille changer d'onglet
const RAFRAICHISSEMENT = 30_000;
// À venir : 5, puis 5 de plus ; déjà vécues : 3, puis 5 de plus
const NOM = { un: "sortie", des: "sorties" };

/**
 * Onglet « Sorties » : les lieux reçus de tes potes, tes sorties à venir, « Nouvelle sortie », puis les sorties passées, par
 * morceaux (« Voir plus »). Le « ⋯ » d'une sortie à venir la quitte (après confirmation) ; celui d'une sortie passée la retire de
 * tes sorties, pour toi seulement (« Annuler » la remet).
 */
export function SectionSorties({ recommandations, lieux, onRetire }: Props) {
  const router = useRouter();
  const { sorties, potes, quitterSortie, masquer, demasquer } = utiliserCommunaute();
  const [maintenant, setMaintenant] = useState(() => new Date());
  const [menuPour, setMenuPour] = useState<{ sortie: Sortie; passee: boolean } | null>(null);

  // Tant que l'onglet est affiché, et dès qu'on revient dans l'app : la fin du vote et le lieu retenu restent justes
  useFocusEffect(
    useCallback(() => {
      setMaintenant(new Date());
      const minuterie = setInterval(() => setMaintenant(new Date()), RAFRAICHISSEMENT);
      const abonnement = AppState.addEventListener("change", (etat) => {
        if (etat === "active") setMaintenant(new Date());
      });
      return () => {
        clearInterval(minuterie);
        abonnement.remove();
      };
    }, []),
  );

  const instant = maintenant.getTime();
  const aVenir = sorties.filter((s) => new Date(s.quand).getTime() + DUREE_SORTIE >= instant);
  // Les plus récentes d'abord
  const passees = sorties.filter((s) => new Date(s.quand).getTime() + DUREE_SORTIE < instant).reverse();
  const ouvrir = (id: string) => router.push({ pathname: "/potes/sortie/[id]", params: { id } });
  const pagesAVenir = utiliserPagination(aVenir, 5, 5, (x) => x.id);
  const pagesPassees = utiliserPagination(passees, 3, 5, (x) => x.id);

  const options = (choix: { sortie: Sortie; passee: boolean } | null): OptionMenu[] => {
    if (!choix) return [];
    const { sortie, passee } = choix;
    const voir: OptionMenu = { cle: "ouvrir", emoji: "👀", titre: "Ouvrir la sortie", detail: "Le vote, les lieux proposés et la discussion", agir: () => ouvrir(sortie.id) };
    if (passee) {
      return [voir, {
        cle: "retirer", emoji: "🧹", titre: "Retirer de tes sorties", detail: "Elle disparaît d'ici, pour toi seulement : tes potes la gardent",
        agir: () => {
          masquer(sortie.id);
          onRetire("Sortie retirée", () => demasquer(sortie.id));
        },
      }];
    }
    return [voir, {
      cle: "quitter", emoji: "👋", titre: "Quitter la sortie", detail: "Tu ne verras plus le vote ni la discussion",
      // Mêmes mots que sur l'écran de la sortie
      confirmation: {
        titre: "Quitter la sortie ?",
        detail: sortie.organisateur === ID_MOI
          ? "Tu organises cette sortie : tes potes la garderont sans toi, et tu ne verras plus le vote ni la discussion."
          : "Tu ne verras plus le vote ni la discussion de cette sortie.",
        confirmer: "Quitter",
        rester: "Je reste",
      },
      agir: () => {
        quitterSortie(sortie.id);
        // La carte disparaît, sans « Annuler » (on ne rejoint pas une sortie qu'on a quittée) : on le dit, une fois la feuille partie
        setTimeout(() => annoncerLecteurEcran(retirerEmoji(`Tu as quitté « ${sortie.titre} »`)), 500);
      },
    }];
  };

  return (
    <View className="gap-8">
      {recommandations.length > 0 ? <RecommandationsRecues recommandations={recommandations} lieux={lieux} onRetire={onRetire} /> : null}

      <View className="gap-3">
        <View>
          <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
            Tes sorties
          </Text>
          <Text className="font-texte text-sm text-gris">Chacun propose ses lieux, tout le monde vote, et c'est plié.</Text>
        </View>

        {aVenir.length === 0 ? (
          <View className="items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-8">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-4xl">
              🗓️
            </Text>
            <Text className="text-center font-texte-gras text-base text-encre">Rien de prévu pour l'instant</Text>
            <Text className="text-center font-texte text-base leading-6 text-gris">
              {lierPonctuation(
                potes.length > 0
                  ? "Ton agenda est plus vide qu'un frigo un dimanche soir. Lance une sortie : tes potes votent pour le lieu, fini les « on va où ? » qui durent trois jours."
                  : "Ajoute d'abord un pote ou deux : une sortie en solo, c'est juste un dîner (très bien aussi, remarque).",
              )}
            </Text>
          </View>
        ) : (
          pagesAVenir.visibles.map((s) => (
            <CarteSortie
              key={s.id}
              sortie={s}
              lieux={lieux}
              passee={false}
              maintenant={maintenant}
              onOuvrir={ouvrir}
              onMenu={() => setMenuPour({ sortie: s, passee: false })}
              refPrincipal={pagesAVenir.refDe(s.id)}
            />
          ))
        )}
        <BoutonVoirPlus restants={pagesAVenir.restants} prochains={pagesAVenir.prochains} nom={NOM} onVoirPlus={pagesAVenir.voirPlus} />

        {potes.length > 0 ? (
          <Bouton
            libelle="Nouvelle sortie"
            indice="Choisis tes potes et propose des lieux, puis tout le monde vote"
            onPress={() => router.push("/potes/nouvelle-sortie")}
            className="mt-2"
          />
        ) : (
          <Bouton libelle="Ajouter un pote" indice="Par son pseudo, ton lien ou ton QR code" onPress={() => router.push("/potes/ajouter")} className="mt-2" />
        )}
      </View>

      {passees.length > 0 ? (
        <View className="gap-3">
          <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
            Déjà vécues
          </Text>
          {pagesPassees.visibles.map((s) => (
            <CarteSortie
              key={s.id}
              sortie={s}
              lieux={lieux}
              passee
              maintenant={maintenant}
              onOuvrir={ouvrir}
              onMenu={() => setMenuPour({ sortie: s, passee: true })}
              refPrincipal={pagesPassees.refDe(s.id)}
            />
          ))}
          <BoutonVoirPlus restants={pagesPassees.restants} prochains={pagesPassees.prochains} nom={NOM} onVoirPlus={pagesPassees.voirPlus} />
        </View>
      ) : null}

      <MenuOptions visible={menuPour !== null} titre={menuPour ? `${menuPour.sortie.emoji} ${menuPour.sortie.titre}` : ""} options={options(menuPour)} onFermer={() => setMenuPour(null)} />
    </View>
  );
}
