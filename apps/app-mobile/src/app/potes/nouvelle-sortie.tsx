import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { AccessibilityInfo, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { LONGUEUR_MAX_TITRE_SORTIE, MAX_PARTICIPANTS_SORTIE, MAX_PROPOSITIONS_SORTIE } from "@sos-miam/commun/regles/potes";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Pote } from "@sos-miam/commun/types/potes";
import { contientMotInterdit } from "@sos-miam/commun/validation/contient-mot-interdit";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { BandeauDemoPotes } from "~/composants/potes/BandeauDemoPotes";
import { ChoixEmojiSortie } from "~/composants/potes/ChoixEmojiSortie";
import { ChoixFinVote, type OptionFinVote } from "~/composants/potes/ChoixFinVote";
import { ChoixLieu } from "~/composants/potes/ChoixLieu";
import { ChoixParticipants } from "~/composants/potes/ChoixParticipants";
import { ChoixQuandSortie } from "~/composants/potes/ChoixQuandSortie";
import { LieuxProposesSortie } from "~/composants/potes/LieuxProposesSortie";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { formaterDateIso } from "~/fonctions/dates/formater-date-iso";
import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import couleurs from "~/theme/couleurs";

type Erreurs = { titre?: string; quand?: string; invites?: string; lieux?: string };

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const debutDuJour = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
const capitaliser = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);
/** « vendredi 10 octobre » (avec l'année si ce n'est pas celle-ci) */
const ecrireDate = (date: Date) => {
  const longue = formaterDateLongue(formaterDateIso(date));
  return `${JOURS[date.getDay()]} ${date.getFullYear() === new Date().getFullYear() ? longue.replace(/ \d+$/, "") : longue}`;
};
/** « aujourd'hui », « demain » ou « vendredi 10 octobre » */
const decrireJour = (date: Date, maintenant: Date) => {
  const ecart = Math.round((debutDuJour(date) - debutDuJour(maintenant)) / 86_400_000);
  return ecart === 0 ? "aujourd'hui" : ecart === 1 ? "demain" : ecrireDate(date);
};
const decrireHeure = (date: Date) => formaterHeure(`${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`);

/** Demain à 20h : le point de départ d'une nouvelle sortie */
const demainSoir = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(20, 0, 0, 0);
  return date;
};

// Il faut laisser un peu de temps pour voter
const DELAI_MINIMUM = 15 * 60_000;

/** Les fins de vote possibles pour une sortie : toujours après maintenant (avec un peu de marge) et avant la sortie. */
function calculerOptionsFinVote(quand: Date, maintenant: Date): (OptionFinVote & { date: Date })[] {
  const aDixHuitHeures = (jours: number) => {
    const date = new Date(maintenant);
    date.setDate(date.getDate() + jours);
    date.setHours(18, 0, 0, 0);
    return date;
  };
  const candidates = [
    { cle: "1h", libelle: "Dans 1 h", date: new Date(maintenant.getTime() + 3_600_000) },
    { cle: "ce-soir", libelle: "Ce soir, 18h", date: aDixHuitHeures(0) },
    { cle: "demain", libelle: "Demain, 18h", date: aDixHuitHeures(1) },
    { cle: "avant", libelle: "1 h avant la sortie", date: new Date(quand.getTime() - 3_600_000) },
  ];
  const valables = candidates.filter((o) => o.date.getTime() >= maintenant.getTime() + 10 * 60_000 && o.date <= quand);
  const options = valables.length > 0 ? valables : [{ cle: "avant", libelle: "Jusqu'à la sortie", date: quand }];
  return options.map((o) => ({ ...o, detail: `${capitaliser(decrireJour(o.date, maintenant))} à ${decrireHeure(o.date)}` }));
}

/** « Inès » ; « Inès et Jade » */
const listerPrenoms = (potes: Pote[]) => (potes.length <= 1 ? (potes[0]?.prenom ?? "") : `${potes.slice(0, -1).map((p) => p.prenom).join(", ")} et ${potes[potes.length - 1].prenom}`);

/** Organiser une sortie : un nom et un emoji, le jour et l'heure, les potes invités, les lieux proposés et la fin du vote. */
export default function NouvelleSortie() {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const { lieu: lieuDemande } = useLocalSearchParams<{ lieu?: string }>();
  const { potes, trouverPote, lieuPermisDansSortie, creerSortie } = utiliserCommunaute();
  const [titre, setTitre] = useState("");
  const [emoji, setEmoji] = useState("🍽️");
  const [quand, setQuand] = useState(demainSoir);
  const [invites, setInvites] = useState<string[]>([]);
  // Ouverte depuis un lieu (?lieu=3) : il est déjà proposé, s'il est permis
  const [lieux, setLieux] = useState<number[]>(() => {
    const id = Number(lieuDemande);
    return lieuDemande && lieuxExemples.some((l) => l.id === id) && lieuPermisDansSortie(id, []) ? [id] : [];
  });
  const [cleFinVote, setCleFinVote] = useState("avant");
  const [choixLieuOuvert, setChoixLieuOuvert] = useState(false);
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const permis = useCallback((lieu: Lieu) => lieuPermisDansSortie(lieu.id, invites), [lieuPermisDansSortie, invites]);

  const maintenant = new Date();
  const options = calculerOptionsFinVote(quand, maintenant);
  const option = options.find((o) => o.cle === cleFinVote) ?? options[options.length - 1];
  const lieuxChoisis = lieux.map((id) => lieuxExemples.find((l) => l.id === id)).filter((l): l is Lieu => l !== undefined);
  const invitesMineurs = invites.map(trouverPote).filter((p): p is Pote => p?.mineur === true);
  const quandPasse = quand.getTime() < maintenant.getTime() + DELAI_MINIMUM;
  const erreurQuand = quandPasse ? "Ce moment est déjà passé ou presque : laisse à la bande au moins un quart d'heure pour voter." : null;

  function basculerInvite(id: string) {
    const nouveaux = invites.includes(id) ? invites.filter((i) => i !== id) : [...invites, id];
    setInvites(nouveaux);
    setErreurs((e) => ({ ...e, invites: undefined }));
    // Un mineur rejoint la sortie : les bars déjà proposés s'en vont
    const gardes = lieux.filter((l) => lieuPermisDansSortie(l, nouveaux));
    if (gardes.length < lieux.length) {
      setLieux(gardes);
      setAnnonce({ texte: "🧃 Bar retiré : tout le monde n'a pas encore 18 ans", numero: Date.now() });
    }
  }

  function creer() {
    const propre = titre.trim();
    const trouvees: Erreurs = {};
    if (propre === "") trouvees.titre = "Donne un petit nom à ta sortie, même « Miam du vendredi » fait l'affaire.";
    else if (propre.length > LONGUEUR_MAX_TITRE_SORTIE) trouvees.titre = `${LONGUEUR_MAX_TITRE_SORTIE} caractères au plus, fais court et gourmand.`;
    else if (contientMotInterdit(propre)) trouvees.titre = "Un mot de ce titre ne passe pas chez nous. Tu reformules gentiment ?";
    if (quandPasse) trouvees.quand = erreurQuand ?? undefined;
    if (invites.length === 0) trouvees.invites = "Invite au moins un pote : une sortie tout seul, c'est un dîner aux chandelles avec toi-même.";
    if (lieuxChoisis.length === 0) trouvees.lieux = "Propose au moins un lieu pour lancer le vote.";

    if (Object.keys(trouvees).length === 0) {
      const resultat = creerSortie({
        titre: propre,
        emoji,
        quand: quand.toISOString(),
        invites,
        lieux,
        finVote: (calculerOptionsFinVote(quand, new Date()).find((o) => o.cle === option.cle) ?? option).date.toISOString(),
      });
      if ("id" in resultat) {
        router.replace({ pathname: "/potes/sortie/[id]", params: { id: resultat.id } });
        return;
      }
      if (resultat.erreur === "titre") trouvees.titre = "Ce titre ne passe pas : 40 caractères au plus, et des mots gentils.";
      if (resultat.erreur === "participants") trouvees.invites = `Invite entre 1 et ${MAX_PARTICIPANTS_SORTIE - 1} potes de ta bande.`;
      if (resultat.erreur === "lieux") trouvees.lieux = "Aucun des lieux choisis n'est possible pour cette bande : propose-en un autre.";
    }

    setErreurs(trouvees);
    // Le champ du nom annonce déjà sa propre erreur ; sinon, on lit la première qui bloque
    const premiere = trouvees.quand ?? trouvees.invites ?? trouvees.lieux;
    if (!trouvees.titre && premiere) AccessibilityInfo.announceForAccessibility(premiere);
  }

  const erreurBas = erreurs.titre ?? erreurs.quand ?? erreurs.invites ?? erreurs.lieux;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      {/* « padding » sur les deux systèmes : en bord à bord, Android ne redimensionne plus la fenêtre pour le clavier */}
      <KeyboardAvoidingView behavior={Platform.OS === "web" ? undefined : "padding"} style={{ flex: 1 }}>
        <View className="min-h-14 flex-row items-center px-5 pb-3 pt-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            hitSlop={8}
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/potes"))}
            className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
          >
            <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
          </Pressable>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8" keyboardShouldPersistTaps="handled">
          <Text accessibilityRole="header" className="font-titre text-[32px] leading-[36px] text-encre">
            Nouvelle sortie
          </Text>
          <Text className="mb-4 mt-2 font-texte text-base leading-6 text-gris">
            {lierPonctuation("Tu proposes des lieux, la bande vote, et tout le monde se retrouve au bon endroit. Simple, non ?")}
          </Text>
          <View className="mb-6">
            <BandeauDemoPotes />
          </View>

          <SectionReglages titre="Le nom">
            <View className="gap-4 pt-2">
              <ChampTexte
                libelle="Le nom de la sortie"
                valeur={titre}
                onChangeTexte={(texte) => {
                  setTitre(texte);
                  if (erreurs.titre) setErreurs((e) => ({ ...e, titre: undefined }));
                }}
                placeholder="Resto de vendredi soir"
                maxLength={LONGUEUR_MAX_TITRE_SORTIE}
                returnKeyType="done"
                aide={`${titre.length}/${LONGUEUR_MAX_TITRE_SORTIE} caractères`}
                erreur={erreurs.titre}
              />
              <ChoixEmojiSortie choisi={emoji} onChoisir={setEmoji} />
            </View>
          </SectionReglages>

          <SectionReglages titre="Quand ?">
            <View className="pt-2">
              <ChoixQuandSortie
                quand={quand}
                onChanger={(date) => {
                  setQuand(date);
                  setErreurs((e) => ({ ...e, quand: undefined }));
                }}
                jour={capitaliser(ecrireDate(quand))}
                heure={decrireHeure(quand)}
                erreur={erreurQuand}
              />
            </View>
          </SectionReglages>

          <SectionReglages titre="Avec qui ?">
            <ChoixParticipants potes={potes} choisis={invites} max={MAX_PARTICIPANTS_SORTIE - 1} onBasculer={basculerInvite} erreur={erreurs.invites} />
          </SectionReglages>

          <SectionReglages titre="Où ?">
            <View className="pt-2">
              <LieuxProposesSortie
                lieux={lieuxChoisis}
                max={MAX_PROPOSITIONS_SORTIE}
                onAjouter={() => setChoixLieuOuvert(true)}
                onRetirer={(id) => setLieux((l) => l.filter((x) => x !== id))}
                note={
                  invitesMineurs.length > 0
                    ? `🧃 ${listerPrenoms(invitesMineurs)} ${invitesMineurs.length > 1 ? "n'ont" : "n'a"} pas encore 18 ans : pas de bar pour cette sortie, on trinque au sirop.`
                    : null
                }
                erreur={erreurs.lieux}
              />
            </View>
          </SectionReglages>

          <SectionReglages titre="Fin du vote">
            <Text className="mb-1 font-texte text-sm leading-5 text-gris">{lierPonctuation("Passé ce moment, le lieu qui a le plus de votes l'emporte.")}</Text>
            <ChoixFinVote options={options} choisie={option.cle} onChoisir={setCleFinVote} />
          </SectionReglages>
        </ScrollView>

        <View className="gap-3 border-t border-ligne bg-creme px-5 pb-4 pt-3">
          {erreurBas ? (
            <Text className="overflow-hidden rounded-2xl bg-rose-alerte px-4 py-2.5 font-texte-semi text-sm leading-5 text-rouge-texte">{lierPonctuation(erreurBas)}</Text>
          ) : null}
          <Bouton libelle="Créer la sortie" onPress={creer} indice="Tes potes invités pourront voter et discuter" />
        </View>
      </KeyboardAvoidingView>

      <ChoixLieu
        visible={choixLieuOuvert}
        titre="Proposer un lieu"
        dejaChoisis={lieux}
        permis={permis}
        onChoisir={(id) => {
          setLieux((l) => (l.includes(id) || l.length >= MAX_PROPOSITIONS_SORTIE ? l : [...l, id]));
          setErreurs((e) => ({ ...e, lieux: undefined }));
          setChoixLieuOuvert(false);
        }}
        onFermer={() => setChoixLieuOuvert(false)}
      />
      <Annonce annonce={annonce} haut={marges.top + 8} onFin={finAnnonce} />
    </SafeAreaView>
  );
}
