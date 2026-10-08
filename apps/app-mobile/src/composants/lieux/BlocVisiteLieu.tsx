import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { calculerPointsVisite } from "@sos-miam/commun/fonctions/visites/calculer-points-visite";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { InfosVisiteLieu } from "@sos-miam/commun/types/visite";
import { LigneBlocVisite } from "~/composants/lieux/LigneBlocVisite";
import { BoutonDemanderAddition } from "~/composants/visites/BoutonDemanderAddition";
import { RangeeTampons } from "~/composants/visites/RangeeTampons";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { estSosEnCours } from "~/fonctions/lieux/est-sos-en-cours";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserDemandeCompte } from "~/hooks/utiliser-demande-compte";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserVisites } from "~/hooks/utiliser-visites";
import couleurs from "~/theme/couleurs";

type Lecture = { etat: "attente" } | { etat: "lu"; infos: InfosVisiteLieu } | { etat: "erreur"; erreur: ErreurService };

// Le lieu n'existe pas pour ce service, ou n'est pas pour ce compte (la fiche le dit déjà) : le bloc ne montre rien
const ERREURS_SILENCIEUSES: readonly ErreurService[] = ["introuvable", "mineur-bar"];
// Un raté passager pendant une relecture : on garde ce qu'on avait plutôt que d'effacer le bloc
const ERREURS_PASSAGERES: readonly ErreurService[] = ["hors-ligne", "trop-de-demandes"];

/** « Un tiramisu maison » → « un tiramisu maison », pour le glisser dans une phrase (un sigle en tête reste tel quel) */
function enMinuscule(texte: string): string {
  return /^\p{Lu}\p{Ll}/u.test(texte) ? texte.charAt(0).toLowerCase() + texte.slice(1) : texte;
}

/** Ce que dit la ligne de la carte de fidélité ; null s'il n'y a ni programme ni récompense à prendre ici */
function decrireFidelite(infos: InfosVisiteLieu): { titre: string; texte: string; libelleLu: string; tampons: number; sur: number } | null {
  const { carte, programme } = infos;
  const prete = carte?.pretes[0];
  if (prete) {
    const autres = carte.pretes.length - 1;
    const texte = `${autres > 0 ? `Et ${autres} autre${autres > 1 ? "s" : ""} derrière. ` : ""}Ouvre ta carte et montre le code à l'équipe.`;
    return { titre: `${prete.libelle} t'attend !`, texte, libelleLu: `Carte de fidélité : ${prete.libelle} t'attend ! ${texte}`, tampons: carte.tampons, sur: carte.sur };
  }
  if (!programme) return null;
  const sur = carte?.sur ?? programme.visitesRequises;
  const tampons = Math.min(carte?.tampons ?? 0, sur);
  const restantes = sur - tampons;
  const recompense = enMinuscule(carte?.recompense ?? programme.recompense);
  const titre = `${tampons}/${sur} · encore ${restantes} visite${restantes > 1 ? "s" : ""} pour ${recompense}`;
  return { titre, texte: "", libelleLu: `Carte de fidélité : ${tampons} tampon${tampons > 1 ? "s" : ""} sur ${sur}, encore ${restantes} visite${restantes > 1 ? "s" : ""} pour ${recompense}`, tampons, sur };
}

/** Ce que rapporte une visite ici : les points (+25 pendant un SOS en cours), le tampon s'il y a une carte, l'avis vérifié */
function decrireGains(lieu: Lieu, infos: InfosVisiteLieu): string {
  const points = calculerPointsVisite(false);
  const tampon = infos.programme ? ", un tampon" : "";
  if (estSosEnCours(lieu)) {
    return `Ils sont en SOS ce soir : ta visite vaut +${calculerPointsVisite(true)} points au lieu de +${points}${tampon}, et tu pourras laisser un avis vérifié. Demande l'addition au moment de payer.`;
  }
  return `Au moment de payer, demande l'addition ici : +${points} points${tampon}, et tu pourras laisser un avis vérifié.`;
}

/**
 * Bloc « Tu passes chez eux ? » de la fiche d'un lieu, entre le haut de la fiche et sa suite : demander l'addition (ou scanner
 * le QR du comptoir) pour que la visite compte, ta demande en cours ici, ta carte de fidélité et « Réserver ».
 * La rescousse reste à part, dans la barre du bas : aider un lieu et y passer sont deux gestes différents.
 * Relu à chaque changement de tes visites (une demande réglée, un tampon posé). Mémorisé : une rescousse ne le redessine pas.
 */
export const BlocVisiteLieu = memo(function BlocVisiteLieu({ lieu }: { lieu: Lieu }) {
  const router = useRouter();
  const services = utiliserServices();
  const demanderCompte = utiliserDemandeCompte();
  // Changent quand tes visites changent (demande réglée, expirée, tampon posé…) : le bloc se relit avec elles
  const { enCours, cartes } = utiliserVisites();
  const [lecture, setLecture] = useState<Lecture>({ etat: "attente" });
  const [essai, setEssai] = useState(0);

  useEffect(() => {
    let actuel = true;
    const garderOuRemplacer = (erreur: ErreurService) =>
      setLecture((avant) => (avant.etat === "lu" && ERREURS_PASSAGERES.includes(erreur) ? avant : { etat: "erreur", erreur }));
    services.visites.lireLieu(lieu.id).then(
      (reponse) => {
        if (!actuel) return;
        if (reponse.ok) setLecture({ etat: "lu", infos: reponse.infos });
        else garderOuRemplacer(reponse.erreur);
      },
      () => {
        if (actuel) garderOuRemplacer("hors-ligne");
      },
    );
    return () => {
      actuel = false;
    };
  }, [services, lieu.id, enCours, cartes, essai]);

  if (lecture.etat === "attente") return null;
  if (lecture.etat === "erreur" && ERREURS_SILENCIEUSES.includes(lecture.erreur)) return null;

  const scanner = () => {
    if (demanderCompte("scan")) router.push("/scan/camera");
  };
  const reserver = () => {
    if (demanderCompte("reserver")) router.push({ pathname: "/lieu/[id]/reserver", params: { id: String(lieu.id) } });
  };
  const voirCarte = () => {
    if (demanderCompte("fidelite")) router.push("/fidelite");
  };

  const contenu = () => {
    if (lecture.etat === "erreur") {
      if (lecture.erreur === "service-indisponible") {
        return (
          <View accessible className="flex-row items-center gap-3">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-2xl">
              🛠️
            </Text>
            <Text className="flex-1 font-texte text-[15px] leading-[22px] text-gris">{lierPonctuation("Bientôt : demande l'addition dans l'app pour que ta visite compte.")}</Text>
          </View>
        );
      }
      const message = MESSAGES_SERVICE[lecture.erreur];
      return (
        <View className="gap-2">
          <Text className="font-texte-gras text-[15px] text-encre">{lierPonctuation(remplirModele(message.titre, { lieu: lieu.nom }))}</Text>
          <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(remplirModele(message.texte, { lieu: lieu.nom }))}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityHint="Relit les infos de visite de ce lieu"
            onPress={() => {
              vibrerLegerement();
              setEssai((n) => n + 1);
            }}
            className="min-h-11 justify-center self-start active:opacity-60"
          >
            <Text className="font-texte-gras text-[15px] text-encre underline">Réessayer</Text>
          </Pressable>
        </View>
      );
    }

    const { infos } = lecture;
    const { enCoursIci } = infos;
    const fidelite = decrireFidelite(infos);
    return (
      <>
        {enCoursIci ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ta demande d'addition est en cours ici. Voir le code"
            accessibilityHint="Ouvre ta demande, avec le code à montrer au moment de payer"
            onPress={() => {
              vibrerLegerement();
              router.push({ pathname: "/visite/[id]", params: { id: String(enCoursIci.id) } });
            }}
            className="flex-row items-center gap-3 rounded-2xl border-2 border-encre bg-jaune-clair px-4 py-3 active:opacity-80"
          >
            <View className="h-2.5 w-2.5 rounded-full bg-tomate" />
            <View className="flex-1">
              <Text className="font-texte-gras text-[15px] text-encre">Ta demande est en cours</Text>
              <Text className="font-texte text-sm text-gris">{lierPonctuation("Montre ton code au moment de payer.")}</Text>
            </View>
            <Text className="font-texte-gras text-[15px] text-encre">Voir le code</Text>
            <Ionicons name="chevron-forward" size={18} color={couleurs.encre} />
          </Pressable>
        ) : infos.validationActive ? (
          <View className="gap-3">
            <Text className="font-texte text-[15px] leading-[22px] text-gris">{lierPonctuation(decrireGains(lieu, infos))}</Text>
            <BoutonDemanderAddition lieu={lieu} />
            <Pressable
              accessibilityRole="button"
              accessibilityHint="Ouvre l'appareil photo pour scanner le QR du comptoir"
              onPress={() => {
                vibrerLegerement();
                scanner();
              }}
              className="min-h-11 flex-row items-center justify-center gap-2 active:opacity-60"
            >
              <Ionicons accessibilityElementsHidden importantForAccessibility="no-hide-descendants" name="qr-code-outline" size={18} color={couleurs.encre} />
              <Text className="font-texte-semi text-[15px] text-encre underline">Ou scanne le QR que te montre l'équipe</Text>
            </Pressable>
          </View>
        ) : (
          <View accessible className="flex-row gap-3">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-2xl">
              {MESSAGES_SERVICE["lieu-sans-validation"].emoji}
            </Text>
            <View className="flex-1 gap-1">
              <Text className="font-texte-gras text-[15px] leading-5 text-encre">{lierPonctuation(remplirModele(MESSAGES_SERVICE["lieu-sans-validation"].titre, { lieu: lieu.nom }))}</Text>
              <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(MESSAGES_SERVICE["lieu-sans-validation"].texte)}</Text>
            </View>
          </View>
        )}

        {fidelite ? (
          <LigneBlocVisite
            emoji="🎟️"
            titre={fidelite.titre}
            texte={fidelite.texte || undefined}
            libelleLu={fidelite.libelleLu}
            indice="Ouvre tes cartes de fidélité"
            onPress={voirCarte}
            enPlus={
              <View className="self-start">
                <RangeeTampons tampons={fidelite.tampons} sur={fidelite.sur} taille="petite" />
              </View>
            }
          />
        ) : null}

        {infos.reservable ? (
          <LigneBlocVisite
            emoji="📅"
            titre="Réserver une table"
            texte="Gratuit, sans carte bancaire : le lieu te répond dans l'app."
            libelleLu="Réserver une table. Gratuit, sans carte bancaire : le lieu te répond dans l'app."
            indice="Choisis le jour, l'heure et combien vous êtes"
            onPress={reserver}
          />
        ) : null}
      </>
    );
  };

  return (
    <View className="px-5 pt-4">
      <View className="relative">
        {/* Ombre décalée jaune, comme la grande tuile du Scan : c'est ici que la visite compte */}
        <View className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-carte bg-jaune" />
        <View className="gap-4 rounded-carte border-2 border-encre bg-white p-5">
          <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
            Tu passes chez eux ?
          </Text>
          {contenu()}
        </View>
      </View>
    </View>
  );
});
