import { useIsFocused, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Share, View, type ViewToken } from "react-native";
import { Easing, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { EnTeteFil, type OngletFil } from "~/composants/fil/EnTeteFil";
import { FilVide } from "~/composants/fil/FilVide";
import { MenuPublication, type ChoixMenu } from "~/composants/fil/MenuPublication";
import { PostPublication } from "~/composants/fil/PostPublication";
import { Annonce } from "~/composants/interface/Annonce";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { publicationsExemples } from "~/contenus/publications-exemples";
import type { Publication } from "~/contenus/type-publication";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { ordonnerPublications } from "~/fonctions/lieux/ordonner-publications";
import { trouverRaisonLieu } from "~/fonctions/lieux/trouver-raison-lieu";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import couleurs from "~/theme/couleurs";

// Hauteur de la barre d'onglets d'Expo Router (sans la zone sûre du bas)
const HAUTEUR_BARRE_ONGLETS = 49;

/** Onglet « Pour toi » : les vidéos et photos des lieux en plein écran, triées selon tes envies. Double appui = J'aime. */
export default function PourToi() {
  const router = useRouter();
  const focus = useIsFocused();
  const marges = useSafeAreaInsets();
  const { profil } = utiliserProfil();
  const activite = utiliserActivite();
  const [onglet, setOnglet] = useState<OngletFil>("tous");
  const [taille, setTaille] = useState({ largeur: 0, hauteur: 0 });
  const [visible, setVisible] = useState<string | null>(null);
  const [coeurs, setCoeurs] = useState<Record<string, number>>({});
  const [bouees, setBouees] = useState<Record<string, number>>({});
  const [menu, setMenu] = useState<Publication | null>(null);
  // Fiche réduite pour voir les vidéos en plein écran : le choix reste d'une publication à l'autre
  const [infosReduites, setInfosReduites] = useState(false);
  const reduction = useSharedValue(0);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);

  const age = profil ? calculerAge(profil.dateNaissance) : null;
  const lieux = useMemo(() => filtrerLieuxSelonAge(lieuxExemples, age), [age]);
  const lieuParId = useMemo(() => new Map(lieux.map((lieu) => [lieu.id, lieu])), [lieux]);
  const publications = useMemo(() => ordonnerPublications(publicationsExemples, lieux, profil), [lieux, profil]);

  const liste = publications.filter((p) => {
    if (activite.estMasquee(p.id)) return false;
    if (onglet === "tous") return true;
    const lieu = lieuParId.get(p.lieuId);
    // « SOS ce soir » : une publication par lieu (la sienne), seulement les lieux en SOS ou en alerte
    return p.auteur.type === "lieu" && !!lieu && (!!lieu.sos || !!lieu.alerte);
  });
  if (onglet === "sos") liste.sort((a, b) => Number(!!lieuParId.get(b.lieuId)?.sos) - Number(!!lieuParId.get(a.lieuId)?.sos));

  const annoncer = (texte: string) => setAnnonce({ texte, numero: Date.now() });
  const finAnnonce = useCallback(() => setAnnonce(null), []);

  function aimerParDoubleAppui(p: Publication) {
    activite.aimer(p.id);
    setCoeurs((c) => ({ ...c, [p.id]: Date.now() }));
  }

  function rescousse(p: Publication) {
    const lieu = lieuParId.get(p.lieuId);
    if (!lieu) return;
    const resultat = activite.basculerRescousse(lieu.id);
    if (resultat === "epuisee") return annoncer("Plus de rescousse cette semaine, reviens lundi ! 🛟");
    if (resultat === "annulee") return annoncer("Rescousse reprise");
    setBouees((b) => ({ ...b, [p.id]: Date.now() }));
    const reste = activite.restantes - 1;
    if (lieu.nouveau && !lieu.decouvertPar) annoncer(`🚀 Premier sauveteur ! ${lieu.nom} est « Déniché par ${profil?.prenom ?? "toi"} »`);
    else annoncer(reste > 0 ? `🛟 Merci ! Encore ${reste} rescousse${reste > 1 ? "s" : ""} cette semaine` : "Dernière rescousse donnée, merci pour eux ! 🦸");
  }

  function choixMenu(choix: ChoixMenu) {
    const p = menu;
    setMenu(null);
    if (!p) return;
    if (choix === "rescousse") rescousse(p);
    if (choix === "adresse") router.push({ pathname: "/lieu/[id]", params: { id: String(p.lieuId) } });
    if (choix === "pas-interesse") {
      activite.masquer(p.id);
      annoncer("Compris, on t'en montrera moins comme ça 🙈");
    }
    if (choix === "signaler") {
      activite.masquer(p.id);
      annoncer("Merci ! On regarde ça de près 🚩");
    }
  }

  function partager(p: Publication) {
    const lieu = lieuParId.get(p.lieuId);
    if (!lieu) return;
    Share.share({ message: `${lieu.emoji} ${lieu.nom} (${lieu.quartier}, ${lieu.ville}) a besoin de monde ! Je l'ai trouvé sur SOS Miam 🛟 https://sosmiam.fr` }).catch(() => {});
  }

  // L'animation part dès l'appui sur le fil d'affichage, sans attendre le nouveau rendu de la liste
  function basculerReduction() {
    const suivant = !infosReduites;
    reduction.value = withTiming(suivant ? 1 : 0, { duration: 260, easing: Easing.out(Easing.cubic) });
    setInfosReduites(suivant);
  }

  const auChangementDeVisible = useCallback(({ viewableItems }: { viewableItems: ViewToken<Publication>[] }) => {
    setVisible(viewableItems[0]?.item.id ?? null);
  }, []);

  const lieuDuMenu = menu ? lieuParId.get(menu.lieuId) : undefined;
  // La barre d'onglets est posée, transparente, sur le fil (voir src/app/(onglets)/_layout.tsx)
  const hauteurBarreOnglets = HAUTEUR_BARRE_ONGLETS + marges.bottom;

  return (
    <View
      style={{ flex: 1, backgroundColor: couleurs.encre }}
      onLayout={(e) => setTaille({ largeur: e.nativeEvent.layout.width, hauteur: e.nativeEvent.layout.height })}
    >
      {focus ? <StatusBar style="light" /> : null}
      {taille.hauteur > 0 ? (
        liste.length > 0 ? (
          <FlatList
            key={onglet}
            data={liste}
            keyExtractor={(p) => p.id}
            pagingEnabled
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            getItemLayout={(_, index) => ({ length: taille.hauteur, offset: taille.hauteur * index, index })}
            onViewableItemsChanged={auChangementDeVisible}
            viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
            windowSize={3}
            renderItem={({ item }) => {
              const lieu = lieuParId.get(item.lieuId);
              if (!lieu) return null;
              return (
                <PostPublication
                  publication={item}
                  lieu={lieu}
                  largeur={taille.largeur}
                  hauteur={taille.hauteur}
                  raison={profil ? trouverRaisonLieu(lieu, profil) : null}
                  aime={activite.aime(item.id)}
                  garde={activite.estGarde(lieu.id)}
                  actif={focus && visible === item.id}
                  envolCoeur={coeurs[item.id] ?? 0}
                  envolBouee={bouees[item.id] ?? 0}
                  margeBas={hauteurBarreOnglets}
                  reduit={infosReduites}
                  reduction={reduction}
                  onReduire={basculerReduction}
                  onJaime={() => activite.basculerJaime(item.id)}
                  onDoubleAppui={() => aimerParDoubleAppui(item)}
                  onCommentaires={() => annoncer("Les commentaires arrivent très bientôt 💬")}
                  onGarder={() => annoncer(activite.basculerGarde(lieu.id) ? `🔖 ${lieu.nom} est gardé pour plus tard` : "Retiré de tes lieux gardés")}
                  onPartager={() => partager(item)}
                  onMenu={() => setMenu(item)}
                  onVoir={() => router.push({ pathname: "/lieu/[id]", params: { id: String(lieu.id) } })}
                />
              );
            }}
          />
        ) : (
          <FilVide hauteur={taille.hauteur} onVoirTout={() => setOnglet("tous")} />
        )
      ) : null}
      <EnTeteFil onglet={onglet} onChoisir={setOnglet} restantes={activite.restantes} haut={marges.top} />
      <Annonce annonce={annonce} haut={marges.top + 60} onFin={finAnnonce} />
      <MenuPublication
        visible={menu !== null}
        nomLieu={lieuDuMenu?.nom ?? ""}
        sauve={lieuDuMenu ? activite.aSauve(lieuDuMenu.id) : false}
        restantes={activite.restantes}
        onChoisir={choixMenu}
        onFermer={() => setMenu(null)}
      />
    </View>
  );
}
