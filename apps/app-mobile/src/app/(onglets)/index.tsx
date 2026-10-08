import { useIsFocused, useRouter } from "expo-router";
import { useBottomTabBarHeight } from "expo-router/tabs";
import { StatusBar } from "expo-status-bar";
import { startTransition, useCallback, useMemo, useRef, useState } from "react";
import { FlatList, Share, View, type ViewToken } from "react-native";
import { Easing, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { POINTS_AMBASSADEUR } from "@sos-miam/commun/regles/ambassadeurs";
import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { EnTeteFil, HAUTEUR_ENTETE_FIL, type OngletFil } from "~/composants/fil/EnTeteFil";
import { FilVide } from "~/composants/fil/FilVide";
import { MenuPublication, type ChoixMenu } from "~/composants/fil/MenuPublication";
import { PostPublication, type GestesPublication } from "~/composants/fil/PostPublication";
import type { ChoixSignalement } from "~/composants/signalement/SignalementPublication";
import { Annonce } from "~/composants/interface/Annonce";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { publicationsExemples } from "~/contenus/publications-exemples";
import type { Publication } from "~/contenus/type-publication";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { ordonnerPublications } from "~/fonctions/lieux/ordonner-publications";
import { estPremierSauvetagePossible } from "~/fonctions/lieux/est-premier-sauvetage-possible";
import { trouverRaisonLieu } from "~/fonctions/lieux/trouver-raison-lieu";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserGestesStables } from "~/hooks/utiliser-gestes-stables";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { ajouterSignalementLocal } from "~/stockage/signalements-locaux";
import couleurs from "~/theme/couleurs";

// Une publication compte comme « à l'écran » quand on en voit plus de la moitié
const VISIBILITE = { itemVisiblePercentThreshold: 60 };

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
  // Dernière publication du menu, gardée pendant que la feuille se referme (sinon son titre se vide en glissant)
  const [menuAffiche, setMenuAffiche] = useState<Publication | null>(null);
  const refListe = useRef<FlatList<Publication>>(null);
  // Fiche réduite pour voir les vidéos en plein écran : le choix reste d'une publication à l'autre
  const [infosReduites, setInfosReduites] = useState(false);
  const reduction = useSharedValue(0);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);

  const age = profil ? calculerAge(profil.dateNaissance) : null;
  const lieux = useMemo(() => filtrerLieuxSelonAge(lieuxExemples, age), [age]);
  const lieuParId = useMemo(() => new Map(lieux.map((lieu) => [lieu.id, lieu])), [lieux]);
  const publications = useMemo(() => ordonnerPublications(publicationsExemples, lieux, profil), [lieux, profil]);

  const { estMasquee } = activite;
  const liste = useMemo(() => {
    const gardees = publications.filter((p) => {
      if (estMasquee(p.id)) return false;
      if (onglet === "tous") return true;
      const lieu = lieuParId.get(p.lieuId);
      // « SOS ce soir » : une publication par lieu (la sienne), seulement les lieux en SOS ou en alerte
      return p.auteur.type === "lieu" && !!lieu && (!!lieu.sos || !!lieu.alerte);
    });
    if (onglet === "sos") gardees.sort((a, b) => Number(!!lieuParId.get(b.lieuId)?.sos) - Number(!!lieuParId.get(a.lieuId)?.sos));
    return gardees;
  }, [publications, onglet, lieuParId, estMasquee]);

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
    // activite est l'état d'avant l'appui : un lieu déjà compté ne refait pas « Premier sauveteur » les semaines suivantes
    if (estPremierSauvetagePossible(lieu, activite.premiersSauvetages)) {
      activite.noterPremierSauvetage(lieu.id);
      annoncer(`🚀 Premier sauveteur ! ${lieu.nom} vient d'arriver et tu es déjà là : +${POINTS_AMBASSADEUR.premierSauveteur} points`);
    } else annoncer(reste > 0 ? `🛟 Merci ! Encore ${reste} rescousse${reste > 1 ? "s" : ""} cette semaine` : "Dernière rescousse donnée, merci pour eux ! 🦸");
  }

  function choixMenu(choix: ChoixMenu) {
    const p = menu;
    setMenu(null);
    if (!p) return;
    if (choix === "rescousse") rescousse(p);
    if (choix === "adresse") router.push({ pathname: "/lieu/[id]", params: { id: String(p.lieuId) } });
    if (choix === "pas-interesse") {
      masquerPublication(p.id);
      annoncer("Compris, on t'en montrera moins comme ça 🙈");
    }
  }

  // Signalement envoyé : gardé sur le téléphone en attendant l'API, et la publication disparaît du fil (la feuille reste ouverte pour dire merci)
  // Masquer la dernière publication laisserait iOS sur une page vide : on recule d'abord d'une publication
  function masquerPublication(id: string) {
    const index = liste.findIndex((p) => p.id === id);
    if (index > 0 && index === liste.length - 1) refListe.current?.scrollToIndex({ index: index - 1, animated: false });
    activite.masquer(id);
  }

  function signaler(choix: ChoixSignalement) {
    if (!menu) return;
    ajouterSignalementLocal({ publicationId: menu.id, lieuId: menu.lieuId, ...choix, date: new Date().toISOString() }).catch(() => {});
    masquerPublication(menu.id);
  }

  function partager(p: Publication) {
    const lieu = lieuParId.get(p.lieuId);
    if (!lieu) return;
    Share.share({ message: `${lieu.emoji} ${lieu.nom} (${lieu.quartier}, ${lieu.ville}) a besoin de monde ! Je l'ai trouvé sur SOS Miam 🛟 https://sosmiam.fr` }).catch(() => {});
  }

  // L'animation part dès l'appui sur le fil d'affichage ; le nouveau rendu (accessibilité, appuis) passe ensuite, sans la bloquer
  function basculerReduction() {
    const suivant = !infosReduites;
    reduction.value = withTiming(suivant ? 1 : 0, { duration: 260, easing: Easing.out(Easing.cubic) });
    startTransition(() => setInfosReduites(suivant));
  }

  const gestes = utiliserGestesStables<GestesPublication>({
    jaime: (p) => void activite.basculerJaime(p.id),
    doubleAppui: aimerParDoubleAppui,
    commentaires: () => annoncer("Les commentaires arrivent très bientôt 💬"),
    garder: (p) => {
      const nom = lieuParId.get(p.lieuId)?.nom ?? "Ce lieu";
      annoncer(activite.basculerGarde(p.lieuId) ? `🔖 ${nom} est gardé pour plus tard` : "Retiré de tes lieux gardés");
    },
    partager,
    menu: (p) => {
      setMenu(p);
      setMenuAffiche(p);
    },
    voir: (p) => router.push({ pathname: "/lieu/[id]", params: { id: String(p.lieuId) } }),
    reduire: basculerReduction,
  });

  const auChangementDeVisible = useCallback(({ viewableItems }: { viewableItems: ViewToken<Publication>[] }) => {
    setVisible(viewableItems[0]?.item.id ?? null);
  }, []);

  const lieuDuMenu = menuAffiche ? lieuParId.get(menuAffiche.lieuId) : undefined;
  // La barre d'onglets est posée, transparente, sur le fil (voir src/app/(onglets)/_layout.tsx)
  const hauteurBarreOnglets = useBottomTabBarHeight();
  // Étiquette d'illustration et compteur de photos : juste sous l'en-tête, quelle que soit l'encoche du téléphone
  const hautIndications = marges.top + HAUTEUR_ENTETE_FIL + 8;

  return (
    <View
      style={{ flex: 1, backgroundColor: couleurs.encre }}
      onLayout={(e) => setTaille({ largeur: e.nativeEvent.layout.width, hauteur: e.nativeEvent.layout.height })}
    >
      {focus ? <StatusBar style="light" /> : null}
      {taille.hauteur > 0 ? (
        liste.length > 0 ? (
          <FlatList
            ref={refListe}
            key={onglet}
            data={liste}
            keyExtractor={(p) => p.id}
            pagingEnabled
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            getItemLayout={(_, index) => ({ length: taille.hauteur, offset: taille.hauteur * index, index })}
            onViewableItemsChanged={auChangementDeVisible}
            viewabilityConfig={VISIBILITE}
            // Peu de publications montées à la fois : chaque vidéo a son lecteur. Les premières ne sont jamais démontées.
            initialNumToRender={2}
            maxToRenderPerBatch={2}
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
                  margeHaut={hautIndications}
                  margeBas={hauteurBarreOnglets}
                  reduit={infosReduites}
                  reduction={reduction}
                  gestes={gestes}
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
        onSignaler={signaler}
        onFermer={() => setMenu(null)}
      />
    </View>
  );
}
