import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { memo, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { MESSAGES_SERVICE_PAR_LANGUE } from "@sos-miam/commun/contenus/messages-services";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { calculerPointsVisite } from "@sos-miam/commun/fonctions/visites/calculer-points-visite";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { InfosVisiteLieu } from "@sos-miam/commun/types/visite";
import { LigneBlocVisite } from "~/composants/lieux/LigneBlocVisite";
import { BoutonDemanderAddition } from "~/composants/visites/BoutonDemanderAddition";
import { RangeeTampons } from "~/composants/visites/RangeeTampons";
import { TEXTES_RESERVER_TABLE_PAR_LANGUE } from "~/contenus/textes-reserver-table";
import { TEXTES_VISITE_LIEU_PAR_LANGUE } from "~/contenus/textes-visite-lieu";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { estSosEnCours } from "~/fonctions/lieux/est-sos-en-cours";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserDemandeCompte } from "~/hooks/utiliser-demande-compte";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { utiliserVisites } from "~/hooks/utiliser-visites";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";

type TextesVisite = (typeof TEXTES_VISITE_LIEU_PAR_LANGUE)["fr"];

type Lecture = { etat: "attente" } | { etat: "lu"; infos: InfosVisiteLieu } | { etat: "erreur"; erreur: ErreurService };

// Le lieu n'existe pas pour ce service (y compris un bar ouvert en visite sans compte : la fiche le dit déjà) : le bloc ne montre rien
const ERREURS_SILENCIEUSES: readonly ErreurService[] = ["introuvable"];
// Un raté passager pendant une relecture : on garde ce qu'on avait plutôt que d'effacer le bloc
const ERREURS_PASSAGERES: readonly ErreurService[] = ["hors-ligne", "trop-de-demandes"];

/** « Un tiramisu maison » → « un tiramisu maison », pour le glisser dans une phrase (un sigle en tête reste tel quel) */
function enMinuscule(texte: string): string {
  return /^\p{Lu}\p{Ll}/u.test(texte) ? texte.charAt(0).toLowerCase() + texte.slice(1) : texte;
}

/** Ce que dit la ligne de la carte de fidélité ; null s'il n'y a ni programme ni récompense à prendre ici */
function decrireFidelite(T: TextesVisite, infos: InfosVisiteLieu): { titre: string; texte: string; libelleLu: string; tampons: number; sur: number } | null {
  const { carte, programme } = infos;
  const prete = carte?.pretes[0];
  if (prete) {
    const autres = carte.pretes.length - 1;
    const texte = `${autres > 0 ? T.autresDerriere(autres) : ""}${T.montrerCode}`;
    return { titre: T.recompensePrete(prete.libelle), texte, libelleLu: T.recompensePreteLu(prete.libelle, texte), tampons: carte.tampons, sur: carte.sur };
  }
  if (!programme) return null;
  const sur = carte?.sur ?? programme.visitesRequises;
  const tampons = Math.min(carte?.tampons ?? 0, sur);
  const restantes = sur - tampons;
  const recompense = enMinuscule(carte?.recompense ?? programme.recompense);
  return { titre: T.progression(tampons, sur, restantes, recompense), texte: "", libelleLu: T.progressionLu(tampons, sur, restantes, recompense), tampons, sur };
}

/** Ce que rapporte une visite ici : les points (+25 pendant un SOS en cours), le tampon s'il y a une carte, l'avis vérifié */
function decrireGains(T: TextesVisite, lieu: Lieu, infos: InfosVisiteLieu): string {
  const points = calculerPointsVisite(false);
  const tampon = infos.programme ? T.unTampon : "";
  if (estSosEnCours(lieu)) return T.gainsSos(calculerPointsVisite(true), points, tampon);
  return T.gains(points, tampon);
}

/**
 * Bloc « Tu passes chez eux ? » de la fiche d'un lieu, entre le haut de la fiche et sa suite : demander l'addition (ou scanner
 * le QR du comptoir) pour que la visite compte, ta demande en cours ici, ta carte de fidélité et « Réserver ».
 * La rescousse reste à part, dans la barre du bas : aider un lieu et y passer sont deux gestes différents.
 * Relu à chaque changement de tes visites (une demande réglée, un tampon posé). Mémorisé : une rescousse ne le redessine pas.
 */
export const BlocVisiteLieu = memo(function BlocVisiteLieu({ lieu }: { lieu: Lieu }) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_VISITE_LIEU_PAR_LANGUE);
  const reserverTable = utiliserTextes(TEXTES_RESERVER_TABLE_PAR_LANGUE);
  const messagesService = utiliserTextes(MESSAGES_SERVICE_PAR_LANGUE);
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
  const titreReserver = lieu.type === "sortie" ? reserverTable.titreSortie : reserverTable.titre;
  const reserver = () => {
    if (demanderCompte("reserver")) router.push({ pathname: "/lieu/[id]/reserver", params: { id: String(lieu.id) } });
  };
  // Ta carte de ce lieu si tu en as une, sinon toutes tes cartes
  const voirCarte = () => {
    if (!demanderCompte("fidelite")) return;
    if (lecture.etat === "lu" && lecture.infos.carte) router.push({ pathname: "/fidelite/[lieuId]", params: { lieuId: String(lieu.id) } });
    else router.push("/fidelite");
  };

  const contenu = () => {
    if (lecture.etat === "erreur") {
      if (lecture.erreur === "service-indisponible") {
        return (
          <View accessible className="flex-row items-center gap-3">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-2xl">
              🛠️
            </Text>
            <Text className="flex-1 font-texte text-[15px] leading-[22px] text-gris">{lierPonctuation(T.bientot)}</Text>
          </View>
        );
      }
      const message = messagesService[lecture.erreur];
      return (
        <View className="gap-2">
          <Text className="font-texte-gras text-[15px] text-encre">{lierPonctuation(remplirModele(message.titre, { lieu: lieu.nom }))}</Text>
          <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(remplirModele(message.texte, { lieu: lieu.nom }))}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityHint={T.reessayerIndice}
            onPress={() => {
              vibrerLegerement();
              setEssai((n) => n + 1);
            }}
            className="min-h-11 justify-center self-start active:opacity-60"
          >
            <Text className="font-texte-gras text-[15px] text-encre underline">{T.reessayer}</Text>
          </Pressable>
        </View>
      );
    }

    const { infos } = lecture;
    const { enCoursIci } = infos;
    const fidelite = decrireFidelite(T, infos);
    return (
      <>
        {enCoursIci ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={T.demandeEnCoursLu}
            accessibilityHint={T.demandeEnCoursIndice}
            onPress={() => {
              vibrerLegerement();
              router.push({ pathname: "/visite/[id]", params: { id: String(enCoursIci.id) } });
            }}
            className="gap-1 rounded-2xl border-2 border-encre bg-jaune-clair px-4 py-3 active:opacity-80"
          >
            <View className="flex-row items-center gap-2">
              <View className="h-2.5 w-2.5 rounded-full bg-tomate" />
              <Text className="flex-1 font-texte-gras text-[15px] text-encre">{T.demandeEnCours}</Text>
              <Ionicons name="chevron-forward" size={18} color={couleurs.encre} />
            </View>
            <Text className="pl-[18px] font-texte text-sm leading-5 text-gris">
              {lierPonctuation(T.montrerTonCode)}
              <Text className="font-texte-gras text-encre underline">{T.voirCode}</Text>
            </Text>
          </Pressable>
        ) : infos.validationActive ? (
          <View className="gap-3">
            <Text className="font-texte text-[15px] leading-[22px] text-gris">{lierPonctuation(decrireGains(T, lieu, infos))}</Text>
            <BoutonDemanderAddition lieu={lieu} />
            <Pressable
              accessibilityRole="button"
              accessibilityHint={T.scannerIndice}
              onPress={() => {
                vibrerLegerement();
                scanner();
              }}
              className="min-h-11 justify-center px-2 active:opacity-60"
            >
              <Text className="text-center font-texte-semi text-[15px] leading-[22px] text-encre underline">{T.scanner}</Text>
            </Pressable>
          </View>
        ) : (
          <View accessible className="flex-row gap-3">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-2xl">
              {messagesService["lieu-sans-validation"].emoji}
            </Text>
            <View className="flex-1 gap-1">
              <Text className="font-texte-gras text-[15px] leading-5 text-encre">{lierPonctuation(remplirModele(messagesService["lieu-sans-validation"].titre, { lieu: lieu.nom }))}</Text>
              <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(messagesService["lieu-sans-validation"].texte)}</Text>
            </View>
          </View>
        )}

        {fidelite ? (
          <LigneBlocVisite
            emoji="🎟️"
            titre={fidelite.titre}
            texte={fidelite.texte || undefined}
            libelleLu={fidelite.libelleLu}
            indice={T.fideliteIndice}
            onPress={voirCarte}
            enPlus={
              <View className="self-start">
                <RangeeTampons tampons={fidelite.tampons} sur={fidelite.sur} taille="petite" />
              </View>
            }
          />
        ) : null}
        {/* Une récompense prête garde l'alcool de son gain ; sinon, celle de la carte ou du programme */}
        {fidelite && (infos.carte?.pretes[0] ? infos.carte.pretes[0].alcool === true : infos.carte?.recompenseAlcool || infos.programme?.recompenseAlcool) ? <MentionPrevention /> : null}

        {infos.reservable ? (
          <LigneBlocVisite
            emoji="📅"
            titre={titreReserver}
            texte={T.reserverTexte}
            libelleLu={T.reserverLu(titreReserver)}
            indice={T.reserverIndice}
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
        <View className="gap-4 rounded-carte border-2 border-encre bg-carte p-5">
          <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
            {T.titre}
          </Text>
          {contenu()}
        </View>
      </View>
    </View>
  );
});
