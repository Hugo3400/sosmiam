import { Text, View } from "react-native";

import { LIBELLES_ANIMAUX_PAR_LANGUE, LIBELLES_PAIEMENT_PAR_LANGUE, LIBELLES_RESERVATION_PAR_LANGUE } from "@sos-miam/commun/contenus/libelles-infos-pratiques";
import type { AccueilAnimaux, MoyenPaiement, ReservationConseillee } from "@sos-miam/commun/types/infos-pratiques";
import type { ChampInfosPratiques } from "@sos-miam/commun/validation/valider-infos-pratiques";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { Interrupteur } from "~/composants/interface/Interrupteur";
import { Pastille } from "~/composants/interface/Pastille";
import { TEXTES_INFOS_PRATIQUES_PAR_LANGUE } from "~/contenus/textes-infos-pratiques";
import type { BrouillonInfosPratiques } from "~/fonctions/lieux/creer-brouillon-infos-pratiques";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Les morceaux du formulaire, à montrer tous (mode pro) ou seulement ceux qui ont changé (proposition d'un client) */
export type PartieInfosPratiques = "contact" | "animaux" | "equipements" | "reservation" | "paiements";

type Props = {
  brouillon: BrouillonInfosPratiques;
  onChanger: (partiel: Partial<BrouillonInfosPratiques>) => void;
  /** Le champ à corriger (validerInfosPratiques), dit sous le champ */
  erreur: ChampInfosPratiques | null;
  parties?: readonly PartieInfosPratiques[];
};

const TOUTES: readonly PartieInfosPratiques[] = ["contact", "animaux", "equipements", "reservation", "paiements"];
const ANIMAUX: readonly AccueilAnimaux[] = ["bienvenus", "terrasse", "non"];
const RESERVATIONS: readonly ReservationConseillee[] = ["inutile", "conseillee", "obligatoire"];
const PAIEMENTS: readonly MoyenPaiement[] = ["cb", "sans-contact", "especes", "tickets-resto", "cheques-vacances"];
const CASES: readonly { cle: "accessible" | "terrasse" | "wifi" | "enfants" | "parking"; emoji: string }[] = [
  { cle: "accessible", emoji: "♿" },
  { cle: "terrasse", emoji: "☀️" },
  { cle: "wifi", emoji: "📶" },
  { cle: "enfants", emoji: "👶" },
  { cle: "parking", emoji: "🅿️" },
];

/**
 * Les champs des infos pratiques d'un lieu, mêmes mots que sa fiche : contact (téléphone, site, Instagram), animaux,
 * équipements (cases), réservation et paiements. Sert au mode pro (tout) et aux propositions de modification (ce qui a changé).
 * Une case décochée vaut « non » ; une pastille touchée deux fois redevient « pas d'info ».
 */
export function ChampsInfosPratiques({ brouillon, onChanger, erreur, parties = TOUTES }: Props) {
  const T = utiliserTextes(TEXTES_INFOS_PRATIQUES_PAR_LANGUE);
  const C = T.champs;
  const erreurs = T.erreurs;
  const animaux = utiliserTextes(LIBELLES_ANIMAUX_PAR_LANGUE);
  const paiements = utiliserTextes(LIBELLES_PAIEMENT_PAR_LANGUE);
  const reservations = utiliserTextes(LIBELLES_RESERVATION_PAR_LANGUE);
  const basculerPaiement = (p: MoyenPaiement) => {
    const actuels = brouillon.paiements ?? [];
    onChanger({ paiements: actuels.includes(p) ? actuels.filter((x) => x !== p) : [...actuels, p] });
  };

  return (
    <View className="gap-5">
      {parties.includes("contact") ? (
        <>
          <ChampTexte libelle={C.telephone} valeur={brouillon.telephone} onChangeTexte={(telephone) => onChanger({ telephone })} keyboardType="phone-pad" placeholder="04 67 12 34 56" erreur={erreur === "telephone" ? erreurs.telephone : null} />
          <ChampTexte libelle={C.site} mention={C.facultatif} valeur={brouillon.siteWeb} onChangeTexte={(siteWeb) => onChanger({ siteWeb })} keyboardType="url" autoCapitalize="none" autoCorrect={false} placeholder="https://" erreur={erreur === "siteWeb" ? erreurs.siteWeb : null} />
          <ChampTexte libelle={C.instagram} mention={C.facultatif} valeur={brouillon.instagram} onChangeTexte={(instagram) => onChanger({ instagram })} autoCapitalize="none" autoCorrect={false} placeholder={C.exempleInstagram} erreur={erreur === "instagram" ? erreurs.instagram : null} />
        </>
      ) : null}

      {parties.includes("animaux") ? (
        <View className="gap-2">
          <Text className="font-texte-gras text-base text-encre">{C.animaux}</Text>
          <View className="flex-row flex-wrap gap-2">
            {ANIMAUX.map((a, i) => (
              <Pastille key={a} libelle={animaux[a].texte} emoji={animaux[a].emoji} role="radio" position={i + 1} total={ANIMAUX.length} choisi={brouillon.animaux === a} onPress={() => onChanger({ animaux: brouillon.animaux === a ? undefined : a })} />
            ))}
          </View>
        </View>
      ) : null}

      {parties.includes("equipements") ? (
        <View className="gap-3">
          {CASES.map((c) => (
            <Interrupteur key={c.cle} titre={T.equipements[c.cle]} emoji={c.emoji} valeur={brouillon[c.cle] === true} onChanger={(v) => onChanger({ [c.cle]: v ? true : undefined })} />
          ))}
        </View>
      ) : null}

      {parties.includes("reservation") ? (
        <View className="gap-2">
          <Text className="font-texte-gras text-base text-encre">{C.reservation}</Text>
          <View className="flex-row flex-wrap gap-2">
            {RESERVATIONS.map((r, i) => (
              <Pastille key={r} libelle={reservations[r]} role="radio" position={i + 1} total={RESERVATIONS.length} choisi={brouillon.reservation === r} onPress={() => onChanger({ reservation: brouillon.reservation === r ? undefined : r })} />
            ))}
          </View>
        </View>
      ) : null}

      {parties.includes("paiements") ? (
        <View className="gap-2">
          <Text className="font-texte-gras text-base text-encre">{C.paiements}</Text>
          <View className="flex-row flex-wrap gap-2">
            {PAIEMENTS.map((p, i) => (
              <Pastille key={p} libelle={paiements[p].charAt(0).toLocaleUpperCase("fr-FR") + paiements[p].slice(1)} position={i + 1} total={PAIEMENTS.length} choisi={(brouillon.paiements ?? []).includes(p)} onPress={() => basculerPaiement(p)} />
            ))}
          </View>
        </View>
      ) : null}

      {erreur === "autre" ? <Text className="font-texte-semi text-sm text-rouge-texte">{erreurs.autre}</Text> : null}
    </View>
  );
}
