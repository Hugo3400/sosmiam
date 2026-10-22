import { ActivityIndicator, Pressable, Text } from "react-native";

import type { MiamiPresent } from "@sos-miam/commun/types/qui-est-la";
import { TEXTES_QUI_EST_LA } from "~/contenus/textes-qui-est-la";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  present: MiamiPresent;
  coucouPossible: boolean;
  enCours: boolean;
  demande: boolean;
  onCoucou: () => void;
  onAjouter: () => void;
};

type Rendu = { libelle: string; lu?: string; style: string; texte: string; action?: () => void; indice?: string };

function choisirRendu({ present, coucouPossible, demande, onCoucou, onAjouter }: Props): Rendu {
  const pseudo = present.personne.pseudo;
  const etiquette = "border border-ligne bg-creme";
  if (present.dansTaBande) return { libelle: `🤝 ${TEXTES_QUI_EST_LA.pote}`, lu: TEXTES_QUI_EST_LA.dansTaBande, style: etiquette, texte: "text-encre" };
  if (present.coucou === "reciproque") {
    if (demande) return { libelle: TEXTES_QUI_EST_LA.demandeEnvoyee, style: etiquette, texte: "text-gris" };
    return { libelle: TEXTES_QUI_EST_LA.ajouterCourt, lu: TEXTES_QUI_EST_LA.ajouterLu(pseudo), style: "bg-jaune", texte: "text-nuit", action: onAjouter };
  }
  if (present.coucou === "envoye") return { libelle: TEXTES_QUI_EST_LA.coucouEnvoye, style: "border border-ligne bg-carte", texte: "text-gris" };
  return {
    libelle: `👋 ${TEXTES_QUI_EST_LA.coucou}`,
    lu: TEXTES_QUI_EST_LA.coucouLu(pseudo),
    style: coucouPossible ? "bg-jaune" : "bg-jaune opacity-40",
    texte: "text-nuit",
    action: coucouPossible ? onCoucou : undefined,
    indice: coucouPossible ? undefined : TEXTES_QUI_EST_LA.invisiblePourCoucou,
  };
}

export function ActionMiamiPresent(props: Props) {
  const couleurs = utiliserCouleurs();
  const rendu = choisirRendu(props);
  const touchable = rendu.action !== undefined && !props.enCours;
  const bouton = rendu.action !== undefined || rendu.indice !== undefined;
  return (
    <Pressable
      accessible
      accessibilityRole={bouton ? "button" : "text"}
      accessibilityLabel={rendu.lu ?? rendu.libelle}
      accessibilityHint={rendu.indice}
      accessibilityState={bouton ? { disabled: !touchable, busy: props.enCours } : undefined}
      disabled={!touchable}
      onPress={() => {
        vibrerLegerement();
        rendu.action?.();
      }}
      className={`h-10 min-w-[88px] flex-row items-center justify-center rounded-xl px-3 active:opacity-80 ${rendu.style}`}
    >
      {props.enCours ? <ActivityIndicator size="small" color={rendu.texte === "text-nuit" ? couleurs.nuit : couleurs.encre} /> : <Text className={`font-texte-gras text-[13px] ${rendu.texte}`}>{rendu.libelle}</Text>}
    </Pressable>
  );
}
