import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import type { CommentaireIdee } from "@sos-miam/commun/types/idees";
import { BlocFilCommentaireIdee } from "~/composants/idees-miamis/BlocFilCommentaireIdee";
import { CarteIdeeEnRelecture } from "~/composants/idees-miamis/CarteIdeeEnRelecture";
import { ChampCommentaireIdee } from "~/composants/idees-miamis/ChampCommentaireIdee";
import { ChargementIdees } from "~/composants/idees-miamis/ChargementIdees";
import { EnTeteIdee } from "~/composants/idees-miamis/EnTeteIdee";
import { EtapesIdee } from "~/composants/idees-miamis/EtapesIdee";
import { MenuContenuIdee, type ContenuIdeeAuMenu } from "~/composants/idees-miamis/MenuContenuIdee";
import { ReponseBrigade } from "~/composants/idees-miamis/ReponseBrigade";
import { VoteIdee } from "~/composants/idees-miamis/VoteIdee";
import { Annonce } from "~/composants/interface/Annonce";
import { BarreEcranMiamis } from "~/composants/miamis/BarreEcranMiamis";
import { ErreurMiamis } from "~/composants/miamis/ErreurMiamis";
import { EtatMiamis } from "~/composants/miamis/EtatMiamis";
import { TEXTES_IDEES_PAR_LANGUE } from "~/contenus/textes-idees";
import { expliquerGesteRateIdee } from "~/fonctions/idees-miamis/expliquer-geste-rate-idee";
import { rangerCommentairesIdee } from "~/fonctions/idees-miamis/ranger-commentaires-idee";
import { annoncerLecteurEcran } from "~/fonctions/interaction/annoncer-lecteur-ecran";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserIdeeMiamis } from "~/hooks/utiliser-idee-miamis";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  id: string;
};

type MenuOuvert = { contenu: ContenuIdeeAuMenu; commentaireId: string | null };

export function EcranIdee({ id }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_IDEES_PAR_LANGUE);
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const monId = utiliserMonId();
  const { bloques } = utiliserCommunaute();
  const etat = utiliserIdeeMiamis(id);
  const { idee, commentaires, erreur, relire } = etat;
  const champ = useRef<TextInput>(null);
  const [reponseA, setReponseA] = useState<CommentaireIdee | null>(null);
  const [menu, setMenu] = useState<MenuOuvert | null>(null);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const annoncer = useCallback((texte: string) => setAnnonce({ texte, numero: Date.now() }), []);

  const idsBloques = useMemo(() => new Set(bloques.map((p) => p.id)), [bloques]);
  const fils = useMemo(() => rangerCommentairesIdee(commentaires.filter((c) => !idsBloques.has(c.auteur.id))), [commentaires, idsBloques]);
  const nombre = fils.reduce((total, fil) => total + 1 + fil.reponses.length, 0);

  const revenir = () => (router.canGoBack() ? router.back() : router.replace({ pathname: "/potes/miamis/idees" }));

  async function voter(oui: boolean) {
    const rate = await etat.voter(oui);
    if (rate) annoncer(expliquerGesteRateIdee(rate, "vote", langue));
  }

  async function aimer(commentaire: CommentaireIdee, oui: boolean) {
    const rate = await etat.aimer(commentaire.id, oui);
    if (rate) annoncer(expliquerGesteRateIdee(rate, "jaime", langue));
  }

  function repondre(commentaire: CommentaireIdee) {
    setReponseA(commentaire);
    setTimeout(() => champ.current?.focus(), 50);
  }

  async function commenter(texte: string, reponseAId: string | null) {
    const rate = await etat.commenter(texte, reponseAId);
    if (!rate) setReponseA(null);
    return rate;
  }

  async function supprimer(ouvert: MenuOuvert) {
    if (ouvert.commentaireId) {
      const rate = await etat.supprimerCommentaire(ouvert.commentaireId);
      if (!rate && reponseA?.id === ouvert.commentaireId) setReponseA(null);
      return annoncer(rate ? expliquerGesteRateIdee(rate, "suppression", langue) : T.commentaireSupprime);
    }
    const rate = await etat.retirer();
    if (rate) return annoncer(expliquerGesteRateIdee(rate, "retrait", langue));
    annoncerLecteurEcran(T.ideeRetiree);
    revenir();
  }

  const ouvrirMenuIdee = () => {
    if (idee) setMenu({ contenu: { type: "idee", id: idee.id, auteur: idee.auteur, mien: idee.auteur?.id === monId }, commentaireId: null });
  };
  const boutonMenu =
    idee && idee.auteur ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={T.optionsIdee}
        hitSlop={8}
        onPress={ouvrirMenuIdee}
        className="h-11 w-11 items-center justify-center rounded-full active:opacity-60"
      >
        <Ionicons name="ellipsis-horizontal" size={22} color={couleurs.encre} />
      </Pressable>
    ) : undefined;

  const barre = <BarreEcranMiamis titre={T.barre} libelleRetour={T.retourBoite} onRetour={revenir} droite={boutonMenu} />;

  if (!idee) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
        {barre}
        {erreur === "idee-inconnue" ? (
          <View className="px-5 pt-6">
            <EtatMiamis emoji="💭" titre={T.introuvableTitre} texte={T.introuvableTexte} action={{ libelle: T.retourBoite, onPress: revenir }} />
          </View>
        ) : erreur ? (
          <View className="px-5 pt-6">
            <ErreurMiamis erreur={erreur} onReessayer={() => void relire()} />
          </View>
        ) : (
          <ChargementIdees texte={T.chargementIdee} />
        )}
      </SafeAreaView>
    );
  }

  const enRelecture = idee.statut === "en-relecture";
  const enTete = (
    <View className="gap-[18px] pb-4">
      <EnTeteIdee idee={idee} monId={monId} />
      {enRelecture ? <CarteIdeeEnRelecture /> : <VoteIdee idee={idee} monId={monId} idsBloques={idsBloques} occupe={etat.voteEnCours} onVoter={(oui) => void voter(oui)} />}
      {enRelecture ? null : <EtapesIdee statut={idee.statut} />}
      {idee.reponseBrigade ? <ReponseBrigade reponse={idee.reponseBrigade} /> : null}
      {enRelecture ? null : (
        <View className="flex-row items-baseline justify-between pt-1">
          <Text accessibilityRole="header" className="font-titre text-xl text-encre">
            {T.commentaires(nombre)}
          </Text>
          {nombre > 1 ? <Text className="font-texte text-[13px] text-gris">{T.plusAimes}</Text> : null}
        </View>
      )}
    </View>
  );

  function ouvrirMenuCommentaire(commentaire: CommentaireIdee) {
    setMenu({ contenu: { type: "commentaire", id: commentaire.id, auteur: commentaire.auteur, mien: commentaire.auteur.id === monId }, commentaireId: commentaire.id });
  }

  function supprimerDepuisMenu() {
    if (menu) void supprimer(menu);
  }

  return (
    <View className="flex-1 bg-creme">
      <KeyboardAvoidingView behavior={Platform.OS === "web" ? undefined : "padding"} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingTop: marges.top }}>
          {barre}
          <FlatList
            data={enRelecture ? [] : fils}
            keyExtractor={(fil) => fil.commentaire.id}
            renderItem={({ item }) => (
              <BlocFilCommentaireIdee
                fil={item}
                monId={monId}
                onAimer={(commentaire, oui) => void aimer(commentaire, oui)}
                onRepondre={repondre}
                onOptions={ouvrirMenuCommentaire}
              />
            )}
            ItemSeparatorComponent={() => <View className="h-4" />}
            ListHeaderComponent={enTete}
            ListEmptyComponent={enRelecture ? null : <Text className="font-texte text-sm leading-5 text-gris">{T.pasDeCommentaire}</Text>}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          />
          {enRelecture ? (
            <View style={{ height: marges.bottom }} />
          ) : (
            <ChampCommentaireIdee
              ref={champ}
              reponseA={reponseA}
              onAnnulerReponse={() => setReponseA(null)}
              onEnvoyer={commenter}
              occupe={etat.envoiCommentaire}
              margeBas={marges.bottom + 8}
            />
          )}
        </View>
      </KeyboardAvoidingView>
      <MenuContenuIdee contenu={menu?.contenu ?? null} onSupprimer={supprimerDepuisMenu} onFermer={() => setMenu(null)} />
      <Annonce annonce={annonce} haut={marges.top + 8} onFin={finAnnonce} />
    </View>
  );
}
