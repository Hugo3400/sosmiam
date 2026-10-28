import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { BADGES_PAR_LANGUE } from "@sos-miam/commun/contenus/badges";
import { NOMS_PALIERS_PAR_LANGUE } from "@sos-miam/commun/contenus/noms-paliers";
import { calculerPalier } from "@sos-miam/commun/regles/calculer-palier";
import type { Pote } from "@sos-miam/commun/types/potes";
import type { VisibiliteProfil } from "@sos-miam/commun/types/suivis";
import { RondPote } from "~/composants/potes/RondPote";
import { VignetteCollection } from "~/composants/profil/VignetteCollection";
import { TEXTES_PROFIL_COMMUNAUTAIRE_PAR_LANGUE } from "~/contenus/textes-profil-communautaire";
import { ecrireQuartierVille } from "~/fonctions/lieux/ecrire-quartier-ville";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserPublications } from "~/hooks/utiliser-publications";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  pote: Pote;
  /** Ton propre profil (« moi ») : les textes te parlent directement */
  estMoi: boolean;
  /**
   * Ce qu'on voit de lui (calculerVisibiliteProfil) : « complet » (par défaut) ; « prive » : l'en-tête seul
   * (avatar, prénom, @pseudo et compteurs), sans la ville
   */
  visibilite?: VisibiliteProfil;
  /** Les compteurs d'abonnés et d'abonnements (CompteursSuivi), posés sous la ville ou le @pseudo */
  compteurs?: ReactNode;
  /** Il te suit : pastille « Te suit » à côté du @pseudo */
  teSuit?: boolean;
  /** Les boutons principaux (Suivre, Ajouter à ma bande, Écrire…), posés juste sous l'en-tête, avant le reste du profil */
  actions?: ReactNode;
};

/**
 * Le profil d'une personne tel que ses potes le voient : avatar, prénom, @pseudo et ville, compteurs d'abonnés, palier Ambassadeur
 * et points, badges obtenus, lieux sauvés et gardés (vignettes vers les fiches). Les lieux disparus de l'app ne s'affichent pas.
 * Compte privé : l'en-tête seul.
 */
export function ProfilCommunautaire({ pote, estMoi, visibilite = "complet", compteurs, teSuit = false, actions }: Props) {
  const router = useRouter();
  const T = utiliserTextes(TEXTES_PROFIL_COMMUNAUTAIRE_PAR_LANGUE);
  const BADGES = utiliserTextes(BADGES_PAR_LANGUE);
  const NOMS_PALIERS = utiliserTextes(NOMS_PALIERS_PAR_LANGUE);
  const { estMasquee } = utiliserActivite();
  const { publications: toutesLesPublications } = utiliserPublications();
  const { lieux } = utiliserLieux();
  const { actuel } = calculerPalier(pote.points);
  const nomPalier = NOMS_PALIERS[actuel.cle];
  const complet = estMoi || visibilite === "complet";

  const enTete = (
    <View className="items-center gap-1 pt-2">
      <View className="mb-2">
        <RondPote pote={pote} taille={96} />
      </View>
      <Text
        accessibilityRole="header"
        // La pastille « Te suit » n'est pas lue à part : VoiceOver l'entend avec le prénom (« Sofia, te suit »)
        accessibilityLabel={teSuit && !estMoi ? T.teSuitLu(pote.prenom) : undefined}
        className="text-center font-titre text-3xl text-encre"
      >
        {estMoi ? T.moi(pote.prenom) : pote.prenom}
      </Text>
      {pote.pseudo ? (
        <View className="flex-row flex-wrap items-center justify-center gap-2">
          <Text className="text-center font-texte-semi text-base text-encre">@{pote.pseudo}</Text>
          {teSuit && !estMoi ? (
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="rounded-full border-2 border-encre bg-jaune-clair px-2.5 py-0.5">
              <Text className="font-texte-gras text-xs text-encre">{T.teSuit}</Text>
            </View>
          ) : null}
        </View>
      ) : estMoi ? (
        <Text className="text-center font-texte text-base text-gris">{T.pasDePseudo}</Text>
      ) : null}
      {pote.ville && complet ? (
        <Text accessibilityLabel={pote.ville} className="text-center font-texte text-base text-gris">
          📍 {pote.ville}
        </Text>
      ) : null}
      {compteurs}
    </View>
  );
  if (!complet) {
    return (
      <View className="gap-6">
        {enTete}
        {actions}
      </View>
    );
  }

  // Une publication signalée ou « Pas intéressé » ne sert pas de vignette (comme dans ta collection)
  const publications = toutesLesPublications.filter((p) => !estMasquee(p.id));
  const obtenus = BADGES.filter((b) => pote.badges.includes(b.id));
  const sauves = pote.lieuxSauves.flatMap((id) => lieux.filter((l) => l.id === id));
  const gardes = pote.gardes.flatMap((id) => lieux.filter((l) => l.id === id));

  const grilles = [
    {
      cle: "sauves",
      emoji: "🛟",
      titre: T.sauvesTitre,
      lieux: sauves,
      vide: estMoi ? T.sauvesVideMoi : T.sauvesVideAutre(pote.prenom),
    },
    {
      cle: "gardes",
      emoji: "🔖",
      titre: T.gardesTitre,
      lieux: gardes,
      vide: estMoi ? T.gardesVideMoi : T.gardesVideAutre(pote.prenom),
    },
  ];

  return (
    <View className="gap-6">
      {enTete}
      {actions}

      <View
        accessible
        accessibilityLabel={T.palierLu(estMoi, nomPalier, pote.points, pote.pointsDuMois)}
        className="flex-row items-center gap-3 rounded-carte border-2 border-encre bg-carte p-4"
      >
        <Text className="text-4xl">{actuel.emoji}</Text>
        <View className="flex-1">
          <Text className="font-texte-semi text-sm text-gris">{T.palierTitre}</Text>
          <Text className="font-titre text-xl text-encre">{nomPalier}</Text>
          <Text className="font-texte text-sm text-gris">{T.pointsDuMois(pote.pointsDuMois)}</Text>
        </View>
        <View className="rounded-full border-2 border-encre bg-jaune px-3 py-1">
          <Text className="font-texte-gras text-sm text-nuit">{T.points(pote.points)}</Text>
        </View>
      </View>

      <View className="gap-3">
        <Text accessibilityRole="header" accessibilityLabel={T.badgesLu(obtenus.length)} className="font-titre-gras text-xl text-encre">
          {T.badgesTitre(obtenus.length)}
        </Text>
        {obtenus.length === 0 ? (
          <Text className="font-texte text-sm leading-5 text-gris">
            {lierPonctuation(estMoi ? T.badgesVideMoi : T.badgesVideAutre(pote.prenom))}
          </Text>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {obtenus.map((badge) => (
              <View
                key={badge.id}
                accessible
                accessibilityLabel={`${badge.nom}. ${badge.texte}`}
                className="min-h-11 flex-row items-center gap-1.5 rounded-full border-2 border-encre bg-jaune-clair px-3 py-1.5"
              >
                <Text className="text-base">{badge.emoji}</Text>
                <Text className="font-texte-semi text-sm text-encre">{badge.nom}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {grilles.map((grille) => (
        <View key={grille.cle} className="gap-3">
          <Text accessibilityRole="header" accessibilityLabel={`${grille.titre}, ${grille.lieux.length}`} className="font-titre-gras text-xl text-encre">
            {grille.emoji} {grille.titre} ({grille.lieux.length})
          </Text>
          {grille.lieux.length === 0 ? (
            <View className="rounded-carte border-2 border-dashed border-ligne px-5 py-5">
              <Text className="text-center font-texte text-sm leading-5 text-gris">{lierPonctuation(grille.vide)}</Text>
            </View>
          ) : (
            <View className="-mx-0.5 flex-row flex-wrap">
              {grille.lieux.map((lieu) => (
                <VignetteCollection
                  key={lieu.id}
                  lieu={lieu}
                  image={trouverVignetteLieu(lieu.id, publications)}
                  libelle={`${lieu.nom}, ${ecrireQuartierVille(lieu)}`}
                  onPress={() => router.push({ pathname: "/lieu/[id]", params: { id: String(lieu.id) } })}
                />
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
