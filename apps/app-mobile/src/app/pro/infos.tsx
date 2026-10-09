import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { LIBELLES_ANIMAUX, LIBELLES_PAIEMENT, LIBELLES_RESERVATION } from "@sos-miam/commun/contenus/libelles-infos-pratiques";
import type { AccueilAnimaux, InfosPratiques, MoyenPaiement, ReservationConseillee } from "@sos-miam/commun/types/infos-pratiques";
import { validerInfosPratiques, type ChampInfosPratiques } from "@sos-miam/commun/validation/valider-infos-pratiques";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { Interrupteur } from "~/composants/interface/Interrupteur";
import { Pastille } from "~/composants/interface/Pastille";
import { InfosPratiquesLieu } from "~/composants/lieux/InfosPratiquesLieu";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserFermerPile } from "~/hooks/utiliser-fermer-pile";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserServices } from "~/hooks/utiliser-services";
import couleurs from "~/theme/couleurs";

const ANIMAUX: readonly AccueilAnimaux[] = ["bienvenus", "terrasse", "non"];
const RESERVATIONS: readonly ReservationConseillee[] = ["inutile", "conseillee", "obligatoire"];
const PAIEMENTS: readonly MoyenPaiement[] = ["cb", "sans-contact", "especes", "tickets-resto", "cheques-vacances"];
const CASES: readonly { cle: "accessible" | "terrasse" | "wifi" | "enfants" | "parking"; emoji: string; titre: string }[] = [
  { cle: "accessible", emoji: "♿", titre: "Accessible en fauteuil roulant" },
  { cle: "terrasse", emoji: "☀️", titre: "Terrasse" },
  { cle: "wifi", emoji: "📶", titre: "Wi-Fi" },
  { cle: "enfants", emoji: "👶", titre: "Chaise haute ou menu enfant" },
  { cle: "parking", emoji: "🅿️", titre: "Parking juste à côté" },
];
const ERREURS: Record<ChampInfosPratiques, string> = {
  telephone: "Un numéro français, comme 04 67 12 34 56.",
  siteWeb: "Une adresse complète qui commence par https://",
  instagram: "Ton nom Instagram, sans espace (lettres, chiffres, points et _).",
  autre: "Une info ne passe pas : vérifie tes choix.",
};

/** Ce qui se tape au clavier reste en texte pendant la saisie ; le reste suit la forme partagée */
type Brouillon = Omit<InfosPratiques, "telephone" | "siteWeb" | "instagram"> & { telephone: string; siteWeb: string; instagram: string };

const versBrouillon = (i: InfosPratiques | null): Brouillon => ({ ...(i ?? {}), telephone: i?.telephone ?? "", siteWeb: i?.siteWeb ?? "", instagram: i?.instagram ?? "" });

/**
 * Les infos pratiques du lieu, remplies par le gérant : de quoi le joindre, les animaux, l'accès, les équipements, la
 * réservation et les paiements, avec l'aperçu du bloc tel qu'il apparaîtra sur la fiche. Une case non cochée n'est pas affichée.
 */
export default function EcranInfosPratiquesPro() {
  const marges = useSafeAreaInsets();
  const fermer = utiliserFermerPile();
  const { lieuPro } = utiliserModes();
  const { comptoir } = utiliserServices();
  const [brouillon, setBrouillon] = useState<Brouillon>(versBrouillon(null));
  const [erreur, setErreur] = useState<ChampInfosPratiques | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);

  useEffect(() => {
    if (!lieuPro) return;
    comptoir.lireInfosPratiques(lieuPro.id).then((r) => r.ok && setBrouillon(versBrouillon(r.infos)));
  }, [comptoir, lieuPro]);

  if (!lieuPro) return null;

  const changer = (partiel: Partial<Brouillon>) => {
    setBrouillon((b) => ({ ...b, ...partiel }));
    setErreur(null);
  };
  const basculerPaiement = (p: MoyenPaiement) => {
    const actuels = brouillon.paiements ?? [];
    changer({ paiements: actuels.includes(p) ? actuels.filter((x) => x !== p) : [...actuels, p] });
  };
  // L'aperçu montre ce qui est déjà valable (un numéro à moitié tapé n'apparaît pas encore)
  const apercu = validerInfosPratiques(brouillon);

  async function enregistrer() {
    const valide = validerInfosPratiques(brouillon);
    if (!valide.ok) return setErreur(valide.champ);
    if (!lieuPro) return;
    setEnregistrement(true);
    const r = await comptoir.reglerInfosPratiques(lieuPro.id, valide.infos);
    setEnregistrement(false);
    if (!r.ok) return setAnnonce({ texte: "Les infos n'ont pas pu être enregistrées. Réessaie dans un instant ?", numero: Date.now() });
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
            Infos pratiques
          </Text>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 px-5 pb-8 pt-2">
          <Text className="font-texte text-base leading-6 text-gris">Ce que les gourmands voient sur ta fiche avant de venir. Ce que tu ne coches pas n'apparaît pas.</Text>

          <ChampTexte libelle="Téléphone" valeur={brouillon.telephone} onChangeTexte={(telephone) => changer({ telephone })} keyboardType="phone-pad" placeholder="04 67 12 34 56" erreur={erreur === "telephone" ? ERREURS.telephone : null} />
          <ChampTexte libelle="Site" mention="facultatif" valeur={brouillon.siteWeb} onChangeTexte={(siteWeb) => changer({ siteWeb })} keyboardType="url" autoCapitalize="none" autoCorrect={false} placeholder="https://" erreur={erreur === "siteWeb" ? ERREURS.siteWeb : null} />
          <ChampTexte libelle="Instagram" mention="facultatif" valeur={brouillon.instagram} onChangeTexte={(instagram) => changer({ instagram })} autoCapitalize="none" autoCorrect={false} placeholder="@ton.lieu" erreur={erreur === "instagram" ? ERREURS.instagram : null} />

          <View className="gap-2">
            <Text className="font-texte-gras text-base text-encre">Les animaux</Text>
            <View className="flex-row flex-wrap gap-2">
              {ANIMAUX.map((a, i) => (
                <Pastille key={a} libelle={LIBELLES_ANIMAUX[a].texte} emoji={LIBELLES_ANIMAUX[a].emoji} role="radio" position={i + 1} total={ANIMAUX.length} choisi={brouillon.animaux === a} onPress={() => changer({ animaux: brouillon.animaux === a ? undefined : a })} />
              ))}
            </View>
          </View>

          <View className="gap-3">
            {CASES.map((c) => (
              <Interrupteur key={c.cle} titre={c.titre} emoji={c.emoji} valeur={brouillon[c.cle] === true} onChanger={(v) => changer({ [c.cle]: v ? true : undefined })} />
            ))}
          </View>

          <View className="gap-2">
            <Text className="font-texte-gras text-base text-encre">La réservation</Text>
            <View className="flex-row flex-wrap gap-2">
              {RESERVATIONS.map((r, i) => (
                <Pastille key={r} libelle={LIBELLES_RESERVATION[r]} role="radio" position={i + 1} total={RESERVATIONS.length} choisi={brouillon.reservation === r} onPress={() => changer({ reservation: brouillon.reservation === r ? undefined : r })} />
              ))}
            </View>
          </View>

          <View className="gap-2">
            <Text className="font-texte-gras text-base text-encre">Les paiements</Text>
            <View className="flex-row flex-wrap gap-2">
              {PAIEMENTS.map((p, i) => (
                <Pastille key={p} libelle={LIBELLES_PAIEMENT[p].charAt(0).toLocaleUpperCase("fr-FR") + LIBELLES_PAIEMENT[p].slice(1)} position={i + 1} total={PAIEMENTS.length} choisi={(brouillon.paiements ?? []).includes(p)} onPress={() => basculerPaiement(p)} />
              ))}
            </View>
          </View>

          {erreur === "autre" ? <Text className="font-texte-semi text-sm text-rouge-texte">{ERREURS.autre}</Text> : null}

          <View className="gap-2">
            <Text className="font-texte-gras text-base text-encre">Aperçu sur ta fiche</Text>
            <InfosPratiquesLieu nom={lieuPro.nom} pratique={apercu.ok ? apercu.infos : undefined} />
          </View>
        </ScrollView>

        <View className="border-t border-ligne px-5 pt-3" style={{ paddingBottom: 12 }}>
          <Bouton libelle={enregistrement ? "Enregistrement…" : "Enregistrer"} desactive={enregistrement} onPress={enregistrer} />
        </View>
      </KeyboardAvoidingView>
      <Annonce annonce={annonce} haut={marges.top + 12} onFin={() => setAnnonce(null)} />
    </SafeAreaView>
  );
}
