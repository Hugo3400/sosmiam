import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { validerPropositionLieu, type ChampPropositionLieu } from "@sos-miam/commun/validation/valider-proposition-lieu";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { Pastille } from "~/composants/interface/Pastille";
import { ChampsInfosPratiques } from "~/composants/lieux/ChampsInfosPratiques";
import { Mascotte } from "~/composants/marque/Mascotte";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { sujetsProposition, type SujetProposition } from "~/contenus/sujets-proposition";
import { calculerPropositionLieu, type BrouillonProposition, type FicheActuelle } from "~/fonctions/lieux/calculer-proposition-lieu";
import { creerBrouillonInfosPratiques } from "~/fonctions/lieux/creer-brouillon-infos-pratiques";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserInfosPratiquesLieu } from "~/hooks/utiliser-infos-pratiques-lieu";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserServices } from "~/hooks/utiliser-services";
import couleurs from "~/theme/couleurs";

/** Ce qu'on dit sous le champ à corriger (mêmes règles que l'API : validerPropositionLieu) */
const ERREURS: Partial<Record<ChampPropositionLieu, string>> = {
  nom: "Un nom de 80 caractères au plus, sans gros mot.",
  adresse: "Une adresse de 160 caractères au plus, sans gros mot.",
  horaires: "Des horaires de 160 caractères au plus, sans gros mot.",
  texte: "Une présentation de 1 000 caractères au plus, sans gros mot.",
  message: "Un mot de 1 000 caractères au plus, sans gros mot.",
  vide: "Change au moins une info : pour l'instant, tout est pareil que sur la fiche.",
};

/**
 * « Proposer une modification » d'une fiche : on coche ce qui a changé (horaires, téléphone, adresse, animaux…), on corrige,
 * on ajoute un mot si on veut, et seul ce qui change vraiment part à l'équipe, qui relit avant de toucher à la fiche.
 */
export default function ProposerModification() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profil } = utiliserProfil();
  const { suggestions: service } = utiliserServices();
  const age = profil ? calculerAge(profil.dateNaissance) : null;
  const lieu = useMemo(() => filtrerLieuxSelonAge(lieuxExemples, age).find((l) => String(l.id) === id), [age, id]);
  // Celles remplies par le lieu s'il l'a fait, sinon celles de la fiche (comme ce que voient les gourmands). Lieu absent :
  // lu pour rien (un hook passe toujours, dans le même ordre), l'écran dit juste que le lieu n'est pas disponible
  const pratique = utiliserInfosPratiquesLieu(lieu ?? lieuxExemples[0]);

  const actuel: FicheActuelle | null = lieu ? { nom: lieu.nom, adresse: "", horaires: lieu.horaires, texte: lieu.texte, pratique } : null;
  const [sujets, setSujets] = useState<SujetProposition[]>([]);
  const [brouillon, setBrouillon] = useState<BrouillonProposition | null>(null);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState<ChampPropositionLieu | null>(null);
  const [envoyee, setEnvoyee] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  // Ce que le service a répondu (trop de propositions, rien à changer, pas de connexion…)
  const [refus, setRefus] = useState<ErreurService | null>(null);

  if (!lieu || !actuel) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} className="items-center justify-center gap-4 px-8">
        <Text className="text-center font-titre text-2xl text-encre">Ce lieu n'est pas disponible</Text>
        <Bouton libelle="Retour" variante="blanc" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  // Le brouillon part de la fiche telle qu'elle est (relu tant qu'on n'a rien tapé : les infos du lieu arrivent un peu après)
  const b: BrouillonProposition = brouillon ?? { nom: actuel.nom, adresse: "", horaires: actuel.horaires, texte: actuel.texte, pratique: creerBrouillonInfosPratiques(actuel.pratique) };
  const changer = (partiel: Partial<BrouillonProposition>) => {
    setBrouillon({ ...b, ...partiel });
    setErreur(null);
    setRefus(null);
  };
  const basculerSujet = (s: SujetProposition) => {
    setSujets((avant) => (avant.includes(s) ? avant.filter((x) => x !== s) : [...avant, s]));
    setErreur(null);
    setRefus(null);
  };
  const parties = sujetsProposition.filter((s) => sujets.includes(s.sujet) && s.partie).map((s) => s.partie!);

  async function envoyer() {
    if (envoi || !lieu) return;
    // Vérifiée ici pour dire quel champ corriger ; le service revérifie et ne garde que ce qui change
    const proposition = calculerPropositionLieu(actuel!, b, sujets);
    const r = validerPropositionLieu({ proposition, message });
    if (!r.ok) return setErreur(r.champ);
    setEnvoi(true);
    const reponse = await service.proposer(lieu.id, r.suggestion);
    setEnvoi(false);
    if (!reponse.ok) return setRefus(reponse.erreur);
    vibrerLegerement();
    setEnvoyee(true);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View className="min-h-14 flex-row items-center gap-3 px-5 pb-2 pt-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            hitSlop={8}
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
          >
            <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
          </Pressable>
          <View className="flex-1">
            <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
              Proposer une modification
            </Text>
            <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
              {lieu.emoji} {lieu.nom}
            </Text>
          </View>
        </View>

        {envoyee ? (
          <View className="flex-1 items-center justify-center gap-4 px-8 pb-10">
            <Mascotte expression="miam" taille={130} />
            <Text accessibilityRole="header" className="text-center font-titre text-3xl text-encre">
              Merci, c'est envoyé !
            </Text>
            <Text className="text-center font-texte text-base leading-6 text-gris">
              {lierPonctuation(`L'équipe relit ta proposition avant de changer la fiche de ${lieu.nom}. Grâce à toi, les gourmands auront les bonnes infos 💛`)}
            </Text>
            <Bouton libelle="Retour à la fiche" onPress={() => router.back()} />
          </View>
        ) : (
          <>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-6 px-5 pb-8 pt-2">
              <Text className="font-texte text-base leading-6 text-gris">
                {lierPonctuation("Tu as vu quelque chose qui a changé ? Dis-le-nous : l'équipe vérifie avant de mettre la fiche à jour.")}
              </Text>

              <View className="gap-2">
                <Text accessibilityRole="header" className="font-texte-gras text-base text-encre">
                  Qu'est-ce qui a changé ?
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {sujetsProposition.map((s, i) => (
                    <Pastille key={s.sujet} libelle={s.libelle} emoji={s.emoji} position={i + 1} total={sujetsProposition.length} choisi={sujets.includes(s.sujet)} onPress={() => basculerSujet(s.sujet)} />
                  ))}
                </View>
              </View>

              {sujets.includes("horaires") ? (
                <ChampTexte libelle="Les horaires" valeur={b.horaires} onChangeTexte={(horaires) => changer({ horaires })} placeholder="12h–14h30 · 19h–22h30 · fermé lundi" multiline maxLength={160} erreur={erreur === "horaires" ? ERREURS.horaires : null} />
              ) : null}
              {sujets.includes("adresse") ? (
                <ChampTexte libelle="La nouvelle adresse" valeur={b.adresse} onChangeTexte={(adresse) => changer({ adresse })} placeholder="12 rue de la Loge, Montpellier" maxLength={160} erreur={erreur === "adresse" ? ERREURS.adresse : null} />
              ) : null}
              {sujets.includes("nom") ? (
                <ChampTexte libelle="Le nom" valeur={b.nom} onChangeTexte={(nom) => changer({ nom })} maxLength={80} erreur={erreur === "nom" ? ERREURS.nom : null} />
              ) : null}
              {parties.length > 0 ? (
                <ChampsInfosPratiques
                  brouillon={b.pratique}
                  onChanger={(partiel) => changer({ pratique: { ...b.pratique, ...partiel } })}
                  erreur={erreur === "telephone" || erreur === "siteWeb" || erreur === "instagram" || erreur === "autre" ? erreur : null}
                  parties={parties}
                />
              ) : null}
              {sujets.includes("texte") ? (
                <ChampTexte libelle="La présentation" valeur={b.texte} onChangeTexte={(texte) => changer({ texte })} multiline maxLength={1000} erreur={erreur === "texte" ? ERREURS.texte : null} />
              ) : null}

              {sujets.length > 0 ? (
                <ChampTexte
                  libelle="Un mot pour l'équipe"
                  mention="facultatif"
                  valeur={message}
                  onChangeTexte={(t) => {
                    setMessage(t);
                    setErreur(null);
                    setRefus(null);
                  }}
                  placeholder="J'y étais hier : ils sont fermés le lundi maintenant"
                  multiline
                  maxLength={1000}
                  erreur={erreur === "message" ? ERREURS.message : null}
                />
              ) : null}

              {erreur === "vide" ? <Text className="font-texte-semi text-sm text-rouge-texte">{ERREURS.vide}</Text> : null}
              {refus ? (
                <View accessibilityLiveRegion="polite" className="gap-1 rounded-2xl border-2 border-tomate bg-rose-alerte px-4 py-3">
                  <Text className="font-texte-gras text-[15px] text-encre">
                    {MESSAGES_SERVICE[refus].emoji} {MESSAGES_SERVICE[refus].titre}
                  </Text>
                  <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(MESSAGES_SERVICE[refus].texte)}</Text>
                </View>
              ) : null}
            </ScrollView>

            <View className="border-t border-ligne px-5 pt-3" style={{ paddingBottom: 12 }}>
              <Bouton
                libelle={envoi ? "Envoi…" : "Envoyer ma proposition"}
                desactive={sujets.length === 0 || envoi}
                indice={sujets.length === 0 ? "Coche d'abord ce qui a changé" : undefined}
                onPress={envoyer}
              />
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
