import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import type { ConnexionsCompte } from "@sos-miam/commun/types/compte-app";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { LigneReglage } from "~/composants/reglages/LigneReglage";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { lancerConnexionApple } from "~/fonctions/compte/lancer-connexion-apple";
import { lancerConnexionGoogle } from "~/fonctions/compte/lancer-connexion-google";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserEffacementLocal } from "~/hooks/utiliser-effacement-local";
import { montrerErreurCompte } from "~/hooks/utiliser-entree-compte";
import { utiliserSession } from "~/hooks/utiliser-session";

type Vue = "principal" | "mot-de-passe" | "supprimer";
type Confirmation = "deconnecter" | "partout" | null;

const MOT_DE_PASSE_MIN = 12;

/**
 * « Mon compte » (compte connecté) : l'e-mail et sa confirmation, changer de mot de passe, se déconnecter (ici ou partout),
 * supprimer son compte. La suppression demande le mot de passe, ou une nouvelle connexion Apple ou Google : une session
 * seule ne suffit jamais (un téléphone volé ne peut pas effacer le compte). Après une déconnexion ou une suppression, le
 * téléphone oublie tout et l'app repart à la bienvenue.
 */
export default function MonCompte() {
  const { compte, comptes, ouvrir, fermer, rafraichir } = utiliserSession();
  const effacement = utiliserEffacementLocal();
  const [connexions, setConnexions] = useState<ConnexionsCompte | null>(null);
  const [vue, setVue] = useState<Vue>("principal");
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [lienEnvoye, setLienEnvoye] = useState(false);
  const [actuel, setActuel] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    comptes.lireConnexions().then((r) => r.ok && setConnexions(r.connexions));
    void rafraichir();
  }, [comptes, rafraichir]);

  /** Le téléphone oublie le compte et tout le reste : l'app repart à la bienvenue */
  async function partir(prevenirServeur: boolean) {
    await fermer({ prevenirServeur });
    await effacement.toutEffacer();
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
    setMessage("C'est fait : ton nouveau mot de passe est en place, et tes autres appareils sont déconnectés.");
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
      const r = await comptes.supprimerCompte(confirmationSuppression);
      if (!r.ok) return montrerErreurCompte(r.erreur, r.details);
      // Le compte n'existe plus : rien à prévenir côté serveur
      await partir(false);
    } finally {
      setEnCours(false);
    }
  }

  if (vue === "mot-de-passe") {
    const pret = actuel !== "" && [...nouveau].length >= MOT_DE_PASSE_MIN;
    return (
      <EcranReglage
        titre="Changer mon mot de passe"
        sousTitre="Tes autres appareils seront déconnectés, celui-ci reste connecté."
        boutonPrincipal={{ libelle: enCours ? "Un instant…" : "Changer mon mot de passe", onPress: () => void changerMotDePasse(), desactive: !pret || enCours }}
      >
        <View className="gap-5">
          <ChampTexte libelle="Mot de passe actuel" valeur={actuel} onChangeTexte={setActuel} secureTextEntry autoCapitalize="none" textContentType="password" />
          <ChampTexte
            libelle="Nouveau mot de passe"
            valeur={nouveau}
            onChangeTexte={setNouveau}
            secureTextEntry
            autoCapitalize="none"
            textContentType="newPassword"
            aide={`${MOT_DE_PASSE_MIN} caractères au moins. Une petite phrase, c'est parfait.`}
          />
          <Bouton libelle="Finalement non" variante="blanc" onPress={() => setVue("principal")} />
        </View>
      </EcranReglage>
    );
  }

  if (vue === "supprimer") {
    return (
      <EcranReglage titre="Supprimer mon compte" sousTitre="Tout part, pour de bon : ton profil, tes points, tes visites, tes cartes de fidélité, tes avis et tes messages.">
        <View className="gap-5">
          <Text className="font-texte text-base leading-6 text-encre">
            {lierPonctuation("On sera tristes de te voir partir. Pour confirmer que c'est bien toi, une dernière vérification :")}
          </Text>
          {connexions?.motDePasse ? (
            <>
              <ChampTexte libelle="Ton mot de passe" valeur={actuel} onChangeTexte={setActuel} secureTextEntry autoCapitalize="none" textContentType="password" />
              <Bouton
                libelle={enCours ? "Un instant…" : "Supprimer mon compte"}
                variante="encre"
                desactive={actuel === "" || enCours}
                onPress={() => void supprimer("mot-de-passe")}
              />
            </>
          ) : null}
          {connexions?.apple ? <Bouton libelle="Confirmer avec Apple" variante="encre" desactive={enCours} onPress={() => void supprimer("apple")} /> : null}
          {connexions?.google ? <Bouton libelle="Confirmer avec Google" variante="encre" desactive={enCours} onPress={() => void supprimer("google")} /> : null}
          <Bouton libelle="Je reste" variante="blanc" onPress={() => setVue("principal")} />
        </View>
      </EcranReglage>
    );
  }

  return (
    <EcranReglage titre="Mon compte" sousTitre={compte?.email ?? "Ton compte SOS Miam"}>
      {message ? (
        <View className="rounded-carte border-2 border-encre bg-jaune-clair p-4">
          <Text className="font-texte text-base leading-6 text-encre">{message}</Text>
        </View>
      ) : null}

      <SectionReglages titre="Ton e-mail">
        {compte?.emailVerifie ? (
          <View className="flex-row items-center gap-3 py-3">
            <Text accessibilityElementsHidden importantForAccessibility="no" className="text-xl">
              ✅
            </Text>
            <View className="flex-1">
              <Text className="font-texte-gras text-base text-encre">E-mail confirmé</Text>
              <Text className="font-texte text-sm text-gris">{compte.email}</Text>
            </View>
          </View>
        ) : (
          <LigneReglage
            emoji="📬"
            titre={lienEnvoye ? "Lien envoyé !" : "Confirme ton e-mail"}
            detail={lienEnvoye ? "Regarde ta boîte (et les indésirables), puis reviens ici" : "Il faut un e-mail confirmé pour valider tes visites. Touche pour recevoir le lien."}
            onPress={() => void renvoyerLien()}
          />
        )}
      </SectionReglages>

      <SectionReglages titre="Connexion">
        {connexions ? (
          <Text className="py-2 font-texte text-sm leading-5 text-gris">
            {[connexions.motDePasse ? "e-mail et mot de passe" : null, connexions.apple ? "Apple" : null, connexions.google ? "Google" : null].filter(Boolean).join(", ") ||
              "aucune connexion"}
            {" : c'est comme ça que tu entres dans ton compte."}
          </Text>
        ) : null}
        {connexions?.motDePasse ? (
          <LigneReglage emoji="🔑" titre="Changer mon mot de passe" detail="Tes autres appareils seront déconnectés" onPress={() => setVue("mot-de-passe")} />
        ) : connexions ? (
          <Text className="py-2 font-texte text-sm leading-5 text-gris">
            Pas de mot de passe : tu peux en choisir un avec « Mot de passe oublié », sur l'écran de connexion.
          </Text>
        ) : null}
        <LigneReglage emoji="👋" titre="Me déconnecter" detail="Ton compte t'attend : reconnecte-toi quand tu veux" onPress={() => setConfirmation("deconnecter")} />
        <LigneReglage emoji="🧯" titre="Me déconnecter partout" detail="Sur tous tes appareils, celui-ci compris" onPress={() => setConfirmation("partout")} />
      </SectionReglages>

      <SectionReglages titre="Zone sensible">
        <LigneReglage emoji="🗑️" titre="Supprimer mon compte" detail="Tout part, pour de bon" danger onPress={() => setVue("supprimer")} />
      </SectionReglages>

      <FeuilleConfirmation
        visible={confirmation !== null}
        emoji={confirmation === "partout" ? "🧯" : "👋"}
        titre={confirmation === "partout" ? "Te déconnecter partout ?" : "Te déconnecter ?"}
        detail={
          confirmation === "partout"
            ? "Tous tes appareils devront se reconnecter, celui-ci compris. Pratique si tu as perdu un téléphone."
            : "Ce téléphone oublie ton compte et ce qu'il gardait. Tout est sur le serveur : reconnecte-toi quand tu veux."
        }
        libelleConfirmer={confirmation === "partout" ? "Me déconnecter partout" : "Me déconnecter"}
        libelleRester="Je reste"
        onConfirmer={() => {
          const quoi = confirmation;
          void (async () => {
            if (quoi === "partout") {
              const r = await comptes.deconnecterPartout();
              if (!r.ok && r.erreur !== "connexion-requise") return montrerErreurCompte(r.erreur, r.details);
              await partir(false);
            } else await partir(true);
          })();
        }}
        onFermer={() => setConfirmation(null)}
      />
    </EcranReglage>
  );
}
