import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform, Pressable, Text, View } from "react-native";

import type { Pote } from "@sos-miam/commun/types/potes";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { RondPote } from "~/composants/potes/RondPote";
import { REFUS_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { TEXTES_AJOUT_POTE_PAR_LANGUE } from "~/contenus/textes-ajout-pote";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserRecherchePseudo } from "~/hooks/utiliser-recherche-pseudo";
import { utiliserTextes } from "~/hooks/utiliser-textes";

// « @ » + 20 caractères au plus (FORME_PSEUDO)
const LONGUEUR_MAX_SAISIE = 21;
// Le temps de finir de taper avant d'annoncer les résultats (sinon VoiceOver parlerait à chaque lettre)
const DELAI_ANNONCE = 700;

/**
 * Chercher quelqu'un par son pseudo : avatar, @pseudo et prénom (à toucher pour ouvrir son profil), puis « Ajouter » (une
 * demande qu'il accepte) ou « Déjà dans ta bande ». Les personnes bloquées n'apparaissent pas.
 */
export function RecherchePseudo() {
  const router = useRouter();
  const T = utiliserTextes(TEXTES_AJOUT_POTE_PAR_LANGUE).recherche;
  const REFUS = utiliserTextes(REFUS_LIMITATION_PAR_LANGUE);
  const { demanderAjout, demandesEnvoyees } = utiliserCommunaute();
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const cherche = texte.trim().replace(/^@/, "");
  const { resultats, enCours, erreur: rechercheRatee } = utiliserRecherchePseudo(texte);
  const nombre = resultats.length;
  const aucun = T.aucun(cherche);

  // VoiceOver ignore accessibilityLiveRegion (qui sert à TalkBack) : sur iPhone, on annonce les résultats une fois la frappe posée
  useEffect(() => {
    if (Platform.OS !== "ios" || cherche.length < 2 || enCours) return;
    const minuterie = setTimeout(
      () => AccessibilityInfo.announceForAccessibilityWithOptions(nombre === 0 ? aucun : T.resultats(nombre, cherche), { queue: true }),
      DELAI_ANNONCE,
    );
    return () => clearTimeout(minuterie);
  }, [cherche, nombre, aucun, enCours, T]);

  async function ajouter(pote: Pote) {
    vibrerLegerement();
    const resultat = await demanderAjout(pote.id);
    // La ligne passe d'elle-même à « Déjà dans ta bande » ou « Demande envoyée »
    const message =
      resultat.type === "ajoute"
        ? T.ajoute(pote.prenom)
        : resultat.type === "demande"
          ? T.demande(pote.prenom)
          : resultat.type === "deja"
            ? T.deja(pote.prenom)
            : resultat.type === "bloque"
              ? T.bloque(pote.prenom)
              : resultat.type === "demandes-fermees"
                ? T.demandesFermees(pote.prenom)
                : resultat.type === "erreur" && resultat.erreur === "compte-limite"
                  ? REFUS.bande
                  : T.erreur;
    setErreur(resultat.type === "ajoute" || resultat.type === "deja" || resultat.type === "demande" ? null : message);
    AccessibilityInfo.announceForAccessibility(message);
  }

  return (
    <View className="gap-3">
      <ChampTexte
        libelle={T.champ}
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
        aide={T.aide}
      />

      {cherche.length < 2 ? (
        <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(T.tropCourt)}</Text>
      ) : enCours && resultats.length === 0 ? (
        <Text className="font-texte text-sm leading-5 text-gris">{T.enCours}</Text>
      ) : rechercheRatee ? (
        <Text accessibilityLiveRegion="polite" className="font-texte text-sm leading-5 text-gris">
          {lierPonctuation(T.rechercheRatee)}
        </Text>
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
                accessibilityHint={T.profilIndice}
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
                <Text accessibilityLabel={T.dejaDansBande} className="font-texte-semi text-[13px] text-gris">
                  {`✓ ${T.dejaDansBande}`}
                </Text>
              ) : demandesEnvoyees.some((p) => p.id === pote.id) ? (
                <Text accessibilityLabel={T.demandeEnvoyee} className="font-texte-semi text-[13px] text-gris">
                  {`✓ ${T.demandeEnvoyee}`}
                </Text>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={T.ajouterLu(pote.prenom, pote.pseudo)}
                  accessibilityHint={T.ajouterIndice}
                  onPress={() => void ajouter(pote)}
                  className="min-h-11 items-center justify-center rounded-full border-2 border-encre bg-jaune px-4 active:opacity-80"
                >
                  <Text className="font-texte-gras text-sm text-nuit">{T.ajouter}</Text>
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
