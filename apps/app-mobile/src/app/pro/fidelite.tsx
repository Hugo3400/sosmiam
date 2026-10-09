import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { contientMotAlcool } from "@sos-miam/commun/fonctions/fidelite/contient-mot-alcool";
import { VISITES_FIDELITE_DEFAUT, VISITES_FIDELITE_MAX, VISITES_FIDELITE_MIN } from "@sos-miam/commun/regles/fidelite";
import type { ReglageFidelite } from "@sos-miam/commun/types/fidelite";
import { validerReglageFidelite } from "@sos-miam/commun/validation/valider-reglage-fidelite";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { CompteurPlusMoins } from "~/composants/interface/CompteurPlusMoins";
import { Interrupteur } from "~/composants/interface/Interrupteur";
import { ApercuCarteFidelite } from "~/composants/pro/ApercuCarteFidelite";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserFermerPile } from "~/hooks/utiliser-fermer-pile";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserServices } from "~/hooks/utiliser-services";
import couleurs from "~/theme/couleurs";

const VIERGE: ReglageFidelite = { actif: true, visitesRequises: VISITES_FIDELITE_DEFAUT, recompense: "", alcool: false, recompenseSansAlcool: null };

const ERREURS = {
  recompense: "Entre 3 et 60 caractères, sans gros mot : un café, un dessert maison…",
  recompenseSansAlcool: "Pour les moins de 18 ans, une récompense sans alcool est obligatoire.",
  visitesRequises: "Entre 3 et 10 visites.",
} as const;

/**
 * La carte de fidélité du lieu (gérant) : ce qu'il offre, au bout de combien de visites, avec l'aperçu de ce que verront
 * ses clients. Une récompense avec de l'alcool demande sa version pour les moins de 18 ans.
 */
export default function EcranFidelitePro() {
  const marges = useSafeAreaInsets();
  const fermer = utiliserFermerPile();
  const { lieuPro } = utiliserModes();
  const { comptoir } = utiliserServices();
  const [reglage, setReglage] = useState<ReglageFidelite>(VIERGE);
  const [erreur, setErreur] = useState<keyof typeof ERREURS | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);

  useEffect(() => {
    if (!lieuPro) return;
    comptoir.lireProgramme(lieuPro.id).then((r) => {
      if (r.ok && r.programme) {
        const { lieuId: _l, modifieLe: _m, ...existant } = r.programme;
        setReglage(existant);
      }
    });
  }, [comptoir, lieuPro]);

  if (!lieuPro) return null;

  // « Alcool » coché d'office dès qu'un mot d'alcool est dans la récompense
  const alcoolDetecte = contientMotAlcool(reglage.recompense);
  const alcool = reglage.alcool || alcoolDetecte;
  const changer = (partiel: Partial<ReglageFidelite>) => {
    setReglage((r) => ({ ...r, ...partiel }));
    setErreur(null);
  };

  async function enregistrer() {
    const valide = validerReglageFidelite({ ...reglage, alcool });
    if (!valide.ok) return setErreur(valide.champ);
    if (!lieuPro) return;
    setEnregistrement(true);
    const r = await comptoir.reglerProgramme(lieuPro.id, valide.reglage);
    setEnregistrement(false);
    if (!r.ok) return setAnnonce({ texte: "La carte n'a pas pu être enregistrée. Réessaie dans un instant ?", numero: Date.now() });
    vibrerLegerement();
    fermer();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View className="min-h-14 flex-row items-center gap-3 px-5 pb-2 pt-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            hitSlop={8}
            onPress={fermer}
            className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
          >
            <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
          </Pressable>
          <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
            Carte de fidélité
          </Text>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 px-5 pb-8 pt-2">
          <Text className="font-texte text-base leading-6 text-gris">
            {lierPonctuation("C'est toi qui offres, c'est toi qui choisis. Prends quelque chose que tu peux tenir même un samedi soir plein.")}
          </Text>
          <Interrupteur titre="Carte active" detail="En pause, tes clients ne la voient plus (les récompenses gagnées restent valables 30 jours)" valeur={reglage.actif} onChanger={(actif) => changer({ actif })} />
          <ChampTexte
            libelle="Ce que tu offres"
            valeur={reglage.recompense}
            onChangeTexte={(recompense) => changer({ recompense })}
            aide="Un café, un dessert maison, une boule de glace…"
            erreur={erreur === "recompense" ? ERREURS.recompense : null}
            maxLength={60}
          />
          {alcoolDetecte ? (
            <Text className="font-texte text-sm leading-5 text-gris">🍷 Il y a de l'alcool dedans : on demande aussi une version pour les moins de 18 ans.</Text>
          ) : (
            <Interrupteur titre="Il y a de l'alcool dedans" valeur={reglage.alcool} onChanger={(a) => changer({ alcool: a, recompenseSansAlcool: a ? reglage.recompenseSansAlcool : null })} />
          )}
          {alcool ? (
            <ChampTexte
              libelle="Et pour les moins de 18 ans ?"
              valeur={reglage.recompenseSansAlcool ?? ""}
              onChangeTexte={(t) => changer({ recompenseSansAlcool: t })}
              aide="Un jus pressé, un sirop maison…"
              erreur={erreur === "recompenseSansAlcool" ? ERREURS.recompenseSansAlcool : null}
              maxLength={60}
            />
          ) : null}
          <View className="gap-2">
            <Text className="font-texte-gras text-base text-encre">Visites avant la récompense</Text>
            <CompteurPlusMoins
              libelle="Visites avant la récompense"
              valeur={reglage.visitesRequises}
              min={VISITES_FIDELITE_MIN}
              max={VISITES_FIDELITE_MAX}
              unite={(n) => `${n} visites`}
              onChanger={(visitesRequises) => changer({ visitesRequises })}
            />
            {erreur === "visitesRequises" ? <Text className="font-texte-semi text-sm text-rouge-texte">{ERREURS.visitesRequises}</Text> : null}
          </View>
          <ApercuCarteFidelite nomLieu={lieuPro.nom} emoji={lieuPro.emoji} visites={reglage.visitesRequises} recompense={reglage.recompense} actif={reglage.actif} />
        </ScrollView>

        <View className="border-t border-ligne px-5 pt-3" style={{ paddingBottom: 12 }}>
          <Bouton libelle={enregistrement ? "Enregistrement…" : "Enregistrer la carte"} desactive={enregistrement} onPress={enregistrer} />
        </View>
      </KeyboardAvoidingView>
      <Annonce annonce={annonce} haut={marges.top + 12} onFin={() => setAnnonce(null)} />
    </SafeAreaView>
  );
}
