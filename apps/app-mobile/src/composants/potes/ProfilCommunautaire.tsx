import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { calculerPalier } from "@sos-miam/commun/regles/calculer-palier";
import type { Pote } from "@sos-miam/commun/types/potes";
import { RondPote } from "~/composants/potes/RondPote";
import { VignetteCollection } from "~/composants/profil/VignetteCollection";
import { badges } from "~/contenus/badges";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { publicationsExemples } from "~/contenus/publications-exemples";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserProfil } from "~/hooks/utiliser-profil";

type Props = {
  pote: Pote;
  /** Ton propre profil (« moi ») : les textes te parlent directement */
  estMoi: boolean;
  /** Profil réservé à sa bande (un mineur vu par un adulte qui n'en fait pas partie) : seulement l'avatar, le prénom et le pseudo */
  reserve?: boolean;
};

/**
 * Le profil d'une personne tel que ses potes le voient : avatar, prénom, @pseudo et ville, palier Ambassadeur et points,
 * badges obtenus, lieux sauvés et gardés (vignettes vers les fiches). Les lieux que ton âge ne permet pas (bars) ne s'affichent pas.
 */
export function ProfilCommunautaire({ pote, estMoi, reserve = false }: Props) {
  const router = useRouter();
  const { profil } = utiliserProfil();
  const { estMasquee } = utiliserActivite();
  const age = profil ? calculerAge(profil.dateNaissance) : null;
  const { actuel } = calculerPalier(pote.points);

  const enTete = (
    <View className="items-center gap-1 pt-2">
      <View className="mb-2">
        <RondPote pote={pote} taille={96} />
      </View>
      <Text accessibilityRole="header" className="text-center font-titre text-3xl text-encre">
        {estMoi ? `${pote.prenom} (toi)` : pote.prenom}
      </Text>
      {pote.pseudo ? (
        <Text className="text-center font-texte-semi text-base text-encre">@{pote.pseudo}</Text>
      ) : estMoi ? (
        <Text className="text-center font-texte text-base text-gris">Pas encore de pseudo</Text>
      ) : null}
      {pote.ville && !reserve ? (
        <Text accessibilityLabel={pote.ville} className="text-center font-texte text-base text-gris">
          📍 {pote.ville}
        </Text>
      ) : null}
    </View>
  );
  if (reserve) return enTete;

  const lieux = filtrerLieuxSelonAge(lieuxExemples, age);
  // Une publication signalée ou « Pas intéressé » ne sert pas de vignette (comme dans ta collection)
  const publications = publicationsExemples.filter((p) => !estMasquee(p.id));
  const obtenus = badges.filter((b) => pote.badges.includes(b.id));
  const sauves = pote.lieuxSauves.flatMap((id) => lieux.filter((l) => l.id === id));
  const gardes = pote.gardes.flatMap((id) => lieux.filter((l) => l.id === id));

  const grilles = [
    {
      cle: "sauves",
      emoji: "🛟",
      titre: "Lieux sauvés",
      lieux: sauves,
      vide: estMoi ? "Pas encore de lieu sauvé : donne une rescousse dans le fil, il t'attendra ici." : `${pote.prenom} n'a pas encore sauvé de lieu. Ça viendra !`,
    },
    {
      cle: "gardes",
      emoji: "🔖",
      titre: "Adresses gardées",
      lieux: gardes,
      vide: estMoi ? "Garde une adresse dans le fil : ton futur toi affamé te dira merci." : `Pas encore d'adresse gardée pour ${pote.prenom}.`,
    },
  ];

  return (
    <View className="gap-6">
      {enTete}

      <View
        accessible
        accessibilityLabel={`${estMoi ? "Ton" : "Son"} palier Ambassadeur : ${actuel.nom}, ${pote.points} point${pote.points > 1 ? "s" : ""}, dont ${pote.pointsDuMois} ce mois-ci`}
        className="flex-row items-center gap-3 rounded-carte border-2 border-encre bg-white p-4"
      >
        <Text className="text-4xl">{actuel.emoji}</Text>
        <View className="flex-1">
          <Text className="font-texte-semi text-sm text-gris">Palier Ambassadeur</Text>
          <Text className="font-titre text-xl text-encre">{actuel.nom}</Text>
          <Text className="font-texte text-sm text-gris">+{pote.pointsDuMois} ce mois-ci</Text>
        </View>
        <View className="rounded-full border-2 border-encre bg-jaune px-3 py-1">
          <Text className="font-texte-gras text-sm text-encre">{pote.points} pts</Text>
        </View>
      </View>

      <View className="gap-3">
        <Text accessibilityRole="header" accessibilityLabel={`Badges obtenus, ${obtenus.length}`} className="font-titre-gras text-xl text-encre">
          Badges ({obtenus.length})
        </Text>
        {obtenus.length === 0 ? (
          <Text className="font-texte text-sm leading-5 text-gris">
            {lierPonctuation(estMoi ? "Pas encore de badge : ta première rescousse t'en offre un !" : `Pas encore de badge pour ${pote.prenom}.`)}
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
                  libelle={`${lieu.nom}, ${lieu.quartier}, ${lieu.ville}`}
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
