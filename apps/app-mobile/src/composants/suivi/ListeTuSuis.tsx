import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { RondPote } from "~/composants/potes/RondPote";
import { LigneSuivi } from "~/composants/suivi/LigneSuivi";
import { SuggestionsSuivre } from "~/composants/suivi/SuggestionsSuivre";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { ecrireCleSuivi } from "~/fonctions/suivi/ecrire-cle-suivi";
import { listerSuivisAffichables } from "~/fonctions/suivi/lister-suivis-affichables";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import type { PersonneLiee } from "~/hooks/utiliser-suivis-personnes";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";

type Props = {
  /** Affiche le petit message de l'écran (« 🔔 Tu suis maintenant … ! », « Tu ne suis plus … ») */
  onAnnoncer: (texte: string) => void;
};

type LigneAffichee = {
  cle: string;
  emoji: string;
  nom: string;
  sousTitre: string;
  degrade?: [string, string];
  rond?: ReactNode;
  indice: string;
  /** Encore suivi (une ligne qu'on ne suit plus reste affichée, sans compter) */
  suivi: boolean;
  ouvrir: () => void;
};

const TAILLE_ROND = 48;

/** Tes abonnements et tes demandes envoyées, du plus récent au plus ancien */
function rangerPersonnes(abonnements: PersonneLiee[], demandes: PersonneLiee[]): PersonneLiee[] {
  return [...abonnements, ...demandes].sort((a, b) => b.depuis.localeCompare(a.depuis));
}

/**
 * Tout ce que tu suis, en trois sections : les personnes (abonnements et demandes envoyées), les lieux et les créateurs,
 * puis des suggestions « Tu pourrais suivre ». Toucher une ligne ouvre le profil, la fiche ou la page ; « Suivi » demande
 * confirmation avant de ne plus suivre. La liste est figée à l'ouverture : une ligne qu'on ne suit plus reste là avec
 * « Suivre », pour se raviser, et ne disparaît qu'à la prochaine visite (sauf une personne bloquée, qui part tout de suite).
 */
export function ListeTuSuis({ onAnnoncer }: Props) {
  const router = useRouter();
  const { profil } = utiliserProfil();
  const activite = utiliserActivite();
  const suivis = utiliserSuivisPersonnes();

  // Les lieux et créateurs suivis au moment où la liste s'ouvre (ou dès que l'activité du téléphone est relue)
  const [cles, setCles] = useState<readonly string[] | null>(() => (activite.chargee ? activite.suivis : null));
  useEffect(() => {
    if (cles === null && activite.chargee) setCles(activite.suivis);
  }, [cles, activite.chargee, activite.suivis]);

  // Pareil pour les personnes, dès que les suivis entre personnes sont relus
  const [personnes, setPersonnes] = useState<PersonneLiee[] | null>(() => (suivis.pret ? rangerPersonnes(suivis.abonnements, suivis.demandesEnvoyees) : null));
  useEffect(() => {
    if (personnes === null && suivis.pret) setPersonnes(rangerPersonnes(suivis.abonnements, suivis.demandesEnvoyees));
  }, [personnes, suivis.pret, suivis.abonnements, suivis.demandesEnvoyees]);

  if (cles === null || personnes === null) return null;

  // Seulement ce qui existe encore et que ton âge autorise (comme dans le fil)
  const lieux = filtrerLieuxSelonAge(lieuxExemples, profil ? calculerAge(profil.dateNaissance) : null);
  const pages = listerSuivisAffichables(cles, lieux);

  const lignesPersonnes: LigneAffichee[] = personnes.flatMap(({ pote }) => {
    const relation = suivis.relationAvec(pote.id);
    // Devenue inconnue ou bloquée depuis l'ouverture : elle disparaît de la liste
    if (!relation || (!relation.verdict.permis && relation.verdict.raison === "bloque")) return [];
    return [
      {
        cle: ecrireCleSuivi({ type: "personne", id: pote.id }),
        emoji: pote.avatar,
        nom: pote.prenom,
        sousTitre: `@${pote.pseudo}${relation.meSuit ? " · Te suit" : ""}`,
        rond: <RondPote pote={pote} taille={TAILLE_ROND} />,
        indice: "Ouvre son profil",
        suivi: relation.jeSuis === "suivi",
        ouvrir: () => router.push({ pathname: "/potes/profil/[id]", params: { id: pote.id } }),
      },
    ];
  });

  const lignesLieux: LigneAffichee[] = pages.flatMap((page) => {
    if (page.type !== "lieu") return [];
    const { cle, lieu } = page;
    return [
      {
        cle,
        emoji: lieu.emoji,
        nom: lieu.nom,
        sousTitre: `${lieu.info} · ${lieu.quartier}, ${lieu.ville}`,
        degrade: lieu.couleurs,
        indice: "Ouvre la fiche du lieu",
        suivi: activite.estSuivi(cle),
        ouvrir: () => router.push({ pathname: "/lieu/[id]", params: { id: String(lieu.id) } }),
      },
    ];
  });

  const lignesCreateurs: LigneAffichee[] = pages.flatMap((page) => {
    if (page.type !== "createur") return [];
    const { cle, pseudo } = page;
    // Comme sur sa page : sans ce qui est masqué ni les lieux que ton âge écarte
    const visibles = page.publications.filter((p) => !activite.estMasquee(p.id) && lieux.some((l) => l.id === p.lieuId)).length;
    return [
      {
        cle,
        emoji: "🎬",
        nom: `@${pseudo}`,
        sousTitre: `Créateur · ${visibles} publication${visibles > 1 ? "s" : ""}`,
        indice: "Ouvre sa page",
        suivi: activite.estSuivi(cle),
        ouvrir: () => router.push({ pathname: "/createur/[pseudo]", params: { pseudo } }),
      },
    ];
  });

  const sections = [
    { cle: "personnes", emoji: "🙋", titre: "Personnes", lignes: lignesPersonnes },
    { cle: "lieux", emoji: "🍽️", titre: "Lieux", lignes: lignesLieux },
    { cle: "createurs", emoji: "🎬", titre: "Créateurs", lignes: lignesCreateurs },
  ].filter((s) => s.lignes.length > 0);

  return (
    <View className="gap-6">
      {sections.length === 0 ? (
        <View className="items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-8">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-4xl">
            🔔
          </Text>
          <Text className="text-center font-titre-gras text-lg text-encre">Tu ne suis personne… pour l'instant.</Text>
          <Text className="text-center font-texte text-base leading-6 text-gris">
            {lierPonctuation("Touche « Suivre » sur une fiche, une vidéo ou le profil de quelqu'un qui te plaît : ses nouveautés arriveront jusqu'à toi.")}
          </Text>
        </View>
      ) : (
        sections.map((section) => {
          const nombre = section.lignes.filter((l) => l.suivi).length;
          return (
            <View key={section.cle} className="gap-3">
              <Text accessibilityRole="header" accessibilityLabel={`${section.titre}, ${nombre}`} className="font-titre-gras text-xl text-encre">
                {section.emoji} {section.titre} ({nombre})
              </Text>
              <View className="overflow-hidden rounded-carte border-2 border-encre bg-white">
                {section.lignes.map((ligne, i) => (
                  <LigneSuivi
                    key={ligne.cle}
                    cle={ligne.cle}
                    emoji={ligne.emoji}
                    nom={ligne.nom}
                    sousTitre={ligne.sousTitre}
                    degrade={ligne.degrade}
                    rond={ligne.rond}
                    indice={ligne.indice}
                    derniere={i === section.lignes.length - 1}
                    onOuvrir={ligne.ouvrir}
                    onAnnoncer={onAnnoncer}
                  />
                ))}
              </View>
            </View>
          );
        })
      )}

      <SuggestionsSuivre titre="Tu pourrais suivre" types={["personne", "createur", "lieu"]} onAnnoncer={onAnnoncer} />
    </View>
  );
}
