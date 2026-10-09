import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Linking, Pressable, Text, View } from "react-native";

import { LIBELLES_ANIMAUX, LIBELLES_PAIEMENT, LIBELLES_RESERVATION } from "@sos-miam/commun/contenus/libelles-infos-pratiques";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

type Props = { lieu: Lieu };

type Contact = { cle: string; icone: ComponentProps<typeof Ionicons>["name"]; texte: string; lu: string; adresse: string };

/** « carte bancaire, sans contact et tickets resto » */
const listerAvecEt = (mots: string[]) => (mots.length <= 1 ? mots.join("") : `${mots.slice(0, -1).join(", ")} et ${mots[mots.length - 1]}`);

/**
 * Le bloc « Infos pratiques » de la fiche : de quoi joindre le lieu (appeler, son site, son Instagram), puis ce qu'il
 * faut savoir avant de venir (animaux, accès en fauteuil, terrasse, Wi-Fi, enfants, parking, réservation, paiements).
 * Une info inconnue n'est jamais affichée ; sans aucune info, le bloc ne s'affiche pas.
 */
export function InfosPratiquesLieu({ lieu }: Props) {
  const p = lieu.pratique;
  if (!p) return null;

  const contacts: Contact[] = [];
  if (p.telephone) {
    contacts.push({
      cle: "tel",
      icone: "call",
      texte: p.telephone,
      lu: `Appeler ${lieu.nom}, ${p.telephone}`,
      adresse: `tel:${p.telephone.replace(/[^\d+]/g, "")}`,
    });
  }
  if (p.siteWeb) contacts.push({ cle: "site", icone: "globe-outline", texte: "Site", lu: `Ouvrir le site de ${lieu.nom}`, adresse: p.siteWeb });
  if (p.instagram) {
    contacts.push({ cle: "insta", icone: "logo-instagram", texte: "Instagram", lu: `Ouvrir l'Instagram de ${lieu.nom}`, adresse: `https://instagram.com/${p.instagram}` });
  }

  const faits: { emoji: string; texte: string }[] = [];
  if (p.animaux) faits.push(LIBELLES_ANIMAUX[p.animaux]);
  if (p.accessible) faits.push({ emoji: "♿", texte: "Accessible en fauteuil roulant" });
  if (p.terrasse) faits.push({ emoji: "☀️", texte: "Terrasse" });
  if (p.wifi) faits.push({ emoji: "📶", texte: "Wi-Fi" });
  if (p.enfants) faits.push({ emoji: "👶", texte: "Chaise haute ou menu enfant" });
  if (p.parking) faits.push({ emoji: "🅿️", texte: "Parking juste à côté" });
  if (p.reservation) faits.push({ emoji: "📅", texte: LIBELLES_RESERVATION[p.reservation] });
  if (p.paiements && p.paiements.length > 0) {
    const liste = listerAvecEt(p.paiements.map((m) => LIBELLES_PAIEMENT[m]));
    faits.push({ emoji: "💳", texte: liste.charAt(0).toLocaleUpperCase("fr-FR") + liste.slice(1) });
  }

  if (contacts.length === 0 && faits.length === 0) return null;

  return (
    <View className="gap-4 rounded-carte border-2 border-encre bg-white p-5">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
        Infos pratiques
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
              className={`min-h-11 flex-row items-center gap-2 rounded-full border-2 border-encre px-4 active:opacity-80 ${c.cle === "tel" ? "bg-jaune" : "bg-white"}`}
            >
              <Ionicons name={c.icone} size={18} color={couleurs.encre} />
              <Text className="font-texte-gras text-[15px] text-encre">{c.texte}</Text>
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
