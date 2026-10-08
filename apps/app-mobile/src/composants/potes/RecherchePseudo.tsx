import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform, Pressable, Text, View } from "react-native";

import type { Pote } from "@sos-miam/commun/types/potes";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { RondPote } from "~/composants/potes/RondPote";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";

// « @ » + 20 caractères au plus (FORME_PSEUDO)
const LONGUEUR_MAX_SAISIE = 21;
// Le temps de finir de taper avant d'annoncer les résultats (sinon VoiceOver parlerait à chaque lettre)
const DELAI_ANNONCE = 700;

/**
 * Chercher quelqu'un par son pseudo : avatar, @pseudo et prénom (à toucher pour ouvrir son profil), puis « Ajouter » ou « Déjà dans ta bande ».
 * Un adulte ne trouve pas les mineurs (sauf ceux déjà dans sa bande) : chercherParPseudo ne les lui montre pas.
 */
export function RecherchePseudo() {
  const router = useRouter();
  const { chercherParPseudo, ajouterPote, moiMineur } = utiliserCommunaute();
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const cherche = texte.trim().replace(/^@/, "");
  const resultats = chercherParPseudo(texte);
  const nombre = resultats.length;
  const aucun = `On ne trouve personne pour @${cherche} dans la démo. Tes vrais potes arriveront avec les comptes !`;

  // VoiceOver ignore accessibilityLiveRegion (qui sert à TalkBack) : sur iPhone, on annonce les résultats une fois la frappe posée
  useEffect(() => {
    if (Platform.OS !== "ios" || cherche.length < 2) return;
    const minuterie = setTimeout(
      () => AccessibilityInfo.announceForAccessibilityWithOptions(nombre === 0 ? aucun : `${nombre} résultat${nombre > 1 ? "s" : ""} pour @${cherche}`, { queue: true }),
      DELAI_ANNONCE,
    );
    return () => clearTimeout(minuterie);
  }, [cherche, nombre, aucun]);

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
            ? "Cette personne ne s'ajoute pas par son pseudo."
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
        aide={moiMineur ? undefined : "Les moins de 18 ans ne se trouvent pas par leur pseudo : avec les comptes, ils s'ajouteront par lien ou QR code, donnés en main propre."}
      />

      {cherche.length < 2 ? (
        <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation("Tape au moins 2 lettres. Pour essayer la démo : cherche @camille !")}</Text>
      ) : resultats.length === 0 ? (
        <Text accessibilityLiveRegion="polite" className="font-texte text-sm leading-5 text-gris">
          {lierPonctuation(aucun)}
        </Text>
      ) : (
        <View>
          {resultats.map(({ pote, dejaDansLaBande }) => (
            <View key={pote.id} className="min-h-16 flex-row items-center gap-3 border-b border-ligne py-2.5">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${pote.prenom}, @${pote.pseudo}`}
                accessibilityHint="Ouvre son profil"
                onPress={() => {
                  vibrerLegerement();
                  router.push({ pathname: "/potes/profil/[id]", params: { id: pote.id } });
                }}
                className="min-h-12 flex-1 flex-row items-center gap-3 active:opacity-70"
              >
                <RondPote pote={pote} taille={48} />
                <View className="flex-1">
                  <Text numberOfLines={1} className="font-texte-gras text-base text-encre">
                    @{pote.pseudo}
                  </Text>
                  <Text numberOfLines={1} className="font-texte text-sm text-gris">
                    {pote.prenom}
                  </Text>
                </View>
              </Pressable>
              {dejaDansLaBande ? (
                <Text accessibilityLabel="Déjà dans ta bande" className="font-texte-semi text-[13px] text-gris">
                  ✓ Déjà dans ta bande
                </Text>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Ajouter ${pote.prenom}, @${pote.pseudo}`}
                  accessibilityHint="L'ajoute à ta bande"
                  onPress={() => ajouter(pote)}
                  className="min-h-11 items-center justify-center rounded-full border-2 border-encre bg-jaune px-4 active:opacity-80"
                >
                  <Text className="font-texte-gras text-sm text-encre">Ajouter</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}

      {erreur ? <Text className="font-texte text-sm leading-5 text-rouge-texte">{lierPonctuation(erreur)}</Text> : null}
    </View>
  );
}
