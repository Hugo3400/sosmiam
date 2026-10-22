import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import type { Pote } from "@sos-miam/commun/types/potes";
import { RondPote } from "~/composants/potes/RondPote";
import { TEXTES_INFOS_GROUPE as T } from "~/contenus/textes-infos-groupe";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Membre = { pote: Pote; role: string | null; moi: boolean };

type Props = {
  membres: Membre[];
  invites: Pote[];
  onVoirProfil: (id: string) => void;
};

const TAILLE = 36;

export function MembresGroupe({ membres, invites, onVoirProfil }: Props) {
  const couleurs = utiliserCouleurs();
  const ligne = (pote: Pote, role: string | null, moi: boolean, attente: boolean) => (
    <Pressable
      key={`${attente ? "invite" : "membre"}-${pote.id}`}
      accessibilityRole={moi ? undefined : "button"}
      accessibilityLabel={[moi ? T.toi : pote.prenom, role, attente ? T.enAttente : null].filter(Boolean).join(", ")}
      accessibilityHint={moi ? undefined : "Ouvre son profil"}
      disabled={moi}
      onPress={() => {
        vibrerLegerement();
        onVoirProfil(pote.id);
      }}
      className={`min-h-[52px] flex-row items-center gap-2.5 border-b border-ligne py-1.5 active:opacity-70 ${attente ? "opacity-70" : ""}`}
    >
      <RondPote pote={pote} taille={TAILLE} />
      <View className="flex-1">
        <Text numberOfLines={1} className="font-texte-semi text-[15px] text-encre">
          {moi ? T.toi : pote.prenom}
        </Text>
        {!moi && pote.pseudo ? (
          <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
            @{pote.pseudo}
          </Text>
        ) : null}
      </View>
      {role || attente ? (
        <View className="rounded-full border-[1.5px] border-encre px-2 py-0.5">
          <Text className="font-texte-gras text-xs text-encre">{role ?? T.enAttente}</Text>
        </View>
      ) : null}
      {moi ? null : <Ionicons name="chevron-forward" size={18} color={couleurs.gris} />}
    </Pressable>
  );
  return (
    <View>
      <Text accessibilityRole="header" className="mb-0.5 font-titre-gras text-lg text-encre">
        {T.membres}
      </Text>
      {membres.map((m) => ligne(m.pote, m.role, m.moi, false))}
      {invites.map((p) => ligne(p, null, false, true))}
    </View>
  );
}
