import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { contientMotAlcool } from "@sos-miam/commun/fonctions/fidelite/contient-mot-alcool";
import { VISITES_FIDELITE_DEFAUT, VISITES_FIDELITE_MAX, VISITES_FIDELITE_MIN } from "@sos-miam/commun/regles/fidelite";
import type { ReglageFidelite } from "@sos-miam/commun/types/fidelite";
import { validerReglageFidelite } from "@sos-miam/commun/validation/valider-reglage-fidelite";
import { RefusLimitationEnPlace } from "~/composants/compte/RefusLimitationEnPlace";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { CompteurPlusMoins } from "~/composants/interface/CompteurPlusMoins";
import { Interrupteur } from "~/composants/interface/Interrupteur";
import { ApercuCarteFidelite } from "~/composants/pro/ApercuCarteFidelite";
import { REFUS_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { TEXTES_ECRAN_FIDELITE_PAR_LANGUE, type TEXTES_ECRAN_FIDELITE } from "~/contenus/textes-ecran-pro-mon-lieu";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserFermerPile } from "~/hooks/utiliser-fermer-pile";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const VIERGE: ReglageFidelite = { actif: true, visitesRequises: VISITES_FIDELITE_DEFAUT, recompense: "", alcool: false, recompenseSansAlcool: null };

type ChampErreur = keyof typeof TEXTES_ECRAN_FIDELITE.erreurs;

/**
 * La carte de fidélité du lieu (gérant) : ce qu'il offre, au bout de combien de visites, avec l'aperçu de ce que verront
 * ses clients. Une récompense avec de l'alcool s'affiche avec le message de prévention ; sa version sans alcool est
 * facultative (la fidélité demande un compte).
 */
export default function EcranFidelitePro() {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_ECRAN_FIDELITE_PAR_LANGUE);
  const TL = utiliserTextes(REFUS_LIMITATION_PAR_LANGUE);
  const marges = useSafeAreaInsets();
  const fermer = utiliserFermerPile();
  const { lieuPro } = utiliserModes();
  const { comptoir } = utiliserServices();
  const [reglage, setReglage] = useState<ReglageFidelite>(VIERGE);
  const [erreur, setErreur] = useState<ChampErreur | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  // Compte limité : dit au-dessus du bouton jusqu'au prochain essai (l'annonce du haut passerait sous celle de toute l'app)
  const [refusLimite, setRefusLimite] = useState<string | null>(null);

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
    setRefusLimite(null);
    const r = await comptoir.reglerProgramme(lieuPro.id, valide.reglage);
    setEnregistrement(false);
    if (!r.ok) {
      if (r.erreur === "compte-limite") return setRefusLimite(TL.fidelite);
      return setAnnonce({ texte: T.echec, numero: Date.now() });
    }
    vibrerLegerement();
    fermer();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View className="min-h-14 flex-row items-center gap-3 px-5 pb-2 pt-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={T.retour}
            hitSlop={8}
            onPress={fermer}
            className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
          >
            <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
          </Pressable>
          <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
            {T.titre}
          </Text>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 px-5 pb-8 pt-2">
          <Text className="font-texte text-base leading-6 text-gris">
            {lierPonctuation(T.intro)}
          </Text>
          <Interrupteur titre={T.actif} detail={T.actifDetail} valeur={reglage.actif} onChanger={(actif) => changer({ actif })} />
          <ChampTexte
            libelle={T.recompense}
            valeur={reglage.recompense}
            onChangeTexte={(recompense) => changer({ recompense })}
            aide={T.recompenseAide}
            erreur={erreur === "recompense" ? T.erreurs.recompense : null}
            maxLength={60}
          />
          {alcoolDetecte ? (
            <Text className="font-texte text-sm leading-5 text-gris">{T.alcoolDetecte}</Text>
          ) : (
            <Interrupteur titre={T.alcool} valeur={reglage.alcool} onChanger={(a) => changer({ alcool: a, recompenseSansAlcool: a ? reglage.recompenseSansAlcool : null })} />
          )}
          {alcool ? (
            <ChampTexte
              libelle={T.sansAlcool}
              mention={T.facultatif}
              valeur={reglage.recompenseSansAlcool ?? ""}
              onChangeTexte={(t) => changer({ recompenseSansAlcool: t })}
              aide={T.sansAlcoolAide}
              erreur={erreur === "recompenseSansAlcool" ? T.erreurs.recompenseSansAlcool : null}
              maxLength={60}
            />
          ) : null}
          <View className="gap-2">
            <Text className="font-texte-gras text-base text-encre">{T.visites}</Text>
            <CompteurPlusMoins
              libelle={T.visites}
              valeur={reglage.visitesRequises}
              min={VISITES_FIDELITE_MIN}
              max={VISITES_FIDELITE_MAX}
              unite={T.visitesUnite}
              onChanger={(visitesRequises) => changer({ visitesRequises })}
            />
            {erreur === "visitesRequises" ? <Text className="font-texte-semi text-sm text-rouge-texte">{T.erreurs.visitesRequises}</Text> : null}
          </View>
          <ApercuCarteFidelite nomLieu={lieuPro.nom} emoji={lieuPro.emoji} visites={reglage.visitesRequises} recompense={reglage.recompense} actif={reglage.actif} />
        </ScrollView>

        <View className="gap-3 border-t border-ligne px-5 pt-3" style={{ paddingBottom: 12 }}>
          <RefusLimitationEnPlace texte={refusLimite} />
          <Bouton libelle={enregistrement ? T.enregistrement : T.enregistrer} desactive={enregistrement} onPress={enregistrer} />
        </View>
      </KeyboardAvoidingView>
      <Annonce annonce={annonce} haut={marges.top + 12} onFin={() => setAnnonce(null)} />
    </SafeAreaView>
  );
}
