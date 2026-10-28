import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, Text, View, type ImageSourcePropType } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { SectionPliable } from "~/composants/interface/SectionPliable";
import { BoutonContour } from "~/composants/profil/BoutonContour";
import { VignetteCollection } from "~/composants/profil/VignetteCollection";
import { TEXTES_COLLECTION_PAR_LANGUE, TEXTES_PROFIL_PAR_LANGUE } from "~/contenus/textes-profil";
import { TEXTES_COLLECTIONS_PROFIL_PAR_LANGUE } from "~/contenus/textes-profil-onglet";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { ecrireQuartierVille } from "~/fonctions/lieux/ecrire-quartier-ville";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";
import { trouverVignettePublication } from "~/fonctions/publications/trouver-vignette-publication";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserPublications } from "~/hooks/utiliser-publications";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** Lieux gardés (🔖), du plus récent au plus ancien */
  gardes: number[];
  /** Publications aimées (❤️), de la plus récente à la plus ancienne */
  jaimes: string[];
};

type Onglet = "gardes" | "jaimes";
type Vignette = { cle: string; lieu: Lieu; image: ImageSourcePropType | null; libelle: string };

const VIGNETTES_VISIBLES = 3;

/** Tes adresses gardées et tes publications aimées, en deux onglets et en grille de 3 colonnes. */
export function CollectionsProfil({ gardes, jaimes }: Props) {
  const router = useRouter();
  const T = utiliserTextes(TEXTES_COLLECTIONS_PROFIL_PAR_LANGUE);
  const textesCollection = utiliserTextes(TEXTES_COLLECTION_PAR_LANGUE);
  const textesProfil = utiliserTextes(TEXTES_PROFIL_PAR_LANGUE);
  const { estMasquee } = utiliserActivite();
  const { publications: toutesLesPublications } = utiliserPublications();
  // Seulement les lieux qui existent encore (tout compte a 18 ans ou plus : aucun n'est filtré par l'âge)
  const { lieux } = utiliserLieux();
  const [onglet, setOnglet] = useState<Onglet>("gardes");
  const [toutesVisibles, setToutesVisibles] = useState(false);
  // Une publication signalée ou « Pas intéressé » ne revient ni dans J'aime ni en vignette
  const publications = toutesLesPublications.filter((p) => !estMasquee(p.id));

  const vignettesGardes: Vignette[] = gardes.flatMap((id) => {
    const lieu = lieux.find((l) => l.id === id);
    if (!lieu) return [];
    return [{ cle: `lieu-${id}`, lieu, image: trouverVignetteLieu(id, publications), libelle: `${lieu.nom}, ${ecrireQuartierVille(lieu)}` }];
  });
  const vignettesJaimes: Vignette[] = jaimes.flatMap((idPublication) => {
    const publication = publications.find((p) => p.id === idPublication);
    const lieu = publication ? lieux.find((l) => l.id === publication.lieuId) : undefined;
    if (!publication || !lieu) return [];
    const image = trouverVignettePublication(publication) ?? trouverVignetteLieu(lieu.id, publications);
    return [{ cle: publication.id, lieu, image, libelle: T.publicationAimeeLu(lieu.nom, ecrireQuartierVille(lieu)) }];
  });

  const onglets = [
    { cle: "gardes" as const, emoji: "🔖", nom: T.gardes, nombre: vignettesGardes.length },
    { cle: "jaimes" as const, emoji: "❤️", nom: T.jaimes, nombre: vignettesJaimes.length },
  ];
  const vignettes = onglet === "gardes" ? vignettesGardes : vignettesJaimes;
  // « lu » : la même invitation pour le lecteur d'écran, avec les boutons qu'il annonce (la vidéo, elle, ne prend pas le focus)
  const vide =
    onglet === "gardes"
      ? {
          emoji: "🔖",
          texte: T.videGardes,
          lu: T.videGardesLu,
        }
      : {
          emoji: "❤️",
          texte: T.videJaimes,
          lu: T.videJaimesLu,
        };
  const dernierGarde = vignettesGardes[0]?.lieu.nom;
  const resume =
    vignettesGardes.length + vignettesJaimes.length === 0
      ? [textesCollection.vide]
      : [textesCollection.compte(vignettesGardes.length, vignettesJaimes.length), ...(dernierGarde ? [textesCollection.dernierGarde(dernierGarde)] : [])];
  const autres = vignettes.length - VIGNETTES_VISIBLES;
  const voirTout = onglet === "gardes" ? textesCollection.voirGardes(vignettes.length) : textesCollection.voirJaimes(vignettes.length);
  const voirMoinsLu = onglet === "gardes" ? textesCollection.voirMoinsGardesLu : textesCollection.voirMoinsJaimesLu;

  return (
    <SectionPliable section="collection" titre={textesCollection.titre} sousTitre={textesCollection.sousTitre} resume={resume}>
      <View accessibilityRole="tablist" className="flex-row border-b-2 border-ligne">
        {onglets.map((o, i) => {
          const actif = o.cle === onglet;
          // iOS ne connaît pas le rôle « onglet » (VoiceOver le lirait comme du texte) : bouton, avec la position dans le libellé
          return (
            <Pressable
              key={o.cle}
              accessibilityRole={Platform.OS === "ios" ? "button" : "tab"}
              accessibilityLabel={Platform.OS === "ios" ? T.ongletLu(o.nom, o.nombre, i + 1, onglets.length) : `${o.nom}, ${o.nombre}`}
              accessibilityState={{ selected: actif }}
              onPress={() => {
                vibrerLegerement();
                setOnglet(o.cle);
                setToutesVisibles(false);
              }}
              className={`-mb-0.5 min-h-11 flex-1 items-center justify-center border-b-2 py-2 active:opacity-70 ${actif ? "border-encre" : "border-transparent"}`}
            >
              <Text className={`font-texte-gras text-base ${actif ? "text-encre" : "text-gris"}`}>
                {o.emoji} {o.nom} ({o.nombre})
              </Text>
            </Pressable>
          );
        })}
      </View>

      {vignettes.length === 0 ? (
        <View className="items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-8">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-4xl">{vide.emoji}</Text>
          <Text accessibilityLabel={vide.lu} className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(vide.texte)}</Text>
        </View>
      ) : (
        <View className="-mx-0.5 flex-row flex-wrap">
          {(toutesVisibles ? vignettes : vignettes.slice(0, VIGNETTES_VISIBLES)).map((v) => (
            <VignetteCollection
              key={v.cle}
              lieu={v.lieu}
              image={v.image}
              libelle={v.libelle}
              onPress={() => router.push({ pathname: "/lieu/[id]", params: { id: String(v.lieu.id) } })}
            />
          ))}
        </View>
      )}
      {autres > 0 ? (
        <BoutonContour
          fond="blanc"
          libelle={toutesVisibles ? textesProfil.voirMoins : voirTout}
          libelleLu={toutesVisibles ? voirMoinsLu : undefined}
          onPress={() => setToutesVisibles(!toutesVisibles)}
        />
      ) : null}
    </SectionPliable>
  );
}
