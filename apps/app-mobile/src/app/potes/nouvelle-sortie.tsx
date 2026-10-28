import Ionicons from "@expo/vector-icons/Ionicons";
import * as Crypto from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { formaterHeureLangue } from "@sos-miam/commun/fonctions/langue/formater-heure-langue";
import type { Langue } from "@sos-miam/commun/regles/langues";
import {
  DELAI_MIN_FIN_VOTE_MINUTES,
  DELAI_MIN_SORTIE_MINUTES,
  LONGUEUR_MAX_TITRE_SORTIE,
  MAX_PARTICIPANTS_SORTIE,
  MAX_PROPOSITIONS_SORTIE,
  MAX_SORTIES_A_VENIR,
} from "@sos-miam/commun/regles/potes";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Pote } from "@sos-miam/commun/types/potes";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import { contientMotInterdit } from "@sos-miam/commun/validation/contient-mot-interdit";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { ChoixEmojiSortie } from "~/composants/potes/ChoixEmojiSortie";
import { ChoixFinVote, type OptionFinVote } from "~/composants/potes/ChoixFinVote";
import { ChoixLieu } from "~/composants/potes/ChoixLieu";
import { ChoixParticipants } from "~/composants/potes/ChoixParticipants";
import { ChoixQuandSortie } from "~/composants/potes/ChoixQuandSortie";
import { LieuxProposesSortie } from "~/composants/potes/LieuxProposesSortie";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { REFUS_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { TEXTES_ECRAN_NOUVELLE_SORTIE, TEXTES_ECRAN_NOUVELLE_SORTIE_PAR_LANGUE } from "~/contenus/textes-ecran-nouvelle-sortie";
import { ecrireJourLongLangue } from "~/fonctions/langue/ecrire-jour-long-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Erreurs = { titre?: string; quand?: string; invites?: string; lieux?: string; envoi?: string };

type TextesNouvelleSortie = Traduction<typeof TEXTES_ECRAN_NOUVELLE_SORTIE>;

const debutDuJour = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
/** « Aujourd'hui », « Demain » ou « Vendredi 10 octobre » (avec l'année si ce n'est pas celle-ci) */
const decrireJour = (date: Date, maintenant: Date, langue: Langue, T: TextesNouvelleSortie) => {
  const ecart = Math.round((debutDuJour(date) - debutDuJour(maintenant)) / 86_400_000);
  return ecart === 0 ? T.aujourdhui : ecart === 1 ? T.demain : ecrireJourLongLangue(date, langue);
};
const decrireHeure = (date: Date, langue: Langue) => formaterHeureLangue(date.getHours(), date.getMinutes(), langue);

/** Demain à 20h : le point de départ d'une nouvelle sortie */
const demainSoir = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(20, 0, 0, 0);
  return date;
};

// Il faut laisser un peu de temps pour voter
const DELAI_MINIMUM = DELAI_MIN_SORTIE_MINUTES * 60_000;

/** Les fins de vote possibles pour une sortie : toujours après maintenant (avec un peu de marge) et avant la sortie. */
function calculerOptionsFinVote(quand: Date, maintenant: Date, langue: Langue): (OptionFinVote & { date: Date })[] {
  const T = choisirTextes(TEXTES_ECRAN_NOUVELLE_SORTIE_PAR_LANGUE, langue);
  const aDixHuitHeures = (jours: number) => {
    const date = new Date(maintenant);
    date.setDate(date.getDate() + jours);
    date.setHours(18, 0, 0, 0);
    return date;
  };
  const candidates = [
    { cle: "1h", libelle: T.dansUneHeure, date: new Date(maintenant.getTime() + 3_600_000) },
    { cle: "ce-soir", libelle: T.ceSoir, date: aDixHuitHeures(0) },
    { cle: "demain", libelle: T.demainSoir, date: aDixHuitHeures(1) },
    { cle: "avant", libelle: T.avantSortie, date: new Date(quand.getTime() - 3_600_000) },
  ];
  const valables = candidates.filter((o) => o.date.getTime() >= maintenant.getTime() + DELAI_MIN_FIN_VOTE_MINUTES * 60_000 && o.date <= quand);
  const options = valables.length > 0 ? valables : [{ cle: "avant", libelle: T.jusquaSortie, date: quand }];
  return options.map((o) => ({ ...o, detail: T.jourHeure(decrireJour(o.date, maintenant, langue, T), decrireHeure(o.date, langue)) }));
}

/** « lea,karim » (paramètre `invites`) → ces potes, s'ils sont dans ta bande (donc pas bloqués), sans doublon et dans la limite d'une sortie */
const lireInvites = (texte: string | undefined, potes: Pote[]) => {
  const demandes = String(texte ?? "").split(",").map((id) => id.trim());
  return potes.filter((p) => demandes.includes(p.id)).map((p) => p.id).slice(0, MAX_PARTICIPANTS_SORTIE - 1);
};

/** Organiser une sortie : un nom et un emoji, le jour et l'heure, les potes invités, les lieux proposés et la fin du vote. */
export default function NouvelleSortie() {
  const T = utiliserTextes(TEXTES_ECRAN_NOUVELLE_SORTIE_PAR_LANGUE);
  const REFUS_LIMITATION = utiliserTextes(REFUS_LIMITATION_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const { lieu: lieuDemande, invites: invitesDemandes } = useLocalSearchParams<{ lieu?: string; invites?: string }>();
  const { potes, creerSortie } = utiliserCommunaute();
  const { trouverLieu } = utiliserLieux();
  const [titre, setTitre] = useState("");
  const [emoji, setEmoji] = useState("🍽️");
  const [quand, setQuand] = useState(demainSoir);
  // Ouverte depuis une discussion (?invites=lea,karim) : ces potes de ta bande sont déjà invités
  const [invites, setInvites] = useState<string[]>(() => lireInvites(invitesDemandes, potes));
  // Ouverte depuis un lieu (?lieu=3) : il est déjà proposé, s'il existe
  const [lieux, setLieux] = useState<number[]>(() => {
    const id = Number(lieuDemande);
    return lieuDemande && trouverLieu(id) ? [id] : [];
  });
  const [cleFinVote, setCleFinVote] = useState("avant");
  const [choixLieuOuvert, setChoixLieuOuvert] = useState(false);
  const [erreurs, setErreurs] = useState<Erreurs>({});
  // Tirée une fois à l'ouverture : un second appui (ou un nouvel essai après une coupure) ne crée pas deux sorties
  const [cle] = useState(() => Crypto.randomUUID());
  const [envoi, setEnvoi] = useState(false);

  const maintenant = new Date();
  const options = calculerOptionsFinVote(quand, maintenant, langue);
  const option = options.find((o) => o.cle === cleFinVote) ?? options[options.length - 1];
  const lieuxChoisis = lieux.map(trouverLieu).filter((l): l is Lieu => l !== undefined);
  const quandPasse = quand.getTime() < maintenant.getTime() + DELAI_MINIMUM;
  const erreurQuand = quandPasse ? T.erreurs.quand : null;

  function basculerInvite(id: string) {
    const nouveaux = invites.includes(id) ? invites.filter((i) => i !== id) : [...invites, id];
    setInvites(nouveaux);
    setErreurs((e) => ({ ...e, invites: undefined }));
  }

  async function creer() {
    if (envoi) return;
    const propre = titre.trim();
    const trouvees: Erreurs = {};
    if (propre === "") trouvees.titre = T.erreurs.titreVide;
    else if (propre.length > LONGUEUR_MAX_TITRE_SORTIE) trouvees.titre = T.erreurs.titreLong(LONGUEUR_MAX_TITRE_SORTIE);
    else if (contientMotInterdit(propre)) trouvees.titre = T.erreurs.titreMot;
    if (quandPasse) trouvees.quand = erreurQuand ?? undefined;
    if (invites.length === 0) trouvees.invites = T.erreurs.invites;
    if (lieuxChoisis.length === 0) trouvees.lieux = T.erreurs.lieux;

    if (Object.keys(trouvees).length === 0) {
      setEnvoi(true);
      setErreurs({});
      const resultat = await creerSortie(
        {
          titre: propre,
          emoji,
          quand: quand.toISOString(),
          invites,
          lieux,
          finVote: (calculerOptionsFinVote(quand, new Date(), langue).find((o) => o.cle === option.cle) ?? option).date.toISOString(),
        },
        cle,
      );
      if ("id" in resultat) {
        router.replace({ pathname: "/potes/sortie/[id]", params: { id: resultat.id } });
        return;
      }
      setEnvoi(false);
      if (resultat.erreur === "titre") trouvees.titre = T.erreurs.titreRefuse(LONGUEUR_MAX_TITRE_SORTIE);
      if (resultat.erreur === "participants") trouvees.invites = T.erreurs.participants(MAX_PARTICIPANTS_SORTIE - 1);
      if (resultat.erreur === "lieux") trouvees.lieux = T.erreurs.lieuxDisparus;
      if (resultat.erreur === "quand")
        trouvees.quand = T.erreurs.horloge(DELAI_MIN_SORTIE_MINUTES, DELAI_MIN_FIN_VOTE_MINUTES);
      if (resultat.erreur === "trop") trouvees.envoi = T.erreurs.trop(MAX_SORTIES_A_VENIR);
      if (resultat.erreur === "compte-limite") trouvees.envoi = REFUS_LIMITATION.sortie;
      if (resultat.erreur === "reseau") trouvees.envoi = T.erreurs.reseau;
    }

    setErreurs(trouvees);
    // Le champ du nom annonce déjà sa propre erreur ; sinon, on lit la première qui bloque
    const premiere = trouvees.quand ?? trouvees.invites ?? trouvees.lieux ?? trouvees.envoi;
    if (!trouvees.titre && premiere) AccessibilityInfo.announceForAccessibility(premiere);
  }

  const erreurBas = erreurs.titre ?? erreurs.quand ?? erreurs.invites ?? erreurs.lieux ?? erreurs.envoi;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      {/* « padding » sur les deux systèmes : en bord à bord, Android ne redimensionne plus la fenêtre pour le clavier */}
      <KeyboardAvoidingView behavior={Platform.OS === "web" ? undefined : "padding"} style={{ flex: 1 }}>
        <View className="min-h-14 flex-row items-center px-5 pb-3 pt-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={T.retour}
            hitSlop={8}
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/potes"))}
            className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
          >
            <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
          </Pressable>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8" keyboardShouldPersistTaps="handled">
          <Text accessibilityRole="header" className="font-titre text-[32px] leading-[36px] text-encre">
            {T.titre}
          </Text>
          <Text className="mb-4 mt-2 font-texte text-base leading-6 text-gris">
            {lierPonctuation(T.intro)}
          </Text>

          <SectionReglages titre={T.nom}>
            <View className="gap-4 pt-2">
              <ChampTexte
                libelle={T.nomLibelle}
                valeur={titre}
                onChangeTexte={(texte) => {
                  setTitre(texte);
                  if (erreurs.titre) setErreurs((e) => ({ ...e, titre: undefined }));
                }}
                placeholder={T.nomPlaceholder}
                maxLength={LONGUEUR_MAX_TITRE_SORTIE}
                returnKeyType="done"
                aide={T.caracteres(titre.length, LONGUEUR_MAX_TITRE_SORTIE)}
                erreur={erreurs.titre}
              />
              <ChoixEmojiSortie choisi={emoji} onChoisir={setEmoji} />
            </View>
          </SectionReglages>

          <SectionReglages titre={T.quand}>
            <View className="pt-2">
              <ChoixQuandSortie
                quand={quand}
                onChanger={(date) => {
                  setQuand(date);
                  setErreurs((e) => ({ ...e, quand: undefined }));
                }}
                jour={ecrireJourLongLangue(quand, langue)}
                heure={decrireHeure(quand, langue)}
                erreur={erreurQuand ?? erreurs.quand ?? null}
              />
            </View>
          </SectionReglages>

          <SectionReglages titre={T.avecQui}>
            <ChoixParticipants potes={potes} choisis={invites} max={MAX_PARTICIPANTS_SORTIE - 1} onBasculer={basculerInvite} erreur={erreurs.invites} />
          </SectionReglages>

          <SectionReglages titre={T.ou}>
            <View className="pt-2">
              <LieuxProposesSortie
                lieux={lieuxChoisis}
                max={MAX_PROPOSITIONS_SORTIE}
                onAjouter={() => setChoixLieuOuvert(true)}
                onRetirer={(id) => setLieux((l) => l.filter((x) => x !== id))}
                erreur={erreurs.lieux}
              />
            </View>
          </SectionReglages>

          <SectionReglages titre={T.finVote}>
            <Text className="mb-1 font-texte text-sm leading-5 text-gris">{lierPonctuation(T.finVoteTexte)}</Text>
            <ChoixFinVote
              options={options}
              choisie={option.cle}
              onChoisir={(choisie) => {
                setCleFinVote(choisie);
                setErreurs((e) => ({ ...e, quand: undefined }));
              }}
            />
          </SectionReglages>
        </ScrollView>

        <View className="gap-3 border-t border-ligne bg-creme px-5 pb-4 pt-3">
          {erreurBas ? (
            <Text className="overflow-hidden rounded-2xl bg-rose-alerte px-4 py-2.5 font-texte-semi text-sm leading-5 text-rouge-texte">{lierPonctuation(erreurBas)}</Text>
          ) : null}
          <Bouton
            libelle={envoi ? T.unInstant : T.creer}
            desactive={envoi}
            onPress={() => void creer()}
            indice={T.creerIndice}
          />
        </View>
      </KeyboardAvoidingView>

      <ChoixLieu
        visible={choixLieuOuvert}
        titre={T.proposerLieu}
        dejaChoisis={lieux}
        onChoisir={(id) => {
          setLieux((l) => (l.includes(id) || l.length >= MAX_PROPOSITIONS_SORTIE ? l : [...l, id]));
          setErreurs((e) => ({ ...e, lieux: undefined }));
          setChoixLieuOuvert(false);
        }}
        onFermer={() => setChoixLieuOuvert(false)}
      />
    </SafeAreaView>
  );
}
