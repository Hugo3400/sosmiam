import { useState } from "react";
import { AccessibilityInfo, Pressable, Text, View } from "react-native";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { MAX_CO_AUTEURS_LISTE } from "@sos-miam/commun/regles/listes";
import type { ListePartagee, Pote } from "@sos-miam/commun/types/potes";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { RondPote } from "~/composants/potes/RondPote";
import { REFUS_LIMITATION } from "~/contenus/limitation-compte";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";

type Props = {
  visible: boolean;
  /** Ta liste (tu en es l'auteur) */
  liste: ListePartagee;
  onFermer: () => void;
};

type Ligne = { pote: Pote; statut: "invite" | "accepte" | null };

/**
 * « Remplir à plusieurs » (l'auteur seulement) : les co-auteurs de la liste avec leur statut (« invité », « remplit avec toi »),
 * à retirer d'un geste, puis les potes de ta bande à inviter (10 co-auteurs au plus). Démo : le pote invité accepte tout seul
 * quelques secondes plus tard.
 */
export function FeuilleCoAuteursListe({ visible, liste, onFermer }: Props) {
  const { potes, trouverPote, bloques, demo, inviterCoAuteur, retirerCoAuteur } = utiliserCommunaute();
  const [enCours, setEnCours] = useState<string | null>(null);
  const [souci, setSouci] = useState<string | null>(null);
  // À chaque ouverture, on repart sans message
  const [ouvert, setOuvert] = useState(visible);
  if (visible !== ouvert) {
    setOuvert(visible);
    if (visible) setSouci(null);
  }

  const bloquesIds = new Set(bloques.map((b) => b.id));
  const coAuteurs = (liste.coAuteurs ?? []).flatMap((c): Ligne[] => {
    const pote = bloquesIds.has(c.id) ? null : trouverPote(c.id);
    return pote ? [{ pote, statut: c.statut }] : [];
  });
  const invitables = potes.filter((p) => !(liste.coAuteurs ?? []).some((c) => c.id === p.id));
  const complet = (liste.coAuteurs ?? []).length >= MAX_CO_AUTEURS_LISTE;

  async function agir(pote: Pote, inviter: boolean) {
    vibrerLegerement();
    setEnCours(pote.id);
    setSouci(null);
    const erreur = inviter ? await inviterCoAuteur(liste.id, pote.id) : await retirerCoAuteur(liste.id, pote.id);
    setEnCours(null);
    if (erreur) {
      const texte = erreur === "compte-limite" ? REFUS_LIMITATION.coAuteur : MESSAGES_SERVICE[erreur].texte;
      setSouci(texte);
      return AccessibilityInfo.announceForAccessibility(texte);
    }
    AccessibilityInfo.announceForAccessibility(
      inviter ? `${pote.prenom} est invité à remplir la liste avec toi` : `${pote.prenom} ne remplit plus la liste. On ne le prévient pas.`,
    );
  }

  const ligne = ({ pote, statut }: Ligne, i: number, total: number) => (
    <View key={pote.id} className={`min-h-14 flex-row items-center gap-3 py-2.5 ${i < total - 1 ? "border-b border-ligne" : ""}`}>
      <View accessible accessibilityLabel={`${pote.prenom}${statut === "invite" ? ", invité" : statut === "accepte" ? ", remplit avec toi" : ""}`} className="flex-1 flex-row items-center gap-3">
        <RondPote pote={pote} taille={40} />
        <View className="flex-1">
          <Text numberOfLines={1} className="font-texte-gras text-base text-encre">
            {pote.prenom}
          </Text>
          {statut ? (
            <Text numberOfLines={1} className={`font-texte-semi text-[13px] ${statut === "accepte" ? "text-encre" : "text-gris"}`}>
              {statut === "accepte" ? "✍️ Remplit avec toi" : "⏳ Invité"}
            </Text>
          ) : (
            <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
              @{pote.pseudo}
            </Text>
          )}
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={statut ? `Retirer ${pote.prenom}` : `Inviter ${pote.prenom}`}
        accessibilityHint={statut ? "Il ne pourra plus ajouter de lieux. On ne le prévient pas." : "Il pourra ajouter ses pépites à ta liste"}
        accessibilityState={{ disabled: enCours === pote.id || (!statut && complet) }}
        disabled={enCours === pote.id || (!statut && complet)}
        hitSlop={6}
        onPress={() => void agir(pote, !statut)}
        className={`h-9 min-w-20 items-center justify-center rounded-full border-2 border-encre px-3 active:opacity-70 ${statut ? "bg-white" : "bg-jaune"} ${!statut && complet ? "opacity-40" : ""}`}
      >
        <Text className="font-texte-gras text-[13px] text-encre">{enCours === pote.id ? "…" : statut ? "Retirer" : "Inviter"}</Text>
      </Pressable>
    </View>
  );

  return (
    <FeuilleBas
      visible={visible}
      titre="Remplir à plusieurs"
      sousTitre="Invite des potes de ta bande à y ajouter leurs pépites."
      onFermer={onFermer}
      pied={<Bouton libelle="C'est tout bon" onPress={onFermer} />}
    >
      <View className="gap-1">
        <Text accessibilityRole="header" className="font-texte-gras text-base text-encre">
          {`Avec toi (${coAuteurs.length}/${MAX_CO_AUTEURS_LISTE})`}
        </Text>
        {coAuteurs.length === 0 ? (
          <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation("Personne pour l'instant. À plusieurs, c'est deux fois plus de bonnes adresses !")}</Text>
        ) : (
          coAuteurs.map((c, i) => ligne(c, i, coAuteurs.length))
        )}
        {demo && coAuteurs.some((c) => c.statut === "invite") ? (
          <Text className="mt-1 font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation("Démo : ton pote d'exemple dit oui dans quelques secondes.")}</Text>
        ) : null}
      </View>

      <View className="gap-1">
        <Text accessibilityRole="header" className="font-texte-gras text-base text-encre">
          Ta bande
        </Text>
        {potes.length === 0 ? (
          <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation("Ta bande est vide pour l'instant : ajoute un pote, et tu pourras l'inviter.")}</Text>
        ) : invitables.length === 0 ? (
          <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation("Toute ta bande est déjà invitée. Quelle équipe !")}</Text>
        ) : (
          invitables.map((p, i) => ligne({ pote: p, statut: null }, i, invitables.length))
        )}
        {complet ? (
          <Text className="mt-1 font-texte text-sm leading-5 text-gris">{lierPonctuation(`${MAX_CO_AUTEURS_LISTE} co-auteurs au plus : la cuisine est pleine !`)}</Text>
        ) : null}
      </View>

      {souci ? (
        <Text className="overflow-hidden rounded-2xl bg-rose-alerte px-4 py-2.5 font-texte-semi text-sm leading-5 text-rouge-texte">{lierPonctuation(souci)}</Text>
      ) : null}
    </FeuilleBas>
  );
}
