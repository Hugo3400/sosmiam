import { useState } from "react";
import { AccessibilityInfo, Pressable, Text, View } from "react-native";

import type { Pote } from "@sos-miam/commun/types/potes";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { RondPote } from "~/composants/potes/RondPote";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";

// « @ » + 20 caractères au plus (FORME_PSEUDO)
const LONGUEUR_MAX_SAISIE = 21;
const MINEUR_PAR_PSEUDO = "Pour ajouter cette personne, demande-lui son lien ou son QR code";

/**
 * Chercher quelqu'un par son pseudo : avatar, @pseudo et prénom, puis « Ajouter » ou « Déjà dans ta bande ».
 * Un mineur cherché par un adulte apparaît sans bouton : il ne s'ajoute que par lien ou QR code, donnés en main propre.
 */
export function RecherchePseudo() {
  const { chercherParPseudo, ajouterPote, moiMineur } = utiliserCommunaute();
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const cherche = texte.trim().replace(/^@/, "");
  const resultats = chercherParPseudo(texte);

  function ajouter(pote: Pote) {
    vibrerLegerement();
    const resultat = ajouterPote(pote.id, "pseudo");
    // La ligne passe d'elle-même à « Déjà dans ta bande » ; les autres cas ne devraient pas arriver depuis la recherche
    const message =
      resultat === "ajoute"
        ? `${pote.prenom} a rejoint ta bande !`
        : resultat === "deja"
          ? `${pote.prenom} est déjà dans ta bande.`
          : resultat === "mineur"
            ? `${MINEUR_PAR_PSEUDO}.`
            : resultat === "bloque"
              ? `Tu as bloqué ${pote.prenom} : pour l'ajouter, débloque d'abord cette personne depuis son profil.`
              : "Cette personne n'est plus là. Bizarre… réessaie ?";
    setErreur(resultat === "ajoute" || resultat === "deja" ? null : message);
    AccessibilityInfo.announceForAccessibility(message);
  }

  return (
    <View className="gap-3">
      <ChampTexte
        libelle="Pseudo de ton pote"
        valeur={texte}
        onChangeTexte={(nouveau) => {
          setTexte(nouveau);
          setErreur(null);
        }}
        placeholder="@camille.ecusson"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        returnKeyType="search"
        maxLength={LONGUEUR_MAX_SAISIE}
        aide={moiMineur ? undefined : "Les moins de 18 ans ne s'ajoutent que par lien ou QR code, donnés en main propre."}
      />

      {cherche.length < 2 ? (
        <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation("Tape au moins 2 lettres. Pour essayer la démo : cherche @camille !")}</Text>
      ) : resultats.length === 0 ? (
        <Text accessibilityLiveRegion="polite" className="font-texte text-sm leading-5 text-gris">
          {lierPonctuation(`Personne ne s'appelle @${cherche} dans la démo. Tes vrais potes arriveront avec les comptes !`)}
        </Text>
      ) : (
        <View>
          {resultats.map(({ pote, dejaDansLaBande, ajoutable }) => (
            <View key={pote.id} className="min-h-16 flex-row items-center gap-3 border-b border-ligne py-2.5">
              <RondPote pote={pote} taille={48} />
              <View className="flex-1">
                <Text numberOfLines={1} className="font-texte-gras text-base text-encre">
                  @{pote.pseudo}
                </Text>
                <Text numberOfLines={1} className="font-texte text-sm text-gris">
                  {pote.prenom}
                </Text>
                {!dejaDansLaBande && !ajoutable ? <Text className="mt-1 font-texte-semi text-[13px] leading-[18px] text-encre">{lierPonctuation(MINEUR_PAR_PSEUDO)}</Text> : null}
              </View>
              {dejaDansLaBande ? (
                <Text className="font-texte-semi text-[13px] text-gris">✓ Déjà dans ta bande</Text>
              ) : ajoutable ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Ajouter ${pote.prenom}, @${pote.pseudo}`}
                  accessibilityHint="L'ajoute à ta bande"
                  onPress={() => ajouter(pote)}
                  className="min-h-11 items-center justify-center rounded-full border-2 border-encre bg-jaune px-4 active:opacity-80"
                >
                  <Text className="font-texte-gras text-sm text-encre">Ajouter</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {erreur ? <Text className="font-texte text-sm leading-5 text-rouge-texte">{lierPonctuation(erreur)}</Text> : null}
    </View>
  );
}
