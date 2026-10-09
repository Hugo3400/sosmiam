import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { ListePartagee } from "@sos-miam/commun/types/potes";
import { Bouton } from "~/composants/interface/Bouton";
import { BoutonVoirPlus } from "~/composants/interface/BoutonVoirPlus";
import { CarteListe } from "~/composants/potes/CarteListe";
import { FeuilleNouvelleListe } from "~/composants/potes/FeuilleNouvelleListe";
import { MenuContenuPote, type ContenuPote } from "~/composants/potes/MenuContenuPote";
import { publicationsExemples } from "~/contenus/publications-exemples";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserPagination } from "~/hooks/utiliser-pagination";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";
import { utiliserVoitEnEntier } from "~/hooks/utiliser-voit-en-entier";

type Props = {
  /** Lieux que tu peux voir (sans les bars sous 18 ans), par identifiant */
  lieux: ReadonlyMap<number, Lieu>;
  /** Après un retrait : le bandeau « Retiré · Annuler » de l'écran */
  onRetire: (texte: string, annuler: () => void) => void;
};

// 5 listes par section, puis 5 de plus à chaque « Voir plus »
const PAR_PAGE = 5;
const NOM = { un: "liste", des: "listes" };

/**
 * Onglet « Listes » : tes listes, celles que tu suis, celles de ta bande et des personnes que tu suis à découvrir (avec leur « ⋯ » :
 * ne plus suivre ou « Pas intéressé », profil, signaler, bloquer), et « Nouvelle liste ». Chaque section par morceaux (« Voir plus »).
 */
export function SectionListes({ lieux, onRetire }: Props) {
  const router = useRouter();
  const { listes, potes, bloques, trouverPote, basculerSuiviListe, estMasque, masquer, demasquer } = utiliserCommunaute();
  const { estMasquee } = utiliserActivite();
  // Abonnements acceptés seulement (déjà sans les personnes bloquées) : leurs listes passent dans « À découvrir »
  const { abonnements } = utiliserSuivisPersonnes();
  // Comme sur son profil : les listes d'un compte privé ajouté par son pseudo (sans son accord) ne s'affichent pas
  const voitEnEntier = utiliserVoitEnEntier();
  const [creation, setCreation] = useState(false);
  const [menuPour, setMenuPour] = useState<ContenuPote | null>(null);
  const publications = publicationsExemples.filter((p) => !estMasquee(p.id));

  // Rien de la part des personnes bloquées (les listes signalées, elles, sont déjà retirées par la communauté)
  const visibles = listes.filter((l) => !bloques.some((b) => b.id === l.auteur));
  const miennes = visibles.filter((l) => l.auteur === ID_MOI);
  const suivies = visibles.filter((l) => l.auteur !== ID_MOI && l.abonnes.includes(ID_MOI));
  const aDecouvrir = visibles.filter(
    (l) =>
      l.auteur !== ID_MOI &&
      // « Pas intéressé » : elle sort d'ici (et reste sur le profil de son auteur)
      !estMasque(l.id) &&
      !l.abonnes.includes(ID_MOI) &&
      !!voitEnEntier?.(l.auteur) &&
      (potes.some((p) => p.id === l.auteur) || abonnements.some((a) => a.pote.id === l.auteur)),
  );

  const parId = (l: ListePartagee) => l.id;
  const pagesMiennes = utiliserPagination(miennes, PAR_PAGE, PAR_PAGE, parId);
  const pagesSuivies = utiliserPagination(suivies, PAR_PAGE, PAR_PAGE, parId);
  const pagesADecouvrir = utiliserPagination(aDecouvrir, PAR_PAGE, PAR_PAGE, parId);
  const boutonVoirPlus = (pages: ReturnType<typeof utiliserPagination<ListePartagee>>) => (
    <BoutonVoirPlus restants={pages.restants} prochains={pages.prochains} nom={NOM} onVoirPlus={pages.voirPlus} />
  );

  // Le choix propre à la section : ne plus suivre une liste suivie, ou écarter une liste à découvrir
  const suivieOuverte = menuPour ? suivies.some((l) => l.id === menuPour.id) : false;
  const actionsListe = menuPour
    ? [
        suivieOuverte
          ? {
              cle: "ne-plus-suivre",
              emoji: "👋",
              titre: "Ne plus suivre cette liste",
              detail: `Elle quitte « Celles que tu suis ». ${menuPour.pote.prenom} n'en saura rien.`,
              agir: () => {
                const id = menuPour.id;
                basculerSuiviListe(id);
                onRetire("Tu ne suis plus cette liste", () => basculerSuiviListe(id));
              },
            }
          : {
              cle: "pas-interesse",
              emoji: "🙈",
              titre: "Pas intéressé",
              detail: `Elle disparaît de « À découvrir », pour toi seulement. Elle reste sur le profil de ${menuPour.pote.prenom}.`,
              agir: () => {
                const id = menuPour.id;
                masquer(id);
                onRetire("Liste retirée", () => demasquer(id));
              },
            },
      ]
    : undefined;

  const ouvrir = (id: string) => router.push({ pathname: "/potes/liste/[id]", params: { id } });
  // La carte d'une liste, dans sa section (sa pagination y pose la ref du lecteur d'écran)
  const carte = (pages: { refDe: (k: string) => (vue: View | null) => void }) => (liste: ListePartagee) => {
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
        refPrincipal={pages.refDe(liste.id)}
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
          pagesMiennes.visibles.map(carte(pagesMiennes))
        )}
        {boutonVoirPlus(pagesMiennes)}
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
          pagesSuivies.visibles.map(carte(pagesSuivies))
        )}
        {boutonVoirPlus(pagesSuivies)}
      </View>

      {aDecouvrir.length > 0 ? (
        <View className="gap-3">
          <View>
            <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
              À découvrir
            </Text>
            <Text className="font-texte text-sm text-gris">Les bonnes adresses de ta bande et des gens que tu suis, à piocher sans complexe.</Text>
          </View>
          {pagesADecouvrir.visibles.map(carte(pagesADecouvrir))}
          {boutonVoirPlus(pagesADecouvrir)}
        </View>
      ) : null}

      <MenuContenuPote contenu={menuPour} actionsEnPlus={actionsListe} onFermer={() => setMenuPour(null)} />

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
