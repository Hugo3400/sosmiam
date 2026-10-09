import { useState } from "react";
import { Text, View } from "react-native";

import { ChampTexte } from "~/composants/interface/ChampTexte";
import { EcranEtape } from "~/composants/inscription/EcranEtape";
import { montrerErreurCompte } from "~/hooks/utiliser-entree-compte";
import { utiliserSession } from "~/hooks/utiliser-session";

/**
 * « Mot de passe oublié » : un lien valable 24 h part par e-mail, seulement si un compte existe à cette adresse (la réponse
 * est la même dans tous les cas : personne ne peut deviner qui a un compte). Sert aussi à un compte créé avec Apple ou Google
 * pour se choisir un mot de passe.
 */
export default function MotDePasseOublie() {
  const { comptes } = utiliserSession();
  const [email, setEmail] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  async function envoyer() {
    if (envoi || email.trim() === "") return;
    setEnvoi(true);
    const r = await comptes.motDePasseOublie(email.trim().toLowerCase());
    setEnvoi(false);
    if (!r.ok) return montrerErreurCompte(r.erreur, r.details);
    setEnvoye(true);
  }

  if (envoye) {
    return (
      <EcranEtape titre="Regarde ta boîte mail 📬" sousTitre={`Si un compte existe pour ${email.trim()}, un lien t'y attend : il est valable 24 h. Pense aux indésirables, on s'y cache parfois.`}>
        <View />
      </EcranEtape>
    );
  }

  return (
    <EcranEtape
      titre="Mot de passe oublié ?"
      sousTitre="Ça arrive aux meilleurs. Donne-nous ton e-mail, on t'envoie un lien pour en choisir un nouveau."
      boutonPrincipal={{ libelle: envoi ? "Un instant…" : "Envoyer le lien", onPress: () => void envoyer(), desactive: envoi || email.trim() === "" }}
    >
      <ChampTexte
        libelle="Ton e-mail"
        valeur={email}
        onChangeTexte={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        returnKeyType="send"
        onSubmitEditing={() => void envoyer()}
      />
      <Text className="mt-4 font-texte text-sm leading-5 text-gris">Compte créé avec Apple ou Google ? Ce lien te permet aussi de te choisir un mot de passe.</Text>
    </EcranEtape>
  );
}
