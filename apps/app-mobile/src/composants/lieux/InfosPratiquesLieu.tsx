import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import { Linking, Pressable, Text, View } from "react-native";

import { LIBELLES_ANIMAUX_PAR_LANGUE, LIBELLES_PAIEMENT_PAR_LANGUE, LIBELLES_RESERVATION_PAR_LANGUE } from "@sos-miam/commun/contenus/libelles-infos-pratiques";
import type { InfosPratiques } from "@sos-miam/commun/types/infos-pratiques";
import { TEXTES_INFOS_PRATIQUES_PAR_LANGUE } from "~/contenus/textes-infos-pratiques";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { listerPrenomsLangue } from "~/fonctions/langue/lister-prenoms-langue";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** Le nom du lieu, lu par VoiceOver sur les boutons (« Appeler Chez Nonna Lia ») */
  nom: string;
  pratique: InfosPratiques | null | undefined;
};

type Contact = { cle: string; icone: ComponentProps<typeof Ionicons>["name"]; texte: string; lu: string; adresse: string };

/**
 * Le bloc « Infos pratiques » de la fiche : de quoi joindre le lieu (appeler, son site, son Instagram), puis ce qu'il
 * faut savoir avant de venir (animaux, accès en fauteuil, terrasse, Wi-Fi, enfants, parking, réservation, paiements).
 * Une info inconnue n'est jamais affichée ; sans aucune info, le bloc ne s'affiche pas.
 */
export function InfosPratiquesLieu({ nom, pratique }: Props) {
  const couleurs = utiliserCouleurs();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_INFOS_PRATIQUES_PAR_LANGUE);
  const animaux = utiliserTextes(LIBELLES_ANIMAUX_PAR_LANGUE);
  const paiements = utiliserTextes(LIBELLES_PAIEMENT_PAR_LANGUE);
  const reservations = utiliserTextes(LIBELLES_RESERVATION_PAR_LANGUE);
  const p = pratique;
  if (!p) return null;

  const contacts: Contact[] = [];
  if (p.telephone) {
    contacts.push({
      cle: "tel",
      icone: "call",
      texte: p.telephone,
      lu: T.appelerLu(nom, p.telephone),
      adresse: `tel:${p.telephone.replace(/[^\d+]/g, "")}`,
    });
  }
  if (p.siteWeb) contacts.push({ cle: "site", icone: "globe-outline", texte: T.site, lu: T.siteLu(nom), adresse: p.siteWeb });
  if (p.instagram) {
    contacts.push({ cle: "insta", icone: "logo-instagram", texte: T.instagram, lu: T.instagramLu(nom), adresse: `https://instagram.com/${p.instagram}` });
  }

  const faits: { emoji: string; texte: string }[] = [];
  if (p.animaux) faits.push(animaux[p.animaux]);
  if (p.accessible) faits.push({ emoji: "♿", texte: T.equipements.accessible });
  if (p.terrasse) faits.push({ emoji: "☀️", texte: T.equipements.terrasse });
  if (p.wifi) faits.push({ emoji: "📶", texte: T.equipements.wifi });
  if (p.enfants) faits.push({ emoji: "👶", texte: T.equipements.enfants });
  if (p.parking) faits.push({ emoji: "🅿️", texte: T.equipements.parking });
  if (p.reservation) faits.push({ emoji: "📅", texte: reservations[p.reservation] });
  if (p.paiements && p.paiements.length > 0) {
    const liste = listerPrenomsLangue(p.paiements.map((m) => paiements[m]), langue);
    faits.push({ emoji: "💳", texte: liste.charAt(0).toLocaleUpperCase("fr-FR") + liste.slice(1) });
  }

  if (contacts.length === 0 && faits.length === 0) return null;

  return (
    <View className="gap-4 rounded-carte border-2 border-encre bg-carte p-5">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
        {T.titre}
      </Text>

      {contacts.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {contacts.map((c) => (
            <Pressable
              key={c.cle}
              accessibilityRole={c.cle === "tel" ? "button" : "link"}
              accessibilityLabel={c.lu}
              onPress={() => {
                vibrerLegerement();
                Linking.openURL(c.adresse).catch(() => {});
              }}
              className={`min-h-11 flex-row items-center gap-2 rounded-full border-2 border-encre px-4 active:opacity-80 ${c.cle === "tel" ? "bg-jaune" : "bg-carte"}`}
            >
              <Ionicons name={c.icone} size={18} color={c.cle === "tel" ? couleurs.nuit : couleurs.encre} />
              <Text className={`font-texte-gras text-[15px] ${c.cle === "tel" ? "text-nuit" : "text-encre"}`}>{c.texte}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {faits.length > 0 ? (
        <View className="gap-2.5">
          {faits.map((f) => (
            <View key={f.texte} accessible accessibilityLabel={f.texte} className="flex-row items-center gap-3">
              <Text className="w-7 text-center text-xl">{f.emoji}</Text>
              <Text className="flex-1 font-texte text-[15px] leading-[22px] text-encre">{f.texte}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
