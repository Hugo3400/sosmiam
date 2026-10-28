import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform, Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { LigneReglage } from "~/composants/reglages/LigneReglage";
import { SectionMesConnexions } from "~/composants/reglages/SectionMesConnexions";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { VueDelierConnexion } from "~/composants/reglages/VueDelierConnexion";
import { VueRelierConnexion } from "~/composants/reglages/VueRelierConnexion";
import { type FournisseurConnexion, MESSAGES_MES_CONNEXIONS_PAR_LANGUE } from "~/contenus/mes-connexions";
import { TEXTES_REGLAGES_COMPTE_PAR_LANGUE } from "~/contenus/textes-reglages-compte";
import { lancerConnexionApple } from "~/fonctions/compte/lancer-connexion-apple";
import { lancerConnexionGoogle } from "~/fonctions/compte/lancer-connexion-google";
import { annoncerLecteurEcran } from "~/fonctions/interaction/annoncer-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserEffacementLocal } from "~/hooks/utiliser-effacement-local";
import { montrerErreurCompte } from "~/hooks/utiliser-entree-compte";
import { type ResultatMesConnexions, utiliserMesConnexions } from "~/hooks/utiliser-mes-connexions";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Vue = "principal" | "mot-de-passe" | "supprimer" | "delier" | "relier";
type Confirmation = "deconnecter" | "partout" | null;

const MOT_DE_PASSE_MIN = 12;
// Apple ne se lance que sur un iPhone, Google pas dans l'aperçu web : on ne propose pas une confirmation impossible
const APPLE_ICI = Platform.OS === "ios";
const GOOGLE_ICI = Platform.OS !== "web";

/**
 * « Mon compte » (compte connecté) : l'e-mail et sa confirmation, tes clés pour entrer (mot de passe, Apple, Google : relier,
 * délier, ajouter un mot de passe), se déconnecter (ici ou partout), supprimer son compte. La suppression demande le mot de passe, ou une nouvelle connexion Apple ou Google : une session
 * seule ne suffit jamais (un téléphone volé ne peut pas effacer le compte). Après une déconnexion ou une suppression, le
 * téléphone oublie tout et l'app repart à la bienvenue.
 */
export default function MonCompte() {
  const router = useRouter();
  const T = utiliserTextes(TEXTES_REGLAGES_COMPTE_PAR_LANGUE);
  const messagesMesConnexions = utiliserTextes(MESSAGES_MES_CONNEXIONS_PAR_LANGUE);
  const { compte, comptes, ouvrir, fermer, rafraichir } = utiliserSession();
  const effacement = utiliserEffacementLocal();
  const mesConnexions = utiliserMesConnexions();
  const { connexions } = mesConnexions;
  const [vue, setVue] = useState<Vue>("principal");
  const [aDelier, setADelier] = useState<FournisseurConnexion>("apple");
  const [aRelier, setARelier] = useState<FournisseurConnexion>("apple");
  const [lienMotDePasse, setLienMotDePasse] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [lienEnvoye, setLienEnvoye] = useState(false);
  const [actuel, setActuel] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void rafraichir();
  }, [rafraichir]);

  // Le mot de réussite s'affiche en haut de l'écran, souvent hors de vue : il se dit aussi à voix haute
  useEffect(() => {
    if (message) annoncerLecteurEcran(message);
  }, [message]);

  /** Une réussite s'affiche en haut de l'écran ; une erreur, dans une alerte (rien si c'est annulé) */
  function montrerResultat(r: ResultatMesConnexions): boolean {
    if (r.ok) {
      setMessage(r.message);
      return true;
    }
    if (r.texte) Alert.alert(T.confirmationRefusee, r.texte);
    else if (r.erreur) montrerErreurCompte(r.erreur);
    return false;
  }

  function demanderDelier(fournisseur: FournisseurConnexion) {
    if (!connexions) return;
    const autre = fournisseur === "apple" ? "google" : "apple";
    // Sa seule clé : on le dit tout de suite, sans rien demander (l'API refuserait de toute façon)
    if (!connexions.motDePasse && !connexions[autre]) return montrerErreurCompte("derniere-connexion");
    setADelier(fournisseur);
    setVue("delier");
  }

  async function ajouterMotDePasse() {
    if (!compte || lienMotDePasse) return;
    if (montrerResultat(await mesConnexions.ajouterMotDePasse(compte.email))) setLienMotDePasse(true);
  }

  /** Le téléphone oublie le compte et tout le reste : l'app repart à la bienvenue */
  function partir(prevenirServeur: boolean, avant?: () => Promise<boolean>) {
    return effacement.toutEffacer(async () => {
      if (avant && !(await avant())) return false;
      await fermer({ prevenirServeur });
      return true;
    });
  }

  async function renvoyerLien() {
    const r = await comptes.renvoyerVerification();
    if (!r.ok) return montrerErreurCompte(r.erreur, r.details);
    if (r.dejaVerifie) void rafraichir();
    setLienEnvoye(true);
  }

  async function changerMotDePasse() {
    if (enCours || !compte) return;
    setEnCours(true);
    const r = await comptes.changerMotDePasse(actuel, nouveau);
    setEnCours(false);
    if (!r.ok) return montrerErreurCompte(r.erreur, r.details);
    // Toutes les autres sessions sont fermées ; ce téléphone garde la main avec le nouveau jeton
    await ouvrir({ session: r.session, compte, nouveau: false });
    setActuel("");
    setNouveau("");
    setVue("principal");
    setMessage(T.motDePasseChange);
  }

  async function supprimer(par: "mot-de-passe" | "apple" | "google") {
    if (enCours) return;
    setEnCours(true);
    try {
      let confirmationSuppression: Parameters<typeof comptes.supprimerCompte>[0];
      if (par === "mot-de-passe") confirmationSuppression = { motDePasse: actuel };
      else {
        const natif = par === "apple" ? await lancerConnexionApple() : await lancerConnexionGoogle();
        if (!natif.ok) {
          if (natif.raison !== "annule") montrerErreurCompte(natif.raison === "indisponible" ? "service-indisponible" : "jeton-externe-invalide");
          return;
        }
        confirmationSuppression = "identityToken" in natif ? { identityToken: natif.identityToken, nonce: natif.nonce } : { idToken: natif.idToken };
      }
      const preuve = confirmationSuppression;
      // Le compte n'existe plus : rien à prévenir côté serveur
      await partir(false, async () => {
        const r = await comptes.supprimerCompte(preuve);
        if (!r.ok) montrerErreurCompte(r.erreur, r.details);
        return r.ok;
      });
    } finally {
      setEnCours(false);
    }
  }

  if (vue === "delier" && connexions) {
    return (
      <VueDelierConnexion
        fournisseur={aDelier}
        avecMotDePasse={connexions.motDePasse}
        enCours={mesConnexions.enCours !== null}
        lienEnvoye={lienMotDePasse}
        onAjouterMotDePasse={() => {
          // Le mot « C'est parti ! » s'affiche en haut de Mon compte
          setVue("principal");
          void ajouterMotDePasse();
        }}
        onConfirmer={(motDePasse) => {
          void mesConnexions.delier(aDelier, motDePasse).then((r) => {
            if (montrerResultat(r)) setVue("principal");
          });
        }}
        onAnnuler={() => setVue("principal")}
      />
    );
  }

  if (vue === "relier" && connexions) {
    return (
      <VueRelierConnexion
        fournisseur={aRelier}
        avecMotDePasse={connexions.motDePasse}
        enCours={mesConnexions.enCours !== null}
        lienEnvoye={lienMotDePasse}
        onAjouterMotDePasse={() => {
          setVue("principal");
          void ajouterMotDePasse();
        }}
        onConfirmer={(motDePasse) => {
          void mesConnexions.relier(aRelier, motDePasse).then((r) => {
            if (montrerResultat(r)) setVue("principal");
          });
        }}
        onAnnuler={() => setVue("principal")}
      />
    );
  }

  if (vue === "mot-de-passe") {
    const pret = actuel !== "" && [...nouveau].length >= MOT_DE_PASSE_MIN;
    return (
      <EcranReglage
        titre={T.changer.titre}
        sousTitre={T.changer.sousTitre}
        boutonPrincipal={{ libelle: enCours ? T.unInstant : T.changer.bouton, onPress: () => void changerMotDePasse(), desactive: !pret || enCours }}
      >
        <View className="gap-5">
          <ChampTexte libelle={T.changer.actuel} valeur={actuel} onChangeTexte={setActuel} secureTextEntry autoCapitalize="none" textContentType="password" />
          <ChampTexte
            libelle={T.changer.nouveau}
            valeur={nouveau}
            onChangeTexte={setNouveau}
            secureTextEntry
            autoCapitalize="none"
            textContentType="newPassword"
            aide={T.changer.aide(MOT_DE_PASSE_MIN)}
          />
          <Bouton libelle={T.changer.finalementNon} variante="blanc" onPress={() => setVue("principal")} />
        </View>
      </EcranReglage>
    );
  }

  if (vue === "supprimer") {
    // Sans mot de passe, et aucune clé qui se lance ici : on propose d'en ajouter un, plutôt qu'un bouton qui échouera
    const confirmationImpossible = connexions !== null && !connexions.motDePasse && !(connexions.apple && APPLE_ICI) && !(connexions.google && GOOGLE_ICI);
    return (
      <EcranReglage titre={T.supprimer.titre} sousTitre={T.supprimer.sousTitre}>
        <View className="gap-5">
          <Text className="font-texte text-base leading-6 text-encre">
            {lierPonctuation(T.supprimer.intro)}
          </Text>
          {connexions?.motDePasse ? (
            <>
              <ChampTexte libelle={T.supprimer.tonMotDePasse} valeur={actuel} onChangeTexte={setActuel} secureTextEntry autoCapitalize="none" textContentType="password" />
              <Bouton
                libelle={enCours ? T.supprimer.unInstant : T.supprimer.bouton}
                variante="encre"
                desactive={actuel === "" || enCours}
                onPress={() => void supprimer("mot-de-passe")}
              />
            </>
          ) : null}
          {connexions?.apple && APPLE_ICI ? <Bouton libelle={T.supprimer.confirmerApple} variante="encre" desactive={enCours} onPress={() => void supprimer("apple")} /> : null}
          {connexions?.google && GOOGLE_ICI ? <Bouton libelle={T.supprimer.confirmerGoogle} variante="encre" desactive={enCours} onPress={() => void supprimer("google")} /> : null}
          {confirmationImpossible ? (
            <>
              <Text className="font-texte text-base leading-6 text-encre">{lierPonctuation(messagesMesConnexions.suppressionImpossibleIci)}</Text>
              <Bouton
                libelle={lienMotDePasse ? T.supprimer.lienEnvoye : T.supprimer.ajouterMotDePasse}
                variante="encre"
                desactive={lienMotDePasse || mesConnexions.enCours !== null}
                onPress={() => {
                  setVue("principal");
                  void ajouterMotDePasse();
                }}
              />
            </>
          ) : null}
          {!connexions ? (
            <>
              <Text className="font-texte text-base leading-6 text-encre">
                {lierPonctuation(mesConnexions.lectureRatee ? T.supprimer.clesRatees(messagesMesConnexions.lectureRatee) : T.supprimer.clesEnCours)}
              </Text>
              {mesConnexions.lectureRatee ? <Bouton libelle={T.supprimer.reessayer} variante="encre" onPress={() => void mesConnexions.relire()} /> : null}
            </>
          ) : null}
          <Bouton libelle={T.supprimer.jeReste} variante="blanc" onPress={() => setVue("principal")} />
        </View>
      </EcranReglage>
    );
  }

  return (
    <EcranReglage titre={T.titre} sousTitre={compte?.email ?? T.sousTitreSansEmail}>
      {message ? (
        <View className="rounded-carte border-2 border-encre bg-jaune-clair p-4">
          <Text className="font-texte text-base leading-6 text-encre">{message}</Text>
        </View>
      ) : null}

      <SectionReglages titre={T.email.titre}>
        {compte?.emailVerifie ? (
          <View className="flex-row items-center gap-3 py-3">
            <Text accessibilityElementsHidden importantForAccessibility="no" className="text-xl">
              ✅
            </Text>
            <View className="flex-1">
              <Text className="font-texte-gras text-base text-encre">{T.email.confirme}</Text>
              <Text className="font-texte text-sm text-gris">{compte.email}</Text>
            </View>
          </View>
        ) : (
          <LigneReglage
            emoji="📬"
            titre={lienEnvoye ? T.email.lienEnvoye : T.email.aConfirmer}
            detail={lienEnvoye ? T.email.lienEnvoyeDetail : T.email.aConfirmerDetail}
            onPress={() => void renvoyerLien()}
          />
        )}
      </SectionReglages>

      <SectionMesConnexions
        connexions={connexions}
        lectureRatee={mesConnexions.lectureRatee}
        onRelire={() => void mesConnexions.relire()}
        email={compte?.email ?? null}
        enCours={mesConnexions.enCours}
        lienEnvoye={lienMotDePasse}
        onChangerMotDePasse={() => setVue("mot-de-passe")}
        onAjouterMotDePasse={() => void ajouterMotDePasse()}
        onRelier={(fournisseur) => {
          setARelier(fournisseur);
          setVue("relier");
        }}
        onDelier={demanderDelier}
      />

      <SectionReglages titre={T.connexion.titre}>
        <LigneReglage
          emoji="📷"
          titre={T.connexion.appareil}
          detail={T.connexion.appareilDetail}
          onPress={() => router.push("/reglages/connecter-appareil")}
        />
        <LigneReglage emoji="👋" titre={T.connexion.deconnecter} detail={T.connexion.deconnecterDetail} onPress={() => setConfirmation("deconnecter")} />
        <LigneReglage emoji="🧯" titre={T.connexion.partout} detail={T.connexion.partoutDetail} onPress={() => setConfirmation("partout")} />
      </SectionReglages>

      <SectionReglages titre={T.zoneSensible}>
        <LigneReglage emoji="🗑️" titre={T.supprimer.titre} detail={T.supprimerDetail} danger onPress={() => setVue("supprimer")} />
      </SectionReglages>

      <FeuilleConfirmation
        visible={confirmation !== null}
        emoji={confirmation === "partout" ? "🧯" : "👋"}
        titre={confirmation === "partout" ? T.feuille.titrePartout : T.feuille.titre}
        detail={confirmation === "partout" ? T.feuille.detailPartout : T.feuille.detail}
        libelleConfirmer={confirmation === "partout" ? T.connexion.partout : T.connexion.deconnecter}
        libelleRester={T.feuille.jeReste}
        onConfirmer={() => {
          const quoi = confirmation;
          void (async () => {
            if (quoi === "partout") {
              await partir(false, async () => {
                const r = await comptes.deconnecterPartout();
                if (r.ok || r.erreur === "connexion-requise") return true;
                montrerErreurCompte(r.erreur, r.details);
                return false;
              });
            } else await partir(true);
          })();
        }}
        onFermer={() => setConfirmation(null)}
      />
    </EcranReglage>
  );
}
