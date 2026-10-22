import { Platform, Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

export type OngletPotes = "sorties" | "bande" | "listes";

type Props = {
  onglet: OngletPotes;
  onChoisir: (onglet: OngletPotes) => void;
  /** Lieux reçus de tes potes et pas encore ouverts : une pastille sur « Sorties » */
  nouveautes: number;
  /** Demandes de bande reçues, pas encore acceptées : une pastille sur « Ma bande » */
  demandesBande?: number;
  /** Sorties où l'on t'invite, en attente de ta réponse : comptées dans la pastille de « Sorties » */
  invitationsSorties?: number;
  /** Listes qu'on t'invite à remplir, en attente de ta réponse : une pastille sur « Listes » */
  invitationsListes?: number;
};

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

const onglets: { cle: OngletPotes; nom: string }[] = [
  { cle: "sorties", nom: "Sorties" },
  { cle: "bande", nom: "Ma bande" },
  { cle: "listes", nom: "Listes" },
];

/** Les trois onglets de Potes (Sorties, Ma bande, Listes), sur fond crème pour rester lisibles quand ils restent collés en haut. */
export function OngletsPotes({ onglet, onChoisir, nouveautes, demandesBande = 0, invitationsSorties = 0, invitationsListes = 0 }: Props) {
  return (
    // Fond crème sur toute la largeur : les onglets restent lisibles quand ils restent collés en haut de l'écran
    <View className="bg-creme px-5 pt-1">
      <View accessibilityRole="tablist" className="flex-row border-b-2 border-ligne">
        {onglets.map((o, i) => {
          const actif = o.cle === onglet;
          const pastille = o.cle === "sorties" ? nouveautes + invitationsSorties : o.cle === "bande" ? demandesBande : invitationsListes;
          const quoi =
            o.cle === "bande"
              ? `${pluriel(pastille, "demande")} pour rejoindre ta bande`
              : o.cle === "listes"
                ? `${pluriel(pastille, "invitation")} à remplir une liste`
                : [
                    nouveautes > 0 ? `${nouveautes} lieu${nouveautes > 1 ? "x" : ""} reçu${nouveautes > 1 ? "s" : ""} pas encore vu${nouveautes > 1 ? "s" : ""}` : null,
                    invitationsSorties > 0 ? `${pluriel(invitationsSorties, "invitation")} à une sortie` : null,
                  ]
                    .filter(Boolean)
                    .join(", ");
          const lu = pastille > 0 ? `${o.nom}, ${quoi}` : o.nom;
          // iOS ne connaît pas le rôle « onglet » (VoiceOver le lirait comme du texte) : bouton, avec la position dans le libellé
          return (
            <Pressable
              key={o.cle}
              accessibilityRole={Platform.OS === "ios" ? "button" : "tab"}
              accessibilityLabel={Platform.OS === "ios" ? `${lu}, onglet ${i + 1} sur ${onglets.length}` : lu}
              accessibilityState={{ selected: actif }}
              onPress={() => {
                vibrerLegerement();
                onChoisir(o.cle);
              }}
              className={`-mb-0.5 min-h-11 flex-1 flex-row items-center justify-center gap-1.5 border-b-2 py-2 active:opacity-70 ${actif ? "border-encre" : "border-transparent"}`}
            >
              <Text numberOfLines={1} className={`font-texte-gras text-base ${actif ? "text-encre" : "text-gris"}`}>
                {o.nom}
              </Text>
              {pastille > 0 ? (
                <View className="min-w-5 items-center rounded-full bg-rouge-sos px-1.5 py-0.5">
                  <Text allowFontScaling={false} className="font-texte-gras text-[11px] text-white">
                    {pastille}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
