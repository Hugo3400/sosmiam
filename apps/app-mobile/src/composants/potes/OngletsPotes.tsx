import { Platform, Pressable, Text, View } from "react-native";

import { TEXTES_ONGLETS_POTES_PAR_LANGUE } from "~/contenus/textes-onglets-potes";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserTextes } from "~/hooks/utiliser-textes";

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

const CLES_ONGLETS: OngletPotes[] = ["sorties", "bande", "listes"];

/** Les trois onglets de Potes (Sorties, Ma bande, Listes), sur fond crème pour rester lisibles quand ils restent collés en haut. */
export function OngletsPotes({ onglet, onChoisir, nouveautes, demandesBande = 0, invitationsSorties = 0, invitationsListes = 0 }: Props) {
  const T = utiliserTextes(TEXTES_ONGLETS_POTES_PAR_LANGUE).onglets;
  const onglets = CLES_ONGLETS.map((cle) => ({ cle, nom: T.noms[cle] }));
  return (
    // Fond crème sur toute la largeur : les onglets restent lisibles quand ils restent collés en haut de l'écran
    <View className="bg-creme px-5 pt-1">
      <View accessibilityRole="tablist" className="flex-row border-b-2 border-ligne">
        {onglets.map((o, i) => {
          const actif = o.cle === onglet;
          const pastille = o.cle === "sorties" ? nouveautes + invitationsSorties : o.cle === "bande" ? demandesBande : invitationsListes;
          const quoi =
            o.cle === "bande"
              ? T.demandesBande(pastille)
              : o.cle === "listes"
                ? T.invitationsListes(pastille)
                : [
                    nouveautes > 0 ? T.lieuxRecus(nouveautes) : null,
                    invitationsSorties > 0 ? T.invitationsSorties(invitationsSorties) : null,
                  ]
                    .filter(Boolean)
                    .join(", ");
          const lu = pastille > 0 ? `${o.nom}, ${quoi}` : o.nom;
          // iOS ne connaît pas le rôle « onglet » (VoiceOver le lirait comme du texte) : bouton, avec la position dans le libellé
          return (
            <Pressable
              key={o.cle}
              accessibilityRole={Platform.OS === "ios" ? "button" : "tab"}
              accessibilityLabel={Platform.OS === "ios" ? T.ongletSur(lu, i + 1, onglets.length) : lu}
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
