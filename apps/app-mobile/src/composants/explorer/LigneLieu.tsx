import Ionicons from "@expo/vector-icons/Ionicons";
import { memo } from "react";
import { Pressable, Text, View, type ImageSourcePropType } from "react-native";

import { TYPES_EVENEMENT_ECRITS } from "@sos-miam/commun/contenus/types-evenement";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { EvenementLieuPublic } from "@sos-miam/commun/types/evenement";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { estLieuVerifie } from "@sos-miam/commun/fonctions/lieux/est-lieu-verifie";
import { MESSAGE_SANITAIRE_ALCOOL } from "@sos-miam/commun/contenus/prevention-alcool";
import { parleDAlcool } from "@sos-miam/commun/fonctions/prevention/parle-d-alcool";
import { VignetteLieu } from "~/composants/explorer/VignetteLieu";
import { BadgeVerification } from "~/composants/lieux/BadgeVerification";
import { TEXTES_EXPLORER_PAR_LANGUE } from "~/contenus/textes-explorer";
import { TEXTES_EXPLORER_LISTE_PAR_LANGUE } from "~/contenus/textes-explorer-liste";
import { TEXTES_PREVENTION_PAR_LANGUE } from "~/contenus/textes-prevention";
import { ecrireDistanceDepuis } from "~/fonctions/geo/ecrire-distance-depuis";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";
import { ecrireJourLongLangue } from "~/fonctions/langue/ecrire-jour-long-langue";
import { formaterDistanceLangue } from "~/fonctions/langue/formater-distance-langue";
import { formaterHeureTexteLangue } from "~/fonctions/langue/formater-heure-texte-langue";
import { ecrireQuartierVille } from "~/fonctions/lieux/ecrire-quartier-ville";
import { estLigneLieuInchangee } from "~/fonctions/lieux/est-ligne-lieu-inchangee";
import { estOuvertMaintenant } from "~/fonctions/lieux/est-ouvert-maintenant";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";

type Props = {
  lieu: Lieu;
  km: number | null;
  depuis: string | null;
  /** Image du lieu ; sans image, son dégradé et son emoji */
  image: ImageSourcePropType | null;
  /** Lieu touché sur la carte : la ligne est mise en avant */
  selectionne: boolean;
  onOuvrir: (id: number) => void;
  /** Filtre « Événements » : l'événement de ce lieu sur la période */
  evenement?: EvenementLieuPublic | null;
  maintenant: Date;
};

/** Une ligne de la liste d'Explorer : vignette, nom, ce que c'est et où, distance, prix, ouvert ou pas, et son SOS ou son bon plan du moment. */
export const LigneLieu = memo(function LigneLieu({ lieu, km, depuis, image, selectionne, onOuvrir, evenement = null, maintenant }: Props) {
  const couleurs = utiliserCouleurs();
  const { langue } = utiliserLangue();
  const T = choisirTextes(TEXTES_EXPLORER_LISTE_PAR_LANGUE, langue);
  // « €€ » lu tel quel donnerait « euro euro » : on le dit en mots, avec les mêmes noms que les pastilles de budget (FiltresExplorer)
  const budgetLu = choisirTextes(TEXTES_EXPLORER_PAR_LANGUE, langue).budgetsLus[lieu.prix];
  const traductionSanitaire = choisirTextes(TEXTES_PREVENTION_PAR_LANGUE, langue).traductionMessageSanitaire;
  const ouvert = estOuvertMaintenant(lieu, maintenant);
  const distance = km === null ? null : formaterDistanceLangue(km, langue);
  const distanceLue = km === null ? null : ecrireDistanceDepuis(km, depuis, langue);
  // Sans compte SOS Miam : pas de SOS, et c'est dit clairement (« Non vérifié »)
  const verifie = estLieuVerifie(lieu);
  const heureSos = lieu.sos ? formaterHeureTexteLangue(lieu.sos.jusqua, langue) : "";
  const sos = verifie && lieu.sos ? T.sosPlaces(lieu.sos.places, heureSos) : null;

  // Le bon plan affiché parle d'alcool (happy hour…) ou l'événement montré en a (comme sur la fiche) : le message sanitaire juste dessous
  const offreAlcool = (!sos && parleDAlcool(lieu.alerte)) || evenement?.alcool === true;
  // Ce que c'est et où : un morceau vide (quartier pas renseigné) ne laisse pas de « , » orpheline
  const ou = ecrireQuartierVille(lieu);
  const quoiEtOu = [lieu.info.trim(), ou].filter(Boolean);

  // Un seul libellé, dans l'ordre de l'écran ; l'état « sélectionné » est annoncé par accessibilityState
  const lu = [
    [lieu.nom, ...quoiEtOu].join(", "),
    `${distanceLue ? `${T.aDistanceLu(distanceLue)}, ` : ""}${budgetLu}, ${ouvert ? T.ouvertLu : T.fermeLu}`,
    sos ? T.sosLu(sos) : null,
    lieu.alerte && !sos ? lieu.alerte : null,
    evenement ? T.evenementLu(evenement.titre, ecrireJourLongLangue(evenement.debut, langue, maintenant), ecrireHeureLangue(evenement.debut, langue)) : null,
    offreAlcool ? MESSAGE_SANITAIRE_ALCOOL : null,
    offreAlcool ? traductionSanitaire : null,
    verifie ? null : T.nonVerifieLu,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={lu}
      accessibilityHint={T.ouvrirFicheIndice}
      accessibilityState={{ selected: selectionne }}
      onPress={() => {
        vibrerLegerement();
        onOuvrir(lieu.id);
      }}
      className={`min-h-16 flex-row items-center gap-3 border-b border-ligne px-4 py-2.5 active:opacity-70 ${selectionne ? "bg-jaune-clair" : ""}`}
    >
      <View className={`rounded-2xl border-2 ${selectionne ? "border-encre" : "border-transparent"}`}>
        <VignetteLieu lieu={lieu} image={image} hauteur={56} avecLogo />
      </View>

      <View className="flex-1 gap-0.5">
        <Text numberOfLines={1} className="font-texte-gras text-base text-encre">{lieu.nom}</Text>
        <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
          {quoiEtOu.join(" · ")}
        </Text>
        <Text numberOfLines={1} className="font-texte-moyen text-[13px] text-gris">
          {distance ? `${distance} · ` : ""}{lieu.prix} · <Text className={ouvert ? "font-texte-gras text-encre" : "font-texte-semi text-rouge-texte"}>{ouvert ? T.ouvert : T.ferme}</Text>
        </Text>
        {sos ? (
          <Text numberOfLines={1} className="mt-1 self-start overflow-hidden rounded-full border border-encre bg-jaune px-2 py-0.5 font-texte-gras text-xs text-nuit">
            {T.pastilleSos(lieu.sos?.places ?? 0, heureSos)}
          </Text>
        ) : lieu.alerte ? (
          <Text numberOfLines={1} className="mt-1 self-start overflow-hidden rounded-full bg-rose-alerte px-2 py-0.5 font-texte-gras text-xs text-rouge-texte">
            🔥 {lieu.alerte}
          </Text>
        ) : null}
        {evenement ? (
          <Text numberOfLines={1} className="mt-1 self-start overflow-hidden rounded-full border border-encre bg-carte px-2 py-0.5 font-texte-gras text-xs text-encre">
            {`${TYPES_EVENEMENT_ECRITS[evenement.type].emoji} ${evenement.titre} · ${ecrireJourLongLangue(evenement.debut, langue, maintenant).split(" ")[0]} ${ecrireHeureLangue(evenement.debut, langue)}`}
          </Text>
        ) : null}
        {offreAlcool ? (
          <View className="mt-1">
            <MentionPrevention variante="courte" />
          </View>
        ) : null}
        {verifie ? null : (
          <View className="mt-1">
            <BadgeVerification verifie={false} taille="petite" />
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={18} color={couleurs.gris} />
    </Pressable>
  );
}, estLigneLieuInchangee);
