import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { AppState, Text, View } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Recommandation, Sortie } from "@sos-miam/commun/types/potes";
import { Bouton } from "~/composants/interface/Bouton";
import { BoutonVoirPlus } from "~/composants/interface/BoutonVoirPlus";
import { MenuOptions, type OptionMenu } from "~/composants/interface/MenuOptions";
import { CarteInvitationSortie } from "~/composants/potes/CarteInvitationSortie";
import { CarteSortie } from "~/composants/potes/CarteSortie";
import { RecommandationsRecues } from "~/composants/potes/RecommandationsRecues";
import { TEXTES_ONGLET_SORTIES_PAR_LANGUE } from "~/contenus/textes-onglet-sorties";
import { annoncerLecteurEcran } from "~/fonctions/interaction/annoncer-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserPagination } from "~/hooks/utiliser-pagination";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** Lieux reçus de tes potes, déjà limités à ceux que tu peux voir */
  recommandations: Recommandation[];
  /** Lieux connus de l'app, par identifiant */
  lieux: ReadonlyMap<number, Lieu>;
  /** Après un retrait : le bandeau « Retiré · Annuler » de l'écran */
  onRetire: (texte: string, annuler: () => void) => void;
};

// Une sortie reste « à venir » quelques heures après son début (le temps du repas)
const DUREE_SORTIE = 4 * 3_600_000;
// L'heure de l'onglet avance toute seule : une fin de vote passe sans qu'il faille changer d'onglet
const RAFRAICHISSEMENT = 30_000;

/**
 * Onglet « Sorties » : les lieux reçus de tes potes, les invitations qui attendent ta réponse (« Tu viens ? »), tes sorties à venir, « Nouvelle sortie », puis les sorties passées, par
 * morceaux (« Voir plus »). Le « ⋯ » d'une sortie à venir la quitte (après confirmation) ; celui d'une sortie passée la retire de
 * tes sorties, pour toi seulement (« Annuler » la remet).
 */
export function SectionSorties({ recommandations, lieux, onRetire }: Props) {
  const router = useRouter();
  const T = utiliserTextes(TEXTES_ONGLET_SORTIES_PAR_LANGUE).sorties;
  const { sorties, potes, invitationsSorties, quitterSortie, masquer, demasquer } = utiliserCommunaute();
  const monId = utiliserMonId();
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
  // À venir : 5, puis 5 de plus ; déjà vécues : 3, puis 5 de plus
  const pagesAVenir = utiliserPagination(aVenir, 5, 5, (x) => x.id);
  const pagesPassees = utiliserPagination(passees, 3, 5, (x) => x.id);

  const options = (choix: { sortie: Sortie; passee: boolean } | null): OptionMenu[] => {
    if (!choix) return [];
    const { sortie, passee } = choix;
    const voir: OptionMenu = { cle: "ouvrir", emoji: "👀", titre: T.ouvrir, detail: T.ouvrirDetail, agir: () => ouvrir(sortie.id) };
    if (passee) {
      return [voir, {
        cle: "retirer", emoji: "🧹", titre: T.retirer, detail: T.retirerDetail,
        agir: () => {
          masquer("sortie", sortie.id);
          onRetire(T.retiree, () => demasquer("sortie", sortie.id));
        },
      }];
    }
    return [voir, {
      cle: "quitter", emoji: "👋", titre: T.quitter, detail: T.quitterDetail,
      // Mêmes mots que sur l'écran de la sortie
      confirmation: {
        titre: T.quitterTitre,
        detail: sortie.organisateur === monId ? T.quitterOrganisateur : T.quitterParticipant,
        confirmer: T.quitterConfirmer,
        rester: T.quitterRester,
      },
      agir: () => {
        quitterSortie(sortie.id);
        // La carte disparaît, sans « Annuler » (on ne rejoint pas une sortie qu'on a quittée) : on le dit, une fois la feuille partie
        setTimeout(() => annoncerLecteurEcran(retirerEmoji(T.quittee(sortie.titre))), 500);
      },
    }];
  };

  return (
    <View className="gap-8">
      {recommandations.length > 0 ? <RecommandationsRecues recommandations={recommandations} lieux={lieux} onRetire={onRetire} /> : null}

      <View className="gap-3">
        <View>
          <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
            {T.titre}
          </Text>
          <Text className="font-texte text-sm text-gris">{T.sousTitre}</Text>
        </View>

        {invitationsSorties.map((invitation) => (
          <CarteInvitationSortie key={invitation.id} invitation={invitation} />
        ))}

        {aVenir.length === 0 && invitationsSorties.length > 0 ? null : aVenir.length === 0 ? (
          <View className="items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-8">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-4xl">
              🗓️
            </Text>
            <Text className="text-center font-texte-gras text-base text-encre">{T.videTitre}</Text>
            <Text className="text-center font-texte text-base leading-6 text-gris">
              {lierPonctuation(potes.length > 0 ? T.videAvecPotes : T.videSansPotes)}
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
        <BoutonVoirPlus restants={pagesAVenir.restants} prochains={pagesAVenir.prochains} nom={T.nom} onVoirPlus={pagesAVenir.voirPlus} />

        {potes.length > 0 ? (
          <Bouton
            libelle={T.nouvelle}
            indice={T.nouvelleIndice}
            onPress={() => router.push("/potes/nouvelle-sortie")}
            className="mt-2"
          />
        ) : (
          <Bouton libelle={T.ajouterPote} indice={T.ajouterPoteIndice} onPress={() => router.push("/potes/ajouter")} className="mt-2" />
        )}
      </View>

      {passees.length > 0 ? (
        <View className="gap-3">
          <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
            {T.passees}
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
          <BoutonVoirPlus restants={pagesPassees.restants} prochains={pagesPassees.prochains} nom={T.nom} onVoirPlus={pagesPassees.voirPlus} />
        </View>
      ) : null}

      <MenuOptions visible={menuPour !== null} titre={menuPour ? `${menuPour.sortie.emoji} ${menuPour.sortie.titre}` : ""} options={options(menuPour)} onFermer={() => setMenuPour(null)} />
    </View>
  );
}
