import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { BADGES, BADGES_PAR_LANGUE } from "@sos-miam/commun/contenus/badges";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { ecrireDateLangue } from "@sos-miam/commun/fonctions/langue/ecrire-date-langue";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { ActivitePote, Pote } from "@sos-miam/commun/types/potes";
import { VignetteLieu } from "~/composants/explorer/VignetteLieu";
import { BoutonVoirPlus } from "~/composants/interface/BoutonVoirPlus";
import { MenuOptions, type OptionMenu } from "~/composants/interface/MenuOptions";
import { RondPote } from "~/composants/potes/RondPote";
import { TEXTES_BANDE_ACTIVITE_PAR_LANGUE } from "~/contenus/textes-bande-activite";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserPagination } from "~/hooks/utiliser-pagination";
import { utiliserPublications } from "~/hooks/utiliser-publications";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { utiliserVoitEnEntier } from "~/hooks/utiliser-voit-en-entier";

type Props = {
  /** Lieux connus de l'app, par identifiant */
  lieux: ReadonlyMap<number, Lieu>;
  /** Après un retrait : le bandeau « Retiré · Annuler » de l'écran */
  onRetire: (texte: string, annuler: () => void) => void;
};

type Ligne = { activite: ActivitePote; pote: Pote; lieu: Lieu | null };

// Les 5 dernières, puis 10 de plus à chaque « Voir plus »
const PREMIERES = 5;
const PAR_PAGE = 10;

/** « à l'instant », « il y a 5 min », « il y a 3 h », « hier », « il y a 4 jours », « le 12 septembre » */
const formaterIlYa = (iso: string, maintenant: number, langue: Langue) => {
  const T = choisirTextes(TEXTES_BANDE_ACTIVITE_PAR_LANGUE, langue).quoiDeNeuf;
  const date = new Date(iso);
  const minutes = Math.max(0, Math.floor((maintenant - date.getTime()) / 60_000));
  if (minutes < 1) return T.instant;
  if (minutes < 60) return T.ilYaMinutes(minutes);
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return T.ilYaHeures(heures);
  const jours = Math.floor(heures / 24);
  if (jours === 1) return T.hier;
  if (jours < 7) return T.ilYaJours(jours);
  return T.leDate(ecrireDateLangue({ annee: date.getFullYear(), mois: date.getMonth() + 1, jour: date.getDate() }, langue, { sansAnnee: true }));
};

const nommerBadge = (nom: string, langue: Langue) => {
  const id = BADGES.find((b) => b.nom === nom)?.id;
  const badge = id ? choisirTextes(BADGES_PAR_LANGUE, langue).find((b) => b.id === id) : undefined;
  return badge?.nom ?? nom;
};

type Morceau = { texte: string; gras?: boolean };

/** Ce qu'a fait le pote, en morceaux (le gras pour ce qui compte), et l'emoji posé sur son avatar */
const decrire = ({ type, detail }: ActivitePote, lieu: Lieu | null, langue: Langue): { emoji: string; morceaux: Morceau[] } => {
  const T = choisirTextes(TEXTES_BANDE_ACTIVITE_PAR_LANGUE, langue).quoiDeNeuf;
  const nomLieu = { texte: lieu?.nom ?? T.unLieu, gras: true };
  const entreGuillemets = (texte: string) => ({ texte: T.citer(texte), gras: true });
  const assembler = (action: { avant: string; apres: string }, gras: Morceau): Morceau[] => [{ texte: action.avant }, gras, ...(action.apres ? [{ texte: action.apres }] : [])];
  switch (type) {
    case "rescousse":
      return { emoji: "🛟", morceaux: assembler(T.actions.rescousse, nomLieu) };
    case "garde":
      return { emoji: "🔖", morceaux: assembler(T.actions.garde, nomLieu) };
    case "badge":
      return { emoji: "🏅", morceaux: assembler(T.actions.badge, entreGuillemets(nommerBadge(detail ?? "", langue))) };
    case "palier":
      return { emoji: "🎖️", morceaux: assembler(T.actions.palier, { texte: detail ?? T.palierSuivant, gras: true }) };
    case "liste":
      return { emoji: "📋", morceaux: assembler(T.actions.liste, entreGuillemets(detail ?? "")) };
    case "sortie":
      return { emoji: "🎉", morceaux: detail ? assembler(T.actions.sortie, entreGuillemets(detail)) : [{ texte: T.sortieSansTitre }] };
  }
};

/**
 * Ce que fait ta bande : rescousses, adresses gardées, badges, listes, par morceaux (« Voir plus »). Toucher un lieu ouvre sa
 * fiche, sinon le profil du pote ; le « ⋯ » d'une ligne la retire, pour toi seulement (« Annuler » la remet).
 * Seulement les potes dont tu vois le profil en entier : l'activité d'un compte privé ajouté par son pseudo reste cachée.
 */
export function ActivitePotes({ lieux, onRetire }: Props) {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_BANDE_ACTIVITE_PAR_LANGUE).quoiDeNeuf;
  const { activites, trouverPote, masquer, demasquer } = utiliserCommunaute();
  const { estMasquee } = utiliserActivite();
  const { publications: toutesLesPublications } = utiliserPublications();
  const voitEnEntier = utiliserVoitEnEntier();
  const [menuPour, setMenuPour] = useState<Ligne | null>(null);
  const maintenant = Date.now();
  const publications = toutesLesPublications.filter((p) => !estMasquee(p.id));

  // Seulement ce que tu peux voir : pas de lieu disparu
  const lignes = activites.flatMap((activite): Ligne[] => {
    const pote = trouverPote(activite.pote);
    const lieu = activite.lieuId !== undefined ? (lieux.get(activite.lieuId) ?? null) : null;
    if (!pote || !voitEnEntier?.(pote.id) || (activite.lieuId !== undefined && !lieu)) return [];
    if ((activite.type === "rescousse" || activite.type === "garde") && !lieu) return [];
    return [{ activite, pote, lieu }];
  });
  const pages = utiliserPagination(lignes, PREMIERES, PAR_PAGE, (l) => l.activite.id);
  const ouvrirProfil = (pote: Pote) => router.push({ pathname: "/potes/profil/[id]", params: { id: pote.id } });
  const ouvrirLieu = (lieu: Lieu) => router.push({ pathname: "/lieu/[id]", params: { id: String(lieu.id) } });

  const options = (ligne: Ligne | null): OptionMenu[] => {
    if (!ligne) return [];
    const { activite, pote, lieu } = ligne;
    return [
      ...(lieu ? [{ cle: "lieu", emoji: "📍", titre: T.voirLieu(lieu.nom), agir: () => ouvrirLieu(lieu) }] : []),
      { cle: "profil", emoji: "👀", titre: T.voirProfil(pote.prenom), detail: `@${pote.pseudo}`, agir: () => ouvrirProfil(pote) },
      {
        cle: "retirer", emoji: "🧹", titre: T.retirer, detail: T.retirerDetail(pote.prenom),
        agir: () => {
          masquer("activite", activite.id);
          onRetire(T.retiree, () => demasquer("activite", activite.id));
        },
      },
    ];
  };

  return (
    <View className="gap-3">
      <View>
        <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
          {T.titre}
        </Text>
        <Text className="font-texte text-sm text-gris">{T.sousTitre}</Text>
      </View>

      {lignes.length === 0 ? (
        <View className="items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-6">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-3xl">
            🦗
          </Text>
          <Text className="text-center font-texte text-base leading-6 text-gris">
            {T.vide}
          </Text>
        </View>
      ) : (
        <View className="overflow-hidden rounded-carte border-2 border-encre bg-carte">
          {pages.visibles.map((ligne, i) => {
            const { activite, pote, lieu } = ligne;
            const { emoji, morceaux } = decrire(activite, lieu, langue);
            const quand = formaterIlYa(activite.date, maintenant, langue);
            const phrase = `${pote.prenom}${morceaux.map((m) => m.texte).join("")}`;
            return (
              // Le « ⋯ » est à côté de la ligne (pas dedans) : le lecteur d'écran les lit l'un après l'autre
              <View key={activite.id} className={`flex-row items-center ${i > 0 ? "border-t border-ligne" : ""}`}>
                <Pressable
                  ref={pages.refDe(activite.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${phrase}, ${quand}`}
                  accessibilityHint={lieu ? T.indiceLieu : T.indiceProfil(pote.prenom)}
                  onPress={() => {
                    vibrerLegerement();
                    if (lieu) ouvrirLieu(lieu);
                    else ouvrirProfil(pote);
                  }}
                  className="min-h-16 flex-1 flex-row items-center gap-3 py-3 pl-4 active:opacity-70"
                >
                  <View>
                    <RondPote pote={pote} taille={40} />
                    <View className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full border-2 border-carte bg-creme">
                      <Text allowFontScaling={false} className="text-[11px]">
                        {emoji}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="font-texte text-[15px] leading-5 text-encre">
                      <Text className="font-texte-gras">{pote.prenom}</Text>
                      {morceaux.map((m, j) => (
                        <Text key={j} className={m.gras ? "font-texte-gras" : undefined}>
                          {m.texte}
                        </Text>
                      ))}
                    </Text>
                    <Text className="font-texte text-[13px] text-gris">{quand}</Text>
                  </View>
                  {lieu ? <VignetteLieu lieu={lieu} image={trouverVignetteLieu(lieu.id, publications)} hauteur={44} arrondi={10} /> : null}
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={T.options(phrase)}
                  accessibilityHint={T.indiceOptions}
                  hitSlop={4}
                  onPress={() => {
                    vibrerLegerement();
                    setMenuPour(ligne);
                  }}
                  className="mr-1 h-11 w-11 items-center justify-center rounded-full active:opacity-60"
                >
                  <Ionicons name="ellipsis-horizontal" size={18} color={couleurs.gris} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      <BoutonVoirPlus restants={pages.restants} prochains={pages.prochains} nom={T.nom} onVoirPlus={pages.voirPlus} />

      <MenuOptions visible={menuPour !== null} titre={menuPour ? T.titreMenu(menuPour.pote.prenom) : ""} options={options(menuPour)} onFermer={() => setMenuPour(null)} />
    </View>
  );
}
