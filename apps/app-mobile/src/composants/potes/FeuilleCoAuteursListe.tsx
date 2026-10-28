import { useState } from "react";
import { AccessibilityInfo, Pressable, Text, View } from "react-native";

import { MESSAGES_SERVICE_PAR_LANGUE } from "@sos-miam/commun/contenus/messages-services";
import { MAX_CO_AUTEURS_LISTE } from "@sos-miam/commun/regles/listes";
import type { ListePartagee, Pote } from "@sos-miam/commun/types/potes";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { RondPote } from "~/composants/potes/RondPote";
import { REFUS_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { TEXTES_LISTES_PARTAGEES_PAR_LANGUE } from "~/contenus/textes-listes-partagees";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  visible: boolean;
  /** Ta liste (tu en es l'auteur) */
  liste: ListePartagee;
  onFermer: () => void;
};

type Ligne = { pote: Pote; statut: "invite" | "accepte" | null };

/**
 * « Remplir à plusieurs » (l'auteur seulement) : les co-auteurs de la liste avec leur statut (« invité », « remplit avec toi »),
 * à retirer d'un geste, puis les potes de ta bande à inviter (10 co-auteurs au plus).
 */
export function FeuilleCoAuteursListe({ visible, liste, onFermer }: Props) {
  const T = utiliserTextes(TEXTES_LISTES_PARTAGEES_PAR_LANGUE).coAuteurs;
  const R = utiliserTextes(REFUS_LIMITATION_PAR_LANGUE);
  const messagesService = utiliserTextes(MESSAGES_SERVICE_PAR_LANGUE);
  const { potes, trouverPote, bloques, inviterCoAuteur, retirerCoAuteur } = utiliserCommunaute();
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
      const texte = erreur === "compte-limite" ? R.coAuteur : messagesService[erreur].texte;
      setSouci(texte);
      return AccessibilityInfo.announceForAccessibility(texte);
    }
    AccessibilityInfo.announceForAccessibility(
      inviter ? T.inviteLu(pote.prenom) : T.retireLu(pote.prenom),
    );
  }

  const ligne = ({ pote, statut }: Ligne, i: number, total: number) => (
    <View key={pote.id} className={`min-h-14 flex-row items-center gap-3 py-2.5 ${i < total - 1 ? "border-b border-ligne" : ""}`}>
      <View accessible accessibilityLabel={`${pote.prenom}${statut === "invite" ? T.statutInviteLu : statut === "accepte" ? T.statutAccepteLu : ""}`} className="flex-1 flex-row items-center gap-3">
        <RondPote pote={pote} taille={40} />
        <View className="flex-1">
          <Text numberOfLines={1} className="font-texte-gras text-base text-encre">
            {pote.prenom}
          </Text>
          {statut ? (
            <Text numberOfLines={1} className={`font-texte-semi text-[13px] ${statut === "accepte" ? "text-encre" : "text-gris"}`}>
              {statut === "accepte" ? T.remplitAvecToi : T.invite}
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
        accessibilityLabel={statut ? T.retirerLu(pote.prenom) : T.inviterLu(pote.prenom)}
        accessibilityHint={statut ? T.indiceRetirer : T.indiceInviter}
        accessibilityState={{ disabled: enCours === pote.id || (!statut && complet) }}
        disabled={enCours === pote.id || (!statut && complet)}
        hitSlop={6}
        onPress={() => void agir(pote, !statut)}
        className={`h-9 min-w-20 items-center justify-center rounded-full border-2 border-encre px-3 active:opacity-70 ${statut ? "bg-carte" : "bg-jaune"} ${!statut && complet ? "opacity-40" : ""}`}
      >
        <Text className={`font-texte-gras text-[13px] ${statut ? "text-encre" : "text-nuit"}`}>{enCours === pote.id ? "…" : statut ? T.retirer : T.inviter}</Text>
      </Pressable>
    </View>
  );

  return (
    <FeuilleBas
      visible={visible}
      titre={T.titre}
      sousTitre={T.sousTitre}
      onFermer={onFermer}
      pied={<Bouton libelle={T.toutBon} onPress={onFermer} />}
    >
      <View className="gap-1">
        <Text accessibilityRole="header" className="font-texte-gras text-base text-encre">
          {T.avecToi(coAuteurs.length)}
        </Text>
        {coAuteurs.length === 0 ? (
          <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(T.personne)}</Text>
        ) : (
          coAuteurs.map((c, i) => ligne(c, i, coAuteurs.length))
        )}
      </View>

      <View className="gap-1">
        <Text accessibilityRole="header" className="font-texte-gras text-base text-encre">
          {T.taBande}
        </Text>
        {potes.length === 0 ? (
          <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(T.bandeVide)}</Text>
        ) : invitables.length === 0 ? (
          <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(T.tousInvites)}</Text>
        ) : (
          invitables.map((p, i) => ligne({ pote: p, statut: null }, i, invitables.length))
        )}
        {complet ? (
          <Text className="mt-1 font-texte text-sm leading-5 text-gris">{lierPonctuation(T.complet)}</Text>
        ) : null}
      </View>

      {souci ? (
        <Text className="overflow-hidden rounded-2xl bg-rose-alerte px-4 py-2.5 font-texte-semi text-sm leading-5 text-rouge-texte">{lierPonctuation(souci)}</Text>
      ) : null}
    </FeuilleBas>
  );
}
