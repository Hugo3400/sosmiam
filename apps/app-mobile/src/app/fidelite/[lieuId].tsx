import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { Bouton } from "~/composants/interface/Bouton";
import { BlocRecompensePrete } from "~/composants/fidelite/BlocRecompensePrete";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import { LigneVisite } from "~/composants/visites/LigneVisite";
import { RangeeTampons } from "~/composants/visites/RangeeTampons";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { direChezLieu } from "~/fonctions/visites/dire-chez-lieu";
import { utiliserFermerPile } from "~/hooks/utiliser-fermer-pile";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserVisites } from "~/hooks/utiliser-visites";
import couleurs from "~/theme/couleurs";

const minuscule = (texte: string) => texte.charAt(0).toLocaleLowerCase("fr-FR") + texte.slice(1);

/**
 * Une carte de fidélité en grand : les tampons, ce qu'il reste à faire, la récompense à demander au comptoir (avec le code
 * à montrer à l'équipe), et tes visites validées dans ce lieu. Relue toute seule quand l'équipe t'offre la récompense.
 */
export default function EcranCarteFidelite() {
  const router = useRouter();
  const fermer = utiliserFermerPile();
  const { lieuId } = useLocalSearchParams<{ lieuId: string }>();
  const { cartes, visites, pret } = utiliserVisites();
  const { fidelite } = utiliserServices();
  const { profil, avatar } = utiliserProfil();
  const [envoi, setEnvoi] = useState(false);
  const [refus, setRefus] = useState<ErreurService | null>(null);

  const carte = cartes.find((c) => String(c.lieu.id) === lieuId) ?? null;
  const visitesIci = visites.filter((v) => String(v.lieu.id) === lieuId && v.statut === "validee");
  // Comme le voit l'équipe du lieu : prénom, initiale du nom, emoji (jamais la photo)
  const initiale = profil?.nom?.trim().charAt(0).toLocaleUpperCase("fr-FR");
  const signature = profil ? (initiale ? `${profil.prenom} ${initiale}.` : profil.prenom) : "Toi";
  const emoji = avatar.type === "emoji" ? avatar.emoji : "🙂";

  async function agir(action: "demander" | "annuler") {
    if (!carte || envoi) return;
    setEnvoi(true);
    setRefus(null);
    const r = action === "demander" ? await fidelite.demanderRecompense(carte.lieu.id) : await fidelite.annulerDemandeRecompense(carte.lieu.id);
    setEnvoi(false);
    if (!r.ok) return setRefus(r.erreur);
    vibrerLegerement();
  }

  const enTete = (
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
      <Text accessibilityRole="header" className="flex-1 font-titre-gras text-xl text-encre">
        Ta carte de fidélité
      </Text>
    </View>
  );

  if (!carte) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
        {enTete}
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <Text className="text-center font-texte text-base leading-6 text-gris">
            {pret ? "Pas de carte ici pour l'instant : elle naît avec ta première visite validée." : "On sort ta carte…"}
          </Text>
          {pret ? <Bouton libelle="Mes cartes de fidélité" variante="blanc" onPress={() => router.replace("/fidelite")} /> : null}
        </View>
      </SafeAreaView>
    );
  }

  const restantes = Math.max(0, carte.sur - carte.tampons);
  const prete = carte.pretes[0];
  const alcool = prete ? prete.alcool === true : carte.recompenseAlcool;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      {enTete}
      <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-2">
        <View
          accessible
          accessibilityLabel={`${carte.lieu.nom}. ${carte.tampons} tampon${carte.tampons > 1 ? "s" : ""} sur ${carte.sur}. Encore ${restantes} visite${restantes > 1 ? "s" : ""} pour ${minuscule(carte.recompense)}.`}
          className="items-center gap-4 rounded-carte border-2 border-encre bg-white px-5 py-6"
        >
          <Text className="text-5xl">{carte.lieu.emoji}</Text>
          <Text className="text-center font-titre text-2xl text-encre">{carte.lieu.nom}</Text>
          <RangeeTampons tampons={carte.tampons} sur={carte.sur} taille="grande" />
          <Text className="text-center font-texte-semi text-base leading-6 text-encre">
            {lierPonctuation(`${carte.tampons}/${carte.sur} · encore ${restantes} visite${restantes > 1 ? "s" : ""} pour ${minuscule(carte.recompense)}`)}
          </Text>
          {carte.programmeActif ? null : <Text className="text-center font-texte text-sm text-gris">⏸ Le lieu a mis son programme en pause.</Text>}
        </View>

        <BlocRecompensePrete carte={carte} signature={signature} emoji={emoji} envoi={envoi} onDemander={() => agir("demander")} onAnnuler={() => agir("annuler")} />

        {refus ? (
          <View accessibilityLiveRegion="polite" className="gap-1 rounded-2xl border-2 border-tomate bg-rose-alerte px-4 py-3">
            <Text className="font-texte-gras text-[15px] text-encre">
              {MESSAGES_SERVICE[refus].emoji} {MESSAGES_SERVICE[refus].titre}
            </Text>
            <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(MESSAGES_SERVICE[refus].texte)}</Text>
          </View>
        ) : null}

        {alcool ? <MentionPrevention /> : null}

        <Text className="font-texte text-sm leading-5 text-gris">
          {lierPonctuation(`Un tampon à chaque visite validée ${direChezLieu(carte.lieu.nom)} : addition demandée dans l'app ou QR du comptoir. La récompense est choisie par le lieu.`)}
        </Text>

        {visitesIci.length > 0 ? (
          <View className="gap-3">
            <Text accessibilityRole="header" className="font-titre-gras text-lg text-encre">
              Tes visites ici ({visitesIci.length})
            </Text>
            {visitesIci.map((v) => (
              <LigneVisite key={v.id} visite={v} onPress={() => router.push({ pathname: "/visite/[id]", params: { id: String(v.id) } })} />
            ))}
          </View>
        ) : null}

        <Bouton libelle="Voir la fiche du lieu" variante="blanc" onPress={() => router.push({ pathname: "/lieu/[id]", params: { id: String(carte.lieu.id) } })} />
      </ScrollView>
    </SafeAreaView>
  );
}
