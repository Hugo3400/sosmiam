import { useIsFocused, useRouter } from "expo-router";
import { useBottomTabBarHeight } from "expo-router/tabs";
import { StatusBar } from "expo-status-bar";
import { startTransition, useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FlatList, Share, View, type ViewToken } from "react-native";
import { Easing, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { estLieuVerifie } from "@sos-miam/commun/fonctions/lieux/est-lieu-verifie";
import { BandeauActusAbonnements } from "~/composants/actus/BandeauActusAbonnements";
import { ListeActus } from "~/composants/actus/ListeActus";
import { BanniereThemeFil } from "~/composants/fil/BanniereThemeFil";
import { EnTeteFil, HAUTEUR_ENTETE_FIL, HAUTEUR_PASTILLE_VISITE, type OngletFil } from "~/composants/fil/EnTeteFil";
import { FeuilleCommentaires } from "~/composants/fil/FeuilleCommentaires";
import { FilSansPublication } from "~/composants/fil/FilSansPublication";
import { MenuPublication, type ChoixMenu } from "~/composants/fil/MenuPublication";
import { PostPublication, type GestesPublication } from "~/composants/fil/PostPublication";
import type { ChoixSignalement } from "~/composants/signalement/SignalementPublication";
import { Annonce } from "~/composants/interface/Annonce";
import { BarreEtatTheme } from "~/composants/interface/BarreEtatTheme";
import { EnvoyerAPote } from "~/composants/potes/EnvoyerAPote";
import { FeuilleNePlusSuivre } from "~/composants/suivi/FeuilleNePlusSuivre";
import { AUCUN_SUIVI, DELAI_ACCUEIL, DELAI_PRECHARGEMENT, FENETRE_ACCUEIL, raisonsMenu, VISIBILITE } from "~/contenus/reglages-fil";
import { TAILLE_PAGE_FIL } from "~/contenus/taille-page-fil";
import type { FiltreActus } from "~/contenus/type-filtre-actus";
import type { Publication } from "~/contenus/type-publication";
import { calculerKmLieu } from "~/fonctions/lieux/calculer-km-lieu";
import { ecrireQuartierVille } from "~/fonctions/lieux/ecrire-quartier-ville";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { ordonnerPublications } from "~/fonctions/lieux/ordonner-publications";
import { trouverRaisonLieu } from "~/fonctions/lieux/trouver-raison-lieu";
import { calculerCleSuivi } from "~/fonctions/publications/calculer-cle-suivi";
import { ordonnerParPage } from "~/fonctions/publications/ordonner-par-page";
import { estPublieeParSuivi } from "~/fonctions/publications/est-publiee-par-suivi";
import { envoyerSignalementPublication } from "~/fonctions/signalement/envoyer-signalement-publication";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserNombresCommentaires } from "~/hooks/utiliser-nombres-commentaires";
import { utiliserCompteRequis, type RaisonCompte } from "~/hooks/utiliser-compte-requis";
import { utiliserGesteRescousse } from "~/hooks/utiliser-geste-rescousse";
import { utiliserGestesStables } from "~/hooks/utiliser-gestes-stables";
import { utiliserInviterLieu } from "~/hooks/utiliser-inviter-lieu";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserDepartVille } from "~/hooks/utiliser-depart-ville";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserPublications } from "~/hooks/utiliser-publications";
import { ACTUS_VISIBLES } from "~/services/actus-visibles";


/** Auteur que tu pourrais ne plus suivre : ce que la feuille de confirmation affiche, et la clé de ton suivi */
type AuteurSuivi = { nom: string; emoji: string; cle: string };

/**
 * Onglet « Pour toi » : les vidéos et photos des lieux en plein écran, triées selon tes envies. Double appui = J'aime.
 * En haut, trois fils : « Abonnements » (seulement ce que publient les lieux et créateurs suivis), « Pour toi » (par défaut), « SOS ce soir ».
 * En visite sans compte, on regarde tout (son, accéléré, fiche, commentaires…) ; J'aime, rescousse, garder, partager, suivre
 * et le reste du menu ouvrent la feuille « Crée ton compte ». Une fois le compte créé, on retrouve la même publication.
 */
export default function PourToi() {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const focus = useIsFocused();
  // Quitter le fil met la vidéo en pause un instant après : la fiche ouverte se dessine d'abord, sans attendre le fil
  const focusDiffere = useDeferredValue(focus);
  const marges = useSafeAreaInsets();
  const { profil, invite } = utiliserProfil();
  // Stable : les gestes mémorisés l'appellent sans redessiner le fil
  const exiger = utiliserCompteRequis();
  const inviter = utiliserInviterLieu();
  const { depart, depuis } = utiliserDepartVille();
  const { langue } = utiliserLangue();
  const activite = utiliserActivite();
  const nombreCommentaires = utiliserNombresCommentaires();
  const [onglet, setOnglet] = useState<OngletFil>("tous");
  const [filtreActus, setFiltreActus] = useState<{ filtre: FiltreActus; numero: number }>({ filtre: null, numero: 0 });
  const [taille, setTaille] = useState({ largeur: 0, hauteur: 0 });
  const [visible, setVisible] = useState<string | null>(null);
  const [hauteurBanniere, setHauteurBanniere] = useState(0);
  const [coeurs, setCoeurs] = useState<Record<string, number>>({});
  const [bouees, setBouees] = useState<Record<string, number>>({});
  const [menu, setMenu] = useState<Publication | null>(null);
  // Dernière publication du menu, gardée pendant que la feuille se referme (sinon son titre se vide en glissant)
  const [menuAffiche, setMenuAffiche] = useState<Publication | null>(null);
  // Commentaires ouverts, et dernière publication commentée, gardée pendant que la feuille se referme
  const [commentaires, setCommentaires] = useState<Publication | null>(null);
  const [commentairesAffiches, setCommentairesAffiches] = useState<Publication | null>(null);
  // « Envoyer à un pote » : le lieu reste choisi pendant que la feuille se referme
  const [envoiVisible, setEnvoiVisible] = useState(false);
  const [lieuEnvoye, setLieuEnvoye] = useState<number | null>(null);
  // « Envoyer à un pote » ou « Crée ton compte » choisi dans le menu : s'ouvre quand le menu a fini de se refermer
  // (iOS n'ouvre pas une fenêtre pendant que la précédente glisse encore)
  const apresMenu = useRef<(() => void) | null>(null);
  const minuterieAccueil = useRef<ReturnType<typeof setTimeout> | null>(null);
  // « Ne plus suivre ? » : l'auteur reste affiché pendant que la feuille se referme (comme menuAffiche)
  const [nePlusSuivreVisible, setNePlusSuivreVisible] = useState(false);
  const [auteurSuivi, setAuteurSuivi] = useState<AuteurSuivi | null>(null);
  const refListe = useRef<FlatList<Publication>>(null);
  // Doigt qui règle la barre d'avancée d'une vidéo : le fil ne défile pas sous lui
  const [barreEnCours, setBarreEnCours] = useState(false);
  // Fiche réduite pour voir les vidéos en plein écran : le choix reste d'une publication à l'autre
  const [infosReduites, setInfosReduites] = useState(false);
  const reduction = useSharedValue(0);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  // Ce que tu suis remonte en tête du fil, mais l'ordre ne bouge pas sous ton doigt quand tu suis quelqu'un :
  // tes suivis sont repris une fois l'activité relue, puis à chaque changement d'onglet (la liste repart du début)
  const [tri, setTri] = useState<{ onglet: OngletFil; suivis: readonly string[] } | null>(null);
  if (activite.chargee && tri?.onglet !== onglet) setTri({ onglet, suivis: activite.suivis });
  const suivisDuTri = tri?.suivis ?? AUCUN_SUIVI;
  const fichePrechargee = useRef(false);
  // Le profil arrive (compte créé pendant la visite, envies changées) : le fil se retrie selon tes envies, et les bars arrivent
  // pour les grands. La liste garderait sa place et montrerait une autre publication : on revient sur celle qui était à l'écran
  const [profilVu, setProfilVu] = useState(profil);
  const [recalage, setRecalage] = useState<string | null>(null);
  // Compte tout juste créé : « À toi de jouer » quand le fil revient à l'écran (le geste qui demandait un compte est à refaire)
  const [accueil, setAccueil] = useState(false);
  if (profil !== profilVu) {
    setProfilVu(profil);
    setRecalage(visible);
    if (profilVu === null && profil !== null) setAccueil(true);
  }

  const age = profil ? calculerAge(profil.dateNaissance) : null;
  const { lieux: tousLesLieux } = utiliserLieux();
  const { publications: toutesLesPublications, horsLigne: filHorsLigne, aUneSuite, chargerSuite } = utiliserPublications();
  const lieux = useMemo(() => filtrerLieuxSelonAge(tousLesLieux, age), [tousLesLieux, age]);
  const lieuParId = useMemo(() => new Map(lieux.map((lieu) => [lieu.id, lieu])), [lieux]);
  const publications = useMemo(
    () => ordonnerParPage(
      toutesLesPublications,
      TAILLE_PAGE_FIL,
      (page) => ordonnerPublications(page, lieux, profil, suivisDuTri, depart),
    ),
    [toutesLesPublications, lieux, profil, suivisDuTri, depart],
  );

  const { estMasquee } = activite;
  const liste = useMemo(() => {
    // « Abonnements » : ce que publient les lieux et créateurs suivis au moment du tri (la vidéo à l'écran reste après « Ne plus suivre »)
    const suivis = new Set(suivisDuTri);
    const gardees = publications.filter((p) => {
      if (onglet === "actus" || estMasquee(p.id)) return false;
      if (onglet === "tous") return true;
      if (onglet === "abonnements") return estPublieeParSuivi(p, suivis);
      const lieu = lieuParId.get(p.lieuId);
      // « SOS ce soir » : une publication par lieu (la sienne), seulement les lieux en SOS ou en alerte
      return p.auteur.type === "lieu" && !!lieu && (!!lieu.sos || !!lieu.alerte);
    });
    if (onglet === "sos") gardees.sort((a, b) => Number(!!lieuParId.get(b.lieuId)?.sos) - Number(!!lieuParId.get(a.lieuId)?.sos));
    return gardees;
  }, [publications, onglet, lieuParId, estMasquee, suivisDuTri]);
  // « Abonnements » encore vide : tes suivis sont repris dès qu'ils changent (suivre depuis une suggestion fait arriver sa vidéo).
  // Rien ne bouge sous ton doigt : il n'y a rien à l'écran. On compare le contenu, pas le tableau (sinon on reprendrait à chaque rendu)
  if (onglet === "abonnements" && liste.length === 0 && tri !== null && tri.suivis.join("|") !== activite.suivis.join("|")) {
    setTri({ onglet, suivis: activite.suivis });
  }

  useEffect(() => () => {
    if (minuterieAccueil.current) clearTimeout(minuterieAccueil.current);
  }, []);

  // Avant que l'écran se dessine : la publication d'avant reprend sa place dans le nouvel ordre
  useLayoutEffect(() => {
    if (recalage === null) return;
    setRecalage(null);
    const index = liste.findIndex((p) => p.id === recalage);
    if (index < 0) return;
    refListe.current?.scrollToIndex({ index, animated: false });
    setVisible(recalage);
  }, [recalage, liste]);

  // Inscription lancée d'un autre écran (Explorer, une fiche…) : le fil ne dira rien en y revenant plus tard
  useEffect(() => {
    if (!accueil) return;
    const fin = setTimeout(() => setAccueil(false), FENETRE_ACCUEIL);
    return () => clearTimeout(fin);
  }, [accueil]);

  useEffect(() => {
    if (!accueil || !focus) return;
    setAccueil(false);
    if (minuterieAccueil.current) clearTimeout(minuterieAccueil.current);
    minuterieAccueil.current = setTimeout(() => setAnnonce({ texte: "Compte créé ! À toi de jouer 💛", numero: Date.now() }), DELAI_ACCUEIL);
  }, [accueil, focus]);

  // La fiche du lieu de la publication à l'écran est préparée en coulisses (une seule fois) : la première « Voir l'adresse » s'ouvre sans ramer.
  // Une autre fiche réutilise le même écran déjà monté, avec le bon lieu.
  const lieuAPrecharger = (liste.find((p) => p.id === visible) ?? liste[0])?.lieuId;
  useEffect(() => {
    if (fichePrechargee.current || !focus || lieuAPrecharger === undefined) return;
    const minuterie = setTimeout(() => {
      fichePrechargee.current = true;
      router.prefetch({ pathname: "/lieu/[id]", params: { id: String(lieuAPrecharger) } });
    }, DELAI_PRECHARGEMENT);
    return () => clearTimeout(minuterie);
  }, [focus, lieuAPrecharger, router]);

  const annoncer = (texte: string) => setAnnonce({ texte, numero: Date.now() });
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  // Pastille « 👀 Visite » de l'en-tête : la rescousse, cœur de SOS Miam, donne le ton de la feuille
  const creerCompte = useCallback(() => void exiger("rescousse"), [exiger]);

  // Sans compte : la feuille « Crée ton compte » à la place du J'aime (et pas de cœur qui s'envole)
  function aimerParDoubleAppui(p: Publication) {
    if (!exiger("jaime")) return;
    activite.aimer(p.id);
    setCoeurs((c) => ({ ...c, [p.id]: Date.now() }));
  }

  // Mêmes règles et mêmes messages que sur la fiche d'un lieu (premier sauveteur confirmé par l'API avec un compte)
  const donnerOuReprendreRescousse = utiliserGesteRescousse(annoncer);
  function rescousse(p: Publication) {
    const lieu = lieuParId.get(p.lieuId);
    if (!lieu) return;
    donnerOuReprendreRescousse(lieu, () => setBouees((b) => ({ ...b, [p.id]: Date.now() })));
  }

  /** Vrai avec un compte ; sinon, une fois le menu refermé, la feuille « Crée ton compte » */
  function exigerApresMenu(raison: RaisonCompte): boolean {
    if (profil) return true;
    apresMenu.current = () => exiger(raison);
    return false;
  }

  function choixMenu(choix: ChoixMenu) {
    const p = menu;
    setMenu(null);
    if (!p) return;
    // Seule l'adresse se regarde sans compte ; « signaler » n'arrive ici qu'en visite
    const raison = raisonsMenu[choix];
    if (raison && !exigerApresMenu(raison)) return;
    if (choix === "rescousse") rescousse(p);
    // La feuille de partage s'ouvre une fois le menu refermé (iOS refuse pendant qu'il glisse)
    if (choix === "inviter") {
      const lieu = lieuParId.get(p.lieuId);
      if (lieu) apresMenu.current = () => inviter(lieu);
    }
    if (choix === "adresse") router.push({ pathname: "/lieu/[id]", params: { id: String(p.lieuId) } });
    if (choix === "envoyer") ouvrirEnvoi(p.lieuId);
    if (choix === "pas-interesse") {
      masquerPublication(p.id);
      annoncer("Compris, on t'en montrera moins comme ça 🙈");
    }
  }

  function ouvrirEnvoi(lieuId: number) {
    setLieuEnvoye(lieuId);
    apresMenu.current = () => setEnvoiVisible(true);
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
    // À la modération (sans dire qui signale) ; sans réseau, il attend sur le téléphone
    void envoyerSignalementPublication({ publicationId: menu.id, lieuId: menu.lieuId, ...choix, date: new Date().toISOString() });
    masquerPublication(menu.id);
  }

  function partager(p: Publication) {
    const lieu = lieuParId.get(p.lieuId);
    if (!lieu) return;
    Share.share({ message: `${lieu.emoji} ${lieu.nom} (${ecrireQuartierVille(lieu)}) a besoin de monde ! Je l'ai trouvé sur SOS Miam 🛟 https://sosmiam.fr` }).catch(() => {});
  }

  // L'animation part dès l'appui sur le fil d'affichage ; le nouveau rendu (accessibilité, appuis) passe ensuite, sans la bloquer
  function basculerReduction() {
    const suivant = !infosReduites;
    reduction.value = withTiming(suivant ? 1 : 0, { duration: 260, easing: Easing.out(Easing.cubic) });
    startTransition(() => setInfosReduites(suivant));
  }

  const gestes = utiliserGestesStables<GestesPublication>({
    jaime: (p) => {
      if (exiger("jaime")) activite.basculerJaime(p.id);
    },
    doubleAppui: aimerParDoubleAppui,
    commentaires: (p) => {
      setCommentaires(p);
      setCommentairesAffiches(p);
    },
    garder: (p) => {
      if (!exiger("garder")) return;
      const nom = lieuParId.get(p.lieuId)?.nom ?? "Ce lieu";
      annoncer(activite.basculerGarde(p.lieuId) ? `🔖 ${nom} est gardé pour plus tard` : "Retiré de tes lieux gardés");
    },
    partager: (p) => {
      if (exiger("partager")) partager(p);
    },
    menu: (p) => {
      apresMenu.current = null;
      setMenu(p);
      setMenuAffiche(p);
    },
    voir: (p) => router.push({ pathname: "/lieu/[id]", params: { id: String(p.lieuId) } }),
    reduire: basculerReduction,
    // Comme sur Instagram : « Suivre » suit tout de suite, mais on ne désabonne jamais sans confirmation (un toucher de travers sur la vidéo)
    suivre: (p) => {
      if (!exiger("suivre")) return;
      const lieu = lieuParId.get(p.lieuId);
      const nom = p.auteur.type === "createur" ? `@${p.auteur.pseudo}` : (lieu?.nom ?? "ce lieu");
      const cle = calculerCleSuivi(p.auteur, p.lieuId);
      if (activite.estSuivi(cle)) {
        setAuteurSuivi({ nom, emoji: p.auteur.type === "createur" ? "🎬" : (lieu?.emoji ?? "📍"), cle });
        setNePlusSuivreVisible(true);
        return;
      }
      activite.basculerSuivi(cle);
      annoncer(`🔔 Tu suis maintenant ${nom} !`);
    },
    ouvrirAuteur: (p) => {
      if (p.auteur.type === "createur") router.push({ pathname: "/createur/[pseudo]", params: { pseudo: p.auteur.pseudo } });
      else router.push({ pathname: "/lieu/[id]", params: { id: String(p.lieuId) } });
    },
    glisserBarre: setBarreEnCours,
  });

  // Le menu (mémorisé) ne se redessine pas à chaque changement du fil
  const actionsMenu = utiliserGestesStables({
    choisir: choixMenu,
    signaler,
    fermer: () => setMenu(null),
    refermee: () => {
      const suite = apresMenu.current;
      apresMenu.current = null;
      suite?.();
    },
  });

  const actionsNePlusSuivre = utiliserGestesStables({
    confirmer: () => {
      setNePlusSuivreVisible(false);
      // Deux appuis avant que la feuille se referme : un seul désabonnement (et pas de réabonnement)
      if (auteurSuivi && activite.estSuivi(auteurSuivi.cle)) activite.basculerSuivi(auteurSuivi.cle);
    },
    // Une fois la feuille refermée : VoiceOver, revenu sur « Suivre », ne coupe plus l'annonce
    refermee: () => {
      if (auteurSuivi) annoncer(`Tu ne suis plus ${auteurSuivi.nom}, sans rancune 👋`);
    },
    fermer: () => setNePlusSuivreVisible(false),
  });

  const auChangementDeVisible = useCallback(({ viewableItems }: { viewableItems: ViewToken<Publication>[] }) => {
    // Jamais « aucune » en plein geste : on garde la dernière tant qu'une autre n'a pas pris la place
    const id = viewableItems[0]?.item.id;
    if (id !== undefined) setVisible(id);
  }, []);

  const lieuDuMenu = menuAffiche ? lieuParId.get(menuAffiche.lieuId) : undefined;
  const lieuCommente = commentairesAffiches ? lieuParId.get(commentairesAffiches.lieuId) : undefined;
  // La barre d'onglets est posée, transparente, sur le fil (voir src/app/(onglets)/_layout.tsx)
  const hauteurBarreOnglets = useBottomTabBarHeight();
  // Étiquette d'illustration et compteur de photos : juste sous l'en-tête, quelle que soit l'encoche du téléphone
  // En visite, la pastille « Crée ton compte » s'ajoute sous les onglets
  const hauteurEnTete = HAUTEUR_ENTETE_FIL + (invite ? HAUTEUR_PASTILLE_VISITE : 0);
  const hautIndications = marges.top + hauteurEnTete + 8;
  const surPremiere = liste.length === 0 || visible === null || visible === liste[0]?.id;

  return (
    <View
      style={{ flex: 1, backgroundColor: onglet === "actus" ? couleurs.creme : couleurs.nuit }}
      onLayout={(e) => setTaille({ largeur: e.nativeEvent.layout.width, hauteur: e.nativeEvent.layout.height })}
    >
      {focus ? (onglet === "actus" ? <BarreEtatTheme /> : <StatusBar style="light" />) : null}
      {taille.hauteur > 0 ? (
        onglet === "actus" ? (
          <ListeActus key={filtreActus.numero} filtreDepart={filtreActus.filtre} margeHaut={marges.top + hauteurEnTete} margeBas={hauteurBarreOnglets} />
        ) : liste.length > 0 ? (
          <FlatList
            ref={refListe}
            key={onglet}
            data={liste}
            keyExtractor={(p) => p.id}
            pagingEnabled
            scrollEnabled={!barreEnCours}
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            getItemLayout={(_, index) => ({ length: taille.hauteur, offset: taille.hauteur * index, index })}
            onViewableItemsChanged={auChangementDeVisible}
            viewabilityConfig={VISIBILITE}
            onEndReached={aUneSuite ? () => void chargerSuite() : undefined}
            onEndReachedThreshold={1.5}
            // Peu de publications montées à la fois : chaque vidéo a son lecteur. Les premières ne sont jamais démontées.
            initialNumToRender={2}
            maxToRenderPerBatch={2}
            windowSize={3}
            renderItem={({ item }) => {
              const lieu = lieuParId.get(item.lieuId);
              if (!lieu) return null;
              const km = calculerKmLieu(lieu, depart);
              return (
                <PostPublication
                  publication={item}
                  lieu={lieu}
                  km={km}
                  depuis={depuis}
                  largeur={taille.largeur}
                  hauteur={taille.hauteur}
                  raison={profil ? trouverRaisonLieu(lieu, profil, km, langue) : null}
                  aime={activite.aime(item.id)}
                  garde={activite.estGarde(lieu.id)}
                  suivi={activite.estSuivi(calculerCleSuivi(item.auteur, item.lieuId))}
                  avecCompte={profil !== null}
                  nombreCommentaires={nombreCommentaires(item)}
                  actif={focusDiffere && visible === item.id}
                  envolCoeur={coeurs[item.id] ?? 0}
                  envolBouee={bouees[item.id] ?? 0}
                  margeHaut={hautIndications + (surPremiere && item.id === liste[0]?.id ? hauteurBanniere : 0)}
                  margeBas={hauteurBarreOnglets}
                  reduit={infosReduites}
                  reduction={reduction}
                  gestes={gestes}
                />
              );
            }}
          />
        ) : (
          <FilSansPublication
            onglet={onglet}
            hauteur={taille.hauteur}
            margeHaut={marges.top + hauteurEnTete}
            margeBas={hauteurBarreOnglets}
            horsLigne={filHorsLigne}
            onVoirTout={() => setOnglet("tous")}
            onVoirAdresses={() => router.navigate("/explorer")}
            onAnnoncer={annoncer}
          />
        )
      ) : null}
      <EnTeteFil onglet={onglet} onChoisir={setOnglet} restantes={activite.restantes} haut={marges.top} invite={invite} onCreerCompte={creerCompte} />
      <BanniereThemeFil visible={surPremiere && onglet !== "actus"} haut={hautIndications} onHauteur={setHauteurBanniere} />
      {ACTUS_VISIBLES && onglet === "abonnements" && profil ? (
        <BandeauActusAbonnements
          haut={hautIndications + (surPremiere ? hauteurBanniere : 0)}
          onOuvrir={() => {
            setFiltreActus((f) => ({ filtre: "abonnements", numero: f.numero + 1 }));
            setOnglet("actus");
          }}
        />
      ) : null}
      <Annonce annonce={annonce} haut={marges.top + hauteurEnTete + 2} onFin={finAnnonce} />
      <MenuPublication
        visible={menu !== null}
        nomLieu={lieuDuMenu?.nom ?? ""}
        sauve={lieuDuMenu ? activite.aSauve(lieuDuMenu.id) : false}
        verifie={lieuDuMenu ? estLieuVerifie(lieuDuMenu) : true}
        restantes={activite.restantes}
        avecCompte={profil !== null}
        onChoisir={actionsMenu.choisir}
        onSignaler={actionsMenu.signaler}
        onFermer={actionsMenu.fermer}
        onRefermee={actionsMenu.refermee}
      />
      {commentairesAffiches && lieuCommente ? (
        <FeuilleCommentaires
          // Une autre publication : une feuille neuve (le brouillon d'une publication ne passe pas à la suivante)
          key={commentairesAffiches.id}
          visible={commentaires !== null}
          publicationId={commentairesAffiches.id}
          lieu={lieuCommente}
          onFermer={() => setCommentaires(null)}
        />
      ) : null}
      {lieuEnvoye !== null ? <EnvoyerAPote visible={envoiVisible} lieuId={lieuEnvoye} onFermer={() => setEnvoiVisible(false)} /> : null}
      {/* Préparée seulement au premier « Suivi » touché : rien de plus à dessiner à l'ouverture du fil */}
      {auteurSuivi ? (
        <FeuilleNePlusSuivre
          visible={nePlusSuivreVisible}
          nom={auteurSuivi.nom}
          emoji={auteurSuivi.emoji}
          onConfirmer={actionsNePlusSuivre.confirmer}
          onRefermee={actionsNePlusSuivre.refermee}
          onFermer={actionsNePlusSuivre.fermer}
        />
      ) : null}
    </View>
  );
}
