import { router, type Href } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import type { FilCommentaire } from "@sos-miam/commun/fonctions/commentaires/trier-commentaires";
import type { Commentaire } from "@sos-miam/commun/types/commentaires";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { BlocCommentaire } from "~/composants/fil/BlocCommentaire";
import { BoutonCommentairesAnciens } from "~/composants/fil/BoutonCommentairesAnciens";
import { ChampCommentaire } from "~/composants/fil/ChampCommentaire";
import { ChampCommentaireInvite } from "~/composants/fil/ChampCommentaireInvite";
import { EnTeteCommentaires } from "~/composants/fil/EnTeteCommentaires";
import { EtatListeCommentaires } from "~/composants/fil/EtatListeCommentaires";
import { MenuCommentaire } from "~/composants/fil/MenuCommentaire";
import { Annonce } from "~/composants/interface/Annonce";
import { BandeauAnnuler } from "~/composants/interface/BandeauAnnuler";
import { FeuilleCreerComptePosee } from "~/composants/invite/FeuilleCreerComptePosee";
import { SignalerContenu } from "~/composants/signalement/SignalerContenu";
import { trouverAuteurCommentaire } from "~/fonctions/commentaires/trouver-auteur-commentaire";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { utiliserBandeauAnnuler } from "~/hooks/utiliser-bandeau-annuler";
import { utiliserCommentairesPublication, type ResultatCommentaire } from "~/hooks/utiliser-commentaires-publication";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import type { RaisonCompte } from "~/hooks/utiliser-compte-requis";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserOrdreCommentaires } from "~/hooks/utiliser-ordre-commentaires";
import { utiliserProfil } from "~/hooks/utiliser-profil";

type Props = {
  visible: boolean;
  publicationId: string;
  /** Lieu de la publication : il parle sous son nom quand il répond */
  lieu: Pick<Lieu, "nom" | "emoji">;
  onFermer: () => void;
};

/** Le commentaire sous lequel ta réponse se range (toujours du premier niveau), la personne à qui tu réponds et son nom */
type Reponse = { id: string; auteurs: string[]; nom: string };

// « il y a 5 min » se met à jour tant que la feuille est ouverte
const RAFRAICHISSEMENT = 30_000;
// Le lecteur d'écran est replacé une fois la feuille redevenue lisible (le menu des options la cache pendant qu'il est ouvert)
const DELAI_FOCUS = 150;
// Après une suppression ou un blocage, le message part juste après le replacement : sinon, le titre relu le couperait
const DELAI_ANNONCE_APRES_FOCUS = 400;
// « Je m'inscris », une mention touchée : l'écran s'ouvre une fois la feuille refermée. Seul iOS le dit ; ailleurs, on attend la fin de sa glissade
const DUREE_FERMETURE = 450;
// Sur iOS, au cas où la fin de fermeture ne viendrait pas : on ouvre l'écran quand même
const SECOURS_IOS = 1000;
// Le bandeau « Masqué · Annuler » se pose au-dessus du champ (et de la pastille « au nom du lieu »)
const HAUTEUR_CHAMP_GERANT = 112;

/**
 * Les commentaires d'une publication, dans une feuille qui monte du bas comme sur TikTok (la vidéo reste visible au-dessus) :
 * la réponse du lieu en tête, puis les plus aimés ; réponses repliables ; champ en bas avec mentions ; options de chaque commentaire.
 * Démo : les commentaires du téléphone ; visite et compte : ceux du serveur (utiliserCommentairesPublication).
 * En visite sans compte, on lit tout ; écrire, répondre, aimer et les options posent « Crée ton compte » par-dessus la liste
 * (sans la refermer : après « Plus tard », on reprend la lecture là où on en était). Pas d'appui long sur un commentaire.
 * Le gérant du lieu peut répondre au nom du lieu, et masquer un commentaire (il part en modération, « Annuler » juste après).
 */
export function FeuilleCommentaires({ visible, publicationId, lieu, onFermer }: Props) {
  const marges = useSafeAreaInsets();
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const communaute = utiliserCommunaute();
  const { trouverPote } = communaute;
  const discussion = utiliserCommentairesPublication(publicationId);
  const { fils, nombre, peutRepondreCommeLieu: gerant } = discussion;
  // En démo, la liste attend aussi que la communauté soit lue sur le téléphone (comme avant)
  const pret = discussion.pret && (discussion.source !== "demo" || communaute.pret);
  const monId = utiliserMonId();
  const { profil } = utiliserProfil();
  const avecCompte = profil !== null;
  const { bandeau, montrer: montrerBandeau, fermer: fermerBandeau } = utiliserBandeauAnnuler();
  // L'écran à ouvrir une fois la feuille refermée (« Je m'inscris », une mention touchée)
  const apresFermeture = useRef<Href | null>(null);
  const minuterieFermeture = useRef<ReturnType<typeof setTimeout> | null>(null);
  const champ = useRef<TextInput>(null);
  const liste = useRef<FlatList<FilCommentaire>>(null);
  const titreFeuille = useRef<Text>(null);
  const boutonEcrire = useRef<View>(null);
  // Ce qui a ouvert les options (le bouton « ⋯ » ou le commentaire, par appui long) : le lecteur d'écran y revient à la fermeture
  const declencheurOptions = useRef<View | null>(null);
  // Pareil pour « Crée ton compte » posé sur la feuille (visite sans compte)
  const declencheurInvitation = useRef<View | null>(null);
  const [texte, setTexte] = useState("");
  const [reponse, setReponse] = useState<Reponse | null>(null);
  const [edition, setEdition] = useState<string | null>(null);
  const [deplies, setDeplies] = useState<Record<string, boolean>>({});
  const [options, setOptions] = useState<Commentaire | null>(null);
  const [signale, setSignale] = useState<Commentaire | null>(null);
  const [invitation, setInvitation] = useState<RaisonCompte | null>(null);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const [clavierOuvert, setClavierOuvert] = useState(false);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  // Gérant : le prochain commentaire part au nom du lieu
  const [commeLieu, setCommeLieu] = useState(false);
  // Ordre des commentaires à l'ouverture : un J'aime ne fait pas sauter un commentaire sous ton doigt
  const { ordonnes, oublier: oublierOrdre } = utiliserOrdreCommentaires(fils, pret && !discussion.ratee);

  // À chaque ouverture, on repart de la liste (le brouillon reste, sauf une modification en cours)
  const [ouvert, setOuvert] = useState(visible);
  if (visible !== ouvert) {
    setOuvert(visible);
    if (visible) {
      setOptions(null);
      setSignale(null);
      setInvitation(null);
      // Un message pas encore effacé à la fermeture ne revient pas à la réouverture
      setAnnonce(null);
      setReponse(null);
      if (edition) setTexte("");
      setEdition(null);
      oublierOrdre();
      fermerBandeau();
    }
  }

  // Rouverte sur la même publication : les commentaires sont relus (à la première ouverture, le hook vient de les lire)
  const dejaOuverte = useRef(false);
  const { relire } = discussion;
  useEffect(() => {
    if (!visible) return;
    if (dejaOuverte.current) void relire();
    dejaOuverte.current = true;
    // relire change à chaque relecture : seulement à l'ouverture
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    setMaintenant(Date.now());
    const minuterie = setInterval(() => setMaintenant(Date.now()), RAFRAICHISSEMENT);
    return () => clearInterval(minuterie);
  }, [visible]);

  // Clavier ouvert : il cache déjà le bord du téléphone, pas besoin de laisser sa place sous le champ
  useEffect(() => {
    const montre = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setClavierOuvert(true));
    const cache = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setClavierOuvert(false));
    return () => {
      montre.remove();
      cache.remove();
    };
  }, []);

  useEffect(
    () => () => {
      if (minuterieFermeture.current) clearTimeout(minuterieFermeture.current);
    },
    [],
  );

  /** Vrai avec un compte ; sinon « Crée ton compte » se pose sur la feuille (la liste reste où elle était) */
  function exigerCompte(raison: RaisonCompte, declencheur: View | null = null): boolean {
    if (avecCompte) return true;
    Keyboard.dismiss();
    declencheurInvitation.current = declencheur;
    setInvitation(raison);
    return false;
  }

  /** « Plus tard » : retour à la lecture, et le lecteur d'écran revient sur le geste touché */
  function fermerInvitation() {
    setInvitation(null);
    setTimeout(() => deplacerFocusLecteurEcran(declencheurInvitation.current ?? titreFeuille.current), DELAI_FOCUS);
  }

  // La feuille se referme, puis l'écran s'ouvre (plus tôt, il passerait dessous ; et VoiceOver, qui revient sur 💬 à la fermeture, le quitterait)
  function fermerPuisOuvrir(destination: Href) {
    if (apresFermeture.current) return;
    apresFermeture.current = destination;
    setInvitation(null);
    onFermer();
    minuterieFermeture.current = setTimeout(finirFermeture, Platform.OS === "ios" ? SECOURS_IOS : DUREE_FERMETURE);
  }

  function finirFermeture() {
    if (minuterieFermeture.current) clearTimeout(minuterieFermeture.current);
    minuterieFermeture.current = null;
    const destination = apresFermeture.current;
    if (!destination) return;
    apresFermeture.current = null;
    router.push(destination);
  }

  const inscrire = () => fermerPuisOuvrir("/compte");
  // Les profils sont réservés aux inscrits : en visite, « Crée ton compte » se pose sur la feuille
  function ouvrirProfil(id: string) {
    if (exigerCompte("potes")) fermerPuisOuvrir({ pathname: "/potes/profil/[id]", params: { id } });
  }

  const annoncer = (message: string) => setAnnonce({ texte: message, numero: Date.now() });
  /** Replace le lecteur d'écran sur le titre de la feuille (ce qu'on vient de toucher a disparu), puis dit ce qui s'est passé */
  const revenirAuTitre = (message?: string) => {
    setTimeout(() => deplacerFocusLecteurEcran(titreFeuille.current), DELAI_FOCUS);
    if (message) setTimeout(() => annoncer(message), DELAI_ANNONCE_APRES_FOCUS);
  };
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  // « Quelqu'un » : un compte supprimé
  const nomDe = (c: Commentaire) => (c.auteur === "lieu" ? lieu.nom : (trouverAuteurCommentaire(c, trouverPote)?.prenom ?? "Quelqu'un"));
  // Tous les commentaires déjà lus, réponses comprises : quand ce nombre bouge, la suite est arrivée
  const charges = fils.reduce((total, f) => total + 1 + f.reponses.length, 0);

  function repondre(commentaire: Commentaire, fil: Commentaire, declencheur: View | null) {
    if (!exigerCompte("commenter", declencheur)) return;
    let brouillon = edition ? "" : texte;
    setEdition(null);
    setReponse({ id: fil.id, auteurs: [fil.auteur, commentaire.auteur], nom: nomDe(commentaire) });
    // Réponse à une réponse : tout se range sous le même commentaire, alors on mentionne la personne
    const pote = commentaire.id !== fil.id && commentaire.auteur !== monId ? trouverAuteurCommentaire(commentaire, trouverPote) : null;
    if (pote?.pseudo && !brouillon.includes(`@${pote.pseudo}`)) brouillon = `@${pote.pseudo} ${brouillon}`;
    setTexte(brouillon);
    champ.current?.focus();
  }

  function modifier(commentaire: Commentaire) {
    setOptions(null);
    setReponse(null);
    setEdition(commentaire.id);
    setTexte(commentaire.texte);
    champ.current?.focus();
  }

  // Attend la réponse du serveur ; si ça coince, le texte reste dans le champ (le champ dit pourquoi)
  async function envoyer(): Promise<ResultatCommentaire> {
    if (edition) {
      const id = edition;
      const verdict = await discussion.modifier(id, texte);
      // Le commentaire n'est plus là : la liste se relit
      if (verdict === "introuvable") discussion.relire();
      if (verdict !== "ok") return verdict;
      setEdition((e) => (e === id ? null : e));
      setTexte("");
      Keyboard.dismiss();
      annoncer("C'est corrigé ✏️");
      return verdict;
    }
    const sous = reponse;
    const auNomDuLieu = gerant && commeLieu;
    const verdict = await discussion.commenter(texte, sous?.id, auNomDuLieu);
    if (verdict === "introuvable" && sous) {
      // Le commentaire auquel tu réponds est parti : le prochain envoi sera un commentaire tout court
      setReponse(null);
      discussion.relire();
    }
    if (verdict !== "ok") return verdict;
    if (sous) setDeplies((d) => ({ ...d, [sous.id]: true }));
    else liste.current?.scrollToOffset({ offset: 0, animated: true });
    setReponse(null);
    setTexte("");
    Keyboard.dismiss();
    annoncer(auNomDuLieu ? "Envoyé au nom du lieu 💬" : sous ? "Réponse envoyée 💬" : "Commentaire envoyé 💬");
    return verdict;
  }

  // Sans compte : « rejoindre la discussion » (aimer un commentaire en fait partie, la raison « jaime » parle de la publication)
  function aimer(commentaire: Commentaire, declencheur: View | null) {
    if (exigerCompte("commenter", declencheur)) discussion.basculerJaime(commentaire.id);
  }

  // Le « Sois le premier » de la liste vide : le champ, ou (sans compte) la feuille « Crée ton compte »
  function ecrire() {
    if (exigerCompte("commenter", boutonEcrire.current)) champ.current?.focus();
  }

  function ouvrirOptions(commentaire: Commentaire, declencheur: View | null) {
    // Sans compte : signaler ou bloquer (un ancien commentaire à toi : le modifier) demande un compte
    if (!exigerCompte(commentaire.auteur === monId ? "commenter" : "signaler", declencheur)) return;
    Keyboard.dismiss();
    declencheurOptions.current = declencheur;
    setOptions(commentaire);
  }

  /** Options fermées sans rien faire (« Annuler », le fond, retour) : le lecteur d'écran revient sur ce qui les a ouvertes */
  function fermerOptions() {
    setOptions(null);
    setTimeout(() => deplacerFocusLecteurEcran(declencheurOptions.current ?? titreFeuille.current), DELAI_FOCUS);
  }

  function supprimer(commentaire: Commentaire) {
    setOptions(null);
    discussion.supprimer(commentaire.id);
    if (edition === commentaire.id) {
      setEdition(null);
      setTexte("");
    }
    if (reponse?.id === commentaire.id) setReponse(null);
    revenirAuTitre("Commentaire supprimé 🗑️");
  }

  // Gérant : il disparaît tout de suite (et part en modération), « Annuler » le remet
  function masquer(commentaire: Commentaire) {
    setOptions(null);
    if (reponse?.id === commentaire.id) setReponse(null);
    revenirAuTitre();
    montrerBandeau("Commentaire masqué, parti en modération 🙈", () => void changerMasque(commentaire.id, false));
    void changerMasque(commentaire.id, true);
  }

  async function changerMasque(id: string, masque: boolean) {
    const erreur = await discussion.masquerCommeLieu(id, masque);
    if (!erreur) return;
    if (masque) fermerBandeau();
    const message = MESSAGES_SERVICE[erreur];
    annoncer(`Oups, ${masque ? "pas masqué" : "pas remis"}. ${message.titre} ${message.emoji}`);
  }

  function bloquer(commentaire: Commentaire) {
    const nom = nomDe(commentaire);
    setOptions(null);
    communaute.bloquer(commentaire.auteur);
    if (reponse?.auteurs.includes(commentaire.auteur)) setReponse(null);
    revenirAuTitre(`C'est fait, tu ne verras plus ${nom} ici 🚫`);
  }

  // Le signalement prend la place de la liste et place lui-même le lecteur d'écran sur son titre
  function signaler(commentaire: Commentaire) {
    setOptions(null);
    Keyboard.dismiss();
    setSignale(commentaire);
  }

  // Retour à la liste (qui vient d'être remontée) : le lecteur d'écran repart du titre
  function finSignalement() {
    if (signale && reponse?.id === signale.id) setReponse(null);
    setSignale(null);
    revenirAuTitre();
  }

  // Retour Android et geste d'échappement de VoiceOver : on ferme d'abord ce qui est par-dessus
  function reculer() {
    if (invitation) fermerInvitation();
    else if (options) fermerOptions();
    else if (signale) finSignalement();
    else onFermer();
  }

  return (
    <Modal visible={visible} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={reculer} onDismiss={finirFermeture}>
      {/* « padding » sur les deux systèmes : en bord à bord, Android ne redimensionne plus la fenêtre pour le clavier */}
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
        accessibilityElementsHidden={!!options || !!invitation}
        importantForAccessibility={options || invitation ? "no-hide-descendants" : "auto"}
      >
        {/* Le haut reste transparent : la vidéo continue au-dessus, comme sur TikTok */}
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer les commentaires" onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/20" />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={reculer}
          // flexShrink : clavier ouvert, la feuille rétrécit et la liste avec, le champ reste juste au-dessus du clavier
          style={{ height: hauteurEcran * 0.7, flexShrink: 1 }}
          className="rounded-t-3xl border-t-2 border-encre bg-creme pt-3"
        >
          <View className="mb-1 h-1.5 w-12 self-center rounded-full bg-ligne" />

          {signale ? (
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-5 pt-2" contentContainerStyle={{ paddingBottom: marges.bottom + 16 }}>
              <SignalerContenu
                cible="commentaire"
                cibleId={signale.id}
                sujet={`le commentaire de ${nomDe(signale)}`}
                onTermine={finSignalement}
              />
            </ScrollView>
          ) : (
            <>
              <EnTeteCommentaires nombre={nombre} demo={discussion.source === "demo"} onFermer={onFermer} refTitre={titreFeuille} />

              <FlatList
                ref={liste}
                data={ordonnes}
                keyExtractor={(f) => f.commentaire.id}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
                contentContainerClassName="px-5 pb-4 pt-1"
                contentContainerStyle={{ flexGrow: 1 }}
                ListEmptyComponent={
                  <EtatListeCommentaires
                    ref={boutonEcrire}
                    etat={!pret ? "chargement" : discussion.ratee ? "ratee" : "vide"}
                    onReessayer={discussion.relire}
                    onEcrire={ecrire}
                  />
                }
                // Une relecture ratée au-dessus d'une liste déjà là : on garde ce qu'on avait, et on peut réessayer
                ListHeaderComponent={
                  discussion.ratee && ordonnes.length > 0 ? <EtatListeCommentaires etat="ratee" compact onReessayer={discussion.relire} onEcrire={ecrire} /> : null
                }
                ListFooterComponent={discussion.suite ? <BoutonCommentairesAnciens onCharger={discussion.chargerSuite} charges={charges} /> : null}
                renderItem={({ item }) => (
                  <BlocCommentaire
                    fil={item}
                    lieu={lieu}
                    maintenant={maintenant}
                    // Par défaut, les réponses du lieu se montrent tout de suite
                    deplie={deplies[item.commentaire.id] ?? item.reponses.some((r) => r.auteur === "lieu")}
                    onBasculer={(id) => setDeplies((d) => ({ ...d, [id]: !(d[id] ?? item.reponses.some((r) => r.auteur === "lieu")) }))}
                    onRepondre={repondre}
                    onAimer={aimer}
                    onOptions={ouvrirOptions}
                    onOuvrirProfil={ouvrirProfil}
                    appuiLong={avecCompte}
                    gerant={gerant}
                  />
                )}
              />

              {avecCompte ? (
                <ChampCommentaire
                  ref={champ}
                  valeur={texte}
                  onChanger={setTexte}
                  reponseA={reponse?.nom ?? null}
                  onAnnulerReponse={() => setReponse(null)}
                  edition={edition !== null}
                  onAnnulerEdition={() => {
                    setEdition(null);
                    setTexte("");
                  }}
                  onEnvoyer={envoyer}
                  margeBas={clavierOuvert ? 8 : marges.bottom + 8}
                  lieuGere={gerant ? lieu : null}
                  commeLieu={commeLieu}
                  onCommeLieu={setCommeLieu}
                />
              ) : (
                <ChampCommentaireInvite onCreerCompte={(bouton) => exigerCompte("commenter", bouton)} margeBas={marges.bottom + 8} />
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      <MenuCommentaire
        commentaire={options}
        nomAuteur={options ? nomDe(options) : ""}
        onModifier={modifier}
        onSupprimer={supprimer}
        onSignaler={signaler}
        onBloquer={bloquer}
        onMasquer={masquer}
        onFermer={fermerOptions}
        gerant={gerant}
      />
      <BandeauAnnuler bandeau={bandeau} bas={marges.bottom + HAUTEUR_CHAMP_GERANT} onFermer={fermerBandeau} />
      <FeuilleCreerComptePosee raison={invitation} onInscrire={inscrire} onFermer={fermerInvitation} />
      <Annonce annonce={annonce} haut={marges.top + 12} onFin={finAnnonce} />
    </Modal>
  );
}
