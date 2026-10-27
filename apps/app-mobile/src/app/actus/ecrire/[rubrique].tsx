import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ACCROCHE_ACTUS_MAX, CITATION_ACTUS_MAX, FIN_BON_PLAN_MAX_JOURS, PHOTOS_ACTUS_MAX, RUBRIQUES_ACTUS, TEXTE_ACTUS_MAX, TITRE_ACTUS_MAX,
} from "@sos-miam/commun/regles/actus";
import type { ChampArticleActus } from "@sos-miam/commun/types/actus";
import { validerArticleActus } from "@sos-miam/commun/validation/valider-article-actus";
import { ApercuArticleActus } from "~/composants/actus/ApercuArticleActus";
import { ChampCouvertureActus } from "~/composants/actus/ChampCouvertureActus";
import { ChampPhotosActus } from "~/composants/actus/ChampPhotosActus";
import { ChoixCollaborationActus } from "~/composants/actus/ChoixCollaborationActus";
import { ChoixLieuxActus } from "~/composants/actus/ChoixLieuxActus";
import { EncartReserveAmbassadeurs } from "~/composants/actus/EncartReserveAmbassadeurs";
import { EnTeteEcranActus } from "~/composants/actus/EnTeteEcranActus";
import { EnvoyeActus } from "~/composants/actus/EnvoyeActus";
import { FeuilleChoixLieuActus } from "~/composants/actus/FeuilleChoixLieuActus";
import { Annonce } from "~/composants/interface/Annonce";
import { BarreEtatTheme } from "~/composants/interface/BarreEtatTheme";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/textes-actus";
import { ADRESSE_PROGRAMME_AMBASSADEUR, TEXTES_ECRIRE_ACTUS_PAR_LANGUE } from "~/contenus/textes-ecrire-actus";
import type { ArticleActusAffiche } from "~/contenus/type-article-actus";
import { citerLieuActus } from "~/fonctions/actus/citer-lieu-actus";
import { construireApercuActus } from "~/fonctions/actus/construire-apercu-actus";
import { ecrireAvatarPublic } from "~/fonctions/compte/ecrire-avatar-public";
import { formaterDateIso } from "~/fonctions/dates/formater-date-iso";
import { formaterSaisieDate } from "~/fonctions/dates/formater-saisie-date";
import { lireDateSaisie } from "~/fonctions/dates/lire-date-saisie";
import { utiliserBrouillonActus } from "~/hooks/utiliser-brouillon-actus";
import { utiliserChoixPhotoActus } from "~/hooks/utiliser-choix-photo-actus";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserFermerPile } from "~/hooks/utiliser-fermer-pile";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserPeutEcrireActus } from "~/hooks/utiliser-peut-ecrire-actus";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const AUCUNE_ERREUR: ReadonlySet<ChampArticleActus> = new Set();

export default function EcranEcrireArticleActus() {
  const couleurs = utiliserCouleurs();
  const marges = useSafeAreaInsets();
  const router = useRouter();
  const fermer = utiliserFermerPile();
  const T = utiliserTextes(TEXTES_ECRIRE_ACTUS_PAR_LANGUE);
  const F = T.formulaire;
  const TA = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE);
  const { rubrique: brute } = useLocalSearchParams<{ rubrique: string }>();
  const rubrique = RUBRIQUES_ACTUS.find((r) => r === brute) ?? "portrait";
  const peutEcrire = utiliserPeutEcrireActus();
  const { brouillon, changer, terminer } = utiliserBrouillonActus(rubrique);
  const { profil, avatar } = utiliserProfil();
  const { modesOuverts } = utiliserModes();
  const { lieux } = utiliserLieux();
  const lieuParId = useMemo(() => new Map(lieux.map((l) => [l.id, l])), [lieux]);
  const lieuxCites = useMemo(() => brouillon.lieux.flatMap((id) => {
    const lieu = lieuParId.get(id);
    return lieu ? [citerLieuActus(lieu)] : [];
  }), [brouillon.lieux, lieuParId]);
  const photo = utiliserChoixPhotoActus();
  const [cible, setCible] = useState<"couverture" | "photos" | null>(null);
  const [feuilleLieu, setFeuilleLieu] = useState(false);
  const [apercu, setApercu] = useState<ArticleActusAffiche | null>(null);
  const [tente, setTente] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);

  const finLe = lireDateSaisie(brouillon.finSaisie);
  const validation = validerArticleActus(
    { ...brouillon, couverture: brouillon.couverture !== null, photos: brouillon.photos.length, finLe },
    formaterDateIso(new Date()),
  );
  const erreurs = tente && !validation.ok ? new Set(validation.champs) : AUCUNE_ERREUR;
  const erreur = (champ: ChampArticleActus) => (erreurs.has(champ) ? F.erreurs[champ] : null);
  const erreurPhoto = photo.erreur === "galerie" ? F.galerieFermee : photo.erreur === "illisible" ? F.illisible : null;
  const longueurTexte = brouillon.texte.trim().length;

  async function choisirCouverture() {
    setCible("couverture");
    const uri = await photo.choisir();
    if (uri) changer("couverture", uri);
  }

  async function ajouterPhoto() {
    setCible("photos");
    const uri = await photo.choisir();
    if (uri) changer("photos", [...brouillon.photos, uri].slice(0, PHOTOS_ACTUS_MAX));
  }

  function montrerApercu() {
    const auteur = { id: 0, prenom: profil?.prenom ?? "", avatar: ecrireAvatarPublic(avatar), ambassadeur: modesOuverts.includes("ambassadeur") };
    setApercu(construireApercuActus(brouillon, lieuxCites, auteur));
  }

  function envoyer() {
    setTente(true);
    if (!validation.ok) {
      setAnnonce({ texte: F.aRevoir(validation.champs.length), numero: Date.now() });
      return;
    }
    void terminer();
    setEnvoye(true);
  }

  if (envoye) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
        <BarreEtatTheme />
        <EnvoyeActus
          titre={T.envoye.titre}
          texte={T.envoye.texte}
          mesArticles={T.envoye.mesArticles}
          retour={T.envoye.retour}
          onMesArticles={() => router.replace("/actus/mes-articles")}
          onRetour={() => router.dismissTo("/")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <BarreEtatTheme />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <EnTeteEcranActus titre={TA.rubriques[rubrique]} detail={F.brouillonGarde} retour={F.retour} onRetour={fermer} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-6 px-5 pb-10 pt-2">
          {peutEcrire ? null : (
            <EncartReserveAmbassadeurs titre={T.rubrique.reserveTitre} texte={T.rubrique.reserveTexte} bouton={T.rubrique.devenir} adresse={ADRESSE_PROGRAMME_AMBASSADEUR} />
          )}
          <ChampCouvertureActus
            uri={brouillon.couverture}
            preparation={photo.preparation && cible === "couverture"}
            erreur={(cible === "couverture" ? erreurPhoto : null) ?? erreur("couverture")}
            T={F}
            onChoisir={() => void choisirCouverture()}
          />
          <ChampTexte
            libelle={F.titre}
            valeur={brouillon.titre}
            onChangeTexte={(texte) => changer("titre", texte)}
            maxLength={TITRE_ACTUS_MAX}
            aide={F.compteur(brouillon.titre.length, TITRE_ACTUS_MAX)}
            erreur={erreur("titre")}
          />
          <ChampTexte
            libelle={F.accroche}
            valeur={brouillon.accroche}
            onChangeTexte={(texte) => changer("accroche", texte)}
            maxLength={ACCROCHE_ACTUS_MAX}
            aide={F.compteur(brouillon.accroche.length, ACCROCHE_ACTUS_MAX)}
            erreur={erreur("accroche")}
          />
          <View className="gap-1">
            <Text className="font-texte text-sm leading-5 text-gris">{F.texteAide[rubrique]}</Text>
            <ChampTexte
              libelle={F.texte}
              valeur={brouillon.texte}
              onChangeTexte={(texte) => changer("texte", texte)}
              multiline
              textAlignVertical="top"
              maxLength={TEXTE_ACTUS_MAX + 200}
              hauteurMin={220}
              aide={`${F.compteur(longueurTexte, TEXTE_ACTUS_MAX)} · ${F.paragraphes}`}
              erreur={erreur("texte")}
            />
          </View>
          <ChampTexte
            libelle={F.citation}
            mention={F.facultatif}
            valeur={brouillon.citation}
            onChangeTexte={(texte) => changer("citation", texte)}
            maxLength={CITATION_ACTUS_MAX}
            aide={F.citationAide}
            erreur={erreur("citation")}
          />
          <ChampPhotosActus
            photos={brouillon.photos}
            preparation={photo.preparation && cible === "photos"}
            T={F}
            onAjouter={() => void ajouterPhoto()}
            onRetirer={(index) => changer("photos", brouillon.photos.filter((_, i) => i !== index))}
          />
          {cible === "photos" && erreurPhoto ? <Text className="font-texte text-sm text-rouge-texte">{erreurPhoto}</Text> : null}
          <ChoixLieuxActus
            rubrique={rubrique}
            lieux={lieuxCites}
            erreur={erreur("lieux")}
            T={F}
            onAjouter={() => setFeuilleLieu(true)}
            onChanger={(ids) => changer("lieux", ids)}
          />
          {rubrique === "bon-plan" ? (
            <ChampTexte
              libelle={F.fin}
              valeur={brouillon.finSaisie}
              onChangeTexte={(texte) => changer("finSaisie", formaterSaisieDate(texte))}
              keyboardType="number-pad"
              placeholder={F.finExemple}
              aide={F.finAide(FIN_BON_PLAN_MAX_JOURS)}
              erreur={erreur("fin")}
            />
          ) : null}
          <ChoixCollaborationActus valeur={brouillon.collaboration} erreur={erreur("collaboration")} T={F} onChanger={(valeur) => changer("collaboration", valeur)} />
          <View className="gap-2 rounded-[18px] border-2 border-ligne bg-carte p-4">
            <Text className="font-texte text-sm leading-5 text-encre">{F.alcool}</Text>
            <Text className="font-texte text-sm leading-5 text-encre">{F.personnes}</Text>
          </View>
          {tente && !validation.ok ? (
            <Text accessibilityLiveRegion="polite" className="font-texte-gras text-sm text-rouge-texte">
              {F.aRevoir(validation.champs.length)}
            </Text>
          ) : null}
          <View className="gap-3">
            <Bouton libelle={F.envoyer} desactive={!peutEcrire} onPress={envoyer} />
            <Bouton libelle={F.apercu} variante="blanc" onPress={montrerApercu} />
            <Text className="text-center font-texte text-[13px] text-gris">{F.cloche}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <FeuilleChoixLieuActus
        visible={feuilleLieu}
        lieux={lieux}
        exclus={brouillon.lieux}
        T={F}
        onChoisir={(lieu) => {
          setFeuilleLieu(false);
          changer("lieux", [...brouillon.lieux, lieu.id]);
        }}
        onFermer={() => setFeuilleLieu(false)}
      />
      <ApercuArticleActus article={apercu} titre={F.apercuTitre} fermer={F.apercuFermer} onFermer={() => setApercu(null)} />
      <Annonce annonce={annonce} haut={marges.top + 12} onFin={finAnnonce} />
    </SafeAreaView>
  );
}
