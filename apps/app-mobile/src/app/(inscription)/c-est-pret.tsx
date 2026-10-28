import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, View } from "react-native";

import { CaseNewsletter } from "~/composants/inscription/CaseNewsletter";
import { EcranEtape } from "~/composants/inscription/EcranEtape";
import { Mascotte } from "~/composants/marque/Mascotte";
import { TEXTES_INSCRIPTION_PROFIL_PAR_LANGUE } from "~/contenus/textes-inscription-profil";
import { preparerProfilEnvoi } from "~/fonctions/compte/preparer-profil-envoi";
import { construireProfil } from "~/fonctions/inscription/construire-profil";
import { utiliserBrouillonInscription } from "~/hooks/utiliser-brouillon-inscription";
import { montrerErreurCompte } from "~/hooks/utiliser-entree-compte";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * Étape 4 sur 4 : récapitulatif, puis le compte est créé sur le serveur (e-mail, Apple ou Google) ou complété (compte du
 * site), et le profil enregistré sur le téléphone (la racine bascule alors vers les onglets). Les régimes restent sur le
 * téléphone.
 */
export default function CEstPret() {
  const router = useRouter();
  const T = utiliserTextes(TEXTES_INSCRIPTION_PROFIL_PAR_LANGUE);
  const { brouillon, modifier, verrouAge } = utiliserBrouillonInscription();
  const { enregistrer } = utiliserProfil();
  const session = utiliserSession();
  const [envoi, setEnvoi] = useState(false);
  const profil = construireProfil(brouillon);

  // Verrou d'âge actif sur ce téléphone : jamais de profil, retour à l'écran qui l'explique
  if (verrouAge) return <Redirect href="/fais-connaissance" />;

  // Ne devrait pas arriver en suivant le parcours : il manque une info obligatoire
  if (!profil) {
    return (
      <EcranEtape
        titre={T.manqueInfoTitre}
        sousTitre={T.manqueInfoSousTitre}
        etape={{ numero: 4, total: 4 }}
        boutonPrincipal={{ libelle: T.completerProfil, onPress: () => router.replace("/fais-connaissance") }}
      >
        <Mascotte expression="surprise" taille={120} />
      </EcranEtape>
    );
  }

  const nombreEnvies = Object.values(profil.envies).reduce((total, liste) => total + (liste?.length ?? 0), 0);

  async function decouvrir() {
    if (!profil || envoi || verrouAge) return;
    setEnvoi(true);
    if (!(await creerLeCompte())) return setEnvoi(false);
    try {
      await enregistrer(profil);
    } catch {
      setEnvoi(false);
      Alert.alert(T.oups, T.profilNonEnregistre);
    }
  }

  /** Le compte sur le serveur ; faux s'il n'a pas pu être créé (l'erreur est montrée, et on renvoie au bon écran) */
  async function creerLeCompte(): Promise<boolean> {
    const connexion = brouillon.connexion;
    if (!connexion || !profil) return true;
    const envoi = preparerProfilEnvoi(profil);
    if (connexion.type === "completer") {
      // Compte du site : la date de naissance se donne une seule fois ; déjà gardée, on n'insiste pas
      let r = await session.comptes.modifierProfil(envoi);
      if (!r.ok && r.erreur === "champ-invalide" && r.champ === "dateNaissance") {
        const { dateNaissance: _date, ...sansDate } = envoi;
        r = await session.comptes.modifierProfil(sansDate);
      }
      if (!r.ok) montrerErreurCompte(r.erreur, r.details);
      return r.ok;
    }
    const r =
      connexion.type === "email"
        ? await session.comptes.inscrire({ ...envoi, email: connexion.email, motDePasse: connexion.motDePasse, cgu: true, newsletter: brouillon.newsletter })
        : await session.comptes.connecterExterne(
            connexion.type === "apple"
              ? { fournisseur: "apple", identityToken: connexion.identityToken, nonce: connexion.nonce, profil: { ...envoi, cgu: true, newsletter: brouillon.newsletter } }
              : { fournisseur: "google", idToken: connexion.idToken, profil: { ...envoi, cgu: true, newsletter: brouillon.newsletter } },
          );
    if (!r.ok) {
      montrerErreurCompte(r.erreur, r.details);
      // Pseudo pris : on le change ; e-mail déjà utilisé ou jeton d'Apple/Google trop vieux : on recommence la connexion
      if (r.erreur === "pseudo-pris" || (r.erreur === "champ-invalide" && r.champ !== "motDePasse" && r.champ !== "email")) router.replace("/fais-connaissance");
      else if (r.erreur === "jeton-externe-invalide" || r.erreur === "email-deja-utilise" || r.champ === "motDePasse" || r.champ === "email") router.replace("/compte");
      return false;
    }
    if ("aCompleter" in r) {
      montrerErreurCompte("profil-a-completer");
      router.replace("/fais-connaissance");
      return false;
    }
    await session.ouvrir(r);
    return true;
  }

  return (
    <EcranEtape
      titre={T.pretTitre(profil.prenom)}
      sousTitre={T.pretSousTitre}
      etape={{ numero: 4, total: 4 }}
      boutonPrincipal={{ libelle: envoi ? T.cEstParti : T.decouvrir, onPress: decouvrir, desactive: envoi }}
    >
      <View className="items-center">
        <Mascotte expression="clin" taille={150} flotte />
      </View>
      <View className="mt-6 gap-3 rounded-carte border-2 border-encre bg-carte p-5">
        <Text className="font-texte text-base text-encre">📍 {profil.ville}</Text>
        <Text className="font-texte text-base text-encre">
          💛 {T.nombreEnvies(nombreEnvies)}
        </Text>
        <Text className="font-texte text-base text-encre">
          {brouillon.connexion ? T.compteServeur : T.compteTelephone}
        </Text>
      </View>
      {/* La newsletter : seulement quand un compte est créé (pas pour compléter un compte du site) */}
      {brouillon.connexion && brouillon.connexion.type !== "completer" ? (
        <View className="mt-4">
          <CaseNewsletter cochee={brouillon.newsletter} onChanger={(newsletter) => modifier({ newsletter })} />
        </View>
      ) : null}
    </EcranEtape>
  );
}
