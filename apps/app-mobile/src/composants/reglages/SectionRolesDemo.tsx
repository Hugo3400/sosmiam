import { Text, View } from "react-native";

import type { LieuGere, RolesCompte, StatutAmbassadeur } from "@sos-miam/commun/types/roles";
import { Bouton } from "~/composants/interface/Bouton";
import { Interrupteur } from "~/composants/interface/Interrupteur";
import { Pastille } from "~/composants/interface/Pastille";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserModes } from "~/hooks/utiliser-modes";

type Props = {
  /** Message à afficher et à faire lire après un changement (« Tu joues l'équipe de Chez Nonna Lia… ») */
  onAnnoncer: (texte: string) => void;
};

/** Le lieu joué par le mode pro de démo : Chez Nonna Lia (ses additions, son QR, ses réservations d'exemple) */
const LIEU_JOUE_ID = 0;

const STATUTS: readonly { statut: StatutAmbassadeur; libelle: string; lu: string }[] = [
  { statut: "actif", libelle: "Actif", lu: "actif : missions, relectures et messages" },
  { statut: "en-attente", libelle: "En attente", lu: "en attente : seul l'Espace s'ouvre" },
  { statut: "suspendu", libelle: "Suspendu", lu: "suspendu : seul l'Espace s'ouvre" },
];

const TEXTE_MINEUR = "Les espaces pro et ambassadeur sont réservés aux 18 ans et plus.";

/**
 * Coulisses de la démo > Tes rôles : « Je joue l'équipe de Chez Nonna Lia » (gérance, ou « en équipe seulement ») et
 * « Je suis ambassadeur » (actif, en attente ou suspendu), puis un raccourci vers le mode ouvert. Ces rôles sont joués :
 * ils n'existent que sur ce téléphone, et le faux serveur les revérifie à chaque geste. Grisé pour les 15-17 ans.
 */
export function SectionRolesDemo({ onAnnoncer }: Props) {
  const { roles, majeur, modesOuverts, changerRolesDemo, entrerEnModePro, entrerEnModeAmbassadeur } = utiliserModes();
  const lieu = lieuxExemples.find((l) => l.id === LIEU_JOUE_ID);
  const nomLieu = lieu?.nom ?? "Chez Nonna Lia";
  const joue = roles.pro.find((l) => l.id === LIEU_JOUE_ID) ?? null;
  const desactive = !majeur || changerRolesDemo === null;

  function changer(nouveaux: RolesCompte, annonce: string) {
    if (!changerRolesDemo || !majeur) return;
    changerRolesDemo(nouveaux).catch(() => {});
    onAnnoncer(annonce);
  }

  function jouerLeLieu(role: LieuGere["role"] | null) {
    const autres = roles.pro.filter((l) => l.id !== LIEU_JOUE_ID);
    const pro = role ? [...autres, { id: LIEU_JOUE_ID, nom: nomLieu, emoji: lieu?.emoji ?? "🍝", role }] : autres;
    const annonce =
      role === null
        ? `Tu ne joues plus l'équipe de ${nomLieu}.`
        : role === "equipe"
          ? "En équipe seulement : le comptoir et les résas, sans les réglages du lieu."
          : joue
            ? `Tu reprends la gérance de ${nomLieu} : tout le mode pro est ouvert.`
            : `🧑‍🍳 Tu joues l'équipe de ${nomLieu} : le mode pro de démo est ouvert.`;
    changer({ ...roles, pro }, annonce);
  }

  function changerAmbassadeur(statut: StatutAmbassadeur | null) {
    const annonce =
      statut === null
        ? "Tu n'es plus ambassadeur dans la démo."
        : `🎖️ Ambassadeur ${STATUTS.find((s) => s.statut === statut)?.lu ?? statut}.`;
    changer({ ...roles, ambassadeur: statut }, annonce);
  }

  return (
    <SectionReglages titre="Tes rôles">
      <Interrupteur
        emoji={lieu?.emoji ?? "🍝"}
        titre={`Je joue l'équipe de ${nomLieu}`}
        detail="Le mode pro : comptoir, QR, résas et réglages du lieu"
        valeur={joue !== null}
        desactive={desactive}
        onChanger={(oui) => jouerLeLieu(oui ? "gerant" : null)}
      />
      {joue ? (
        <View className="pl-10">
          <Interrupteur
            titre="En équipe seulement"
            detail="Comme un serveur : le comptoir et les résas, sans la carte de fidélité ni le kit"
            valeur={joue.role === "equipe"}
            desactive={desactive}
            onChanger={(oui) => jouerLeLieu(oui ? "equipe" : "gerant")}
          />
        </View>
      ) : null}

      <Interrupteur
        emoji="🎖️"
        titre="Je suis ambassadeur"
        detail="L'espace ambassadeur : missions sur place, avis à relire, messages"
        valeur={roles.ambassadeur !== null}
        desactive={desactive}
        onChanger={(oui) => changerAmbassadeur(oui ? "actif" : null)}
      />
      {roles.ambassadeur !== null ? (
        <View className="gap-2 border-b border-ligne py-3 pl-10">
          <Text accessibilityRole="header" className="font-texte-semi text-sm text-gris">
            Statut de la demande
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {STATUTS.map((s, i) => (
              <Pastille
                key={s.statut}
                libelle={s.libelle}
                role="radio"
                position={i + 1}
                total={STATUTS.length}
                choisi={roles.ambassadeur === s.statut}
                indice={`Statut ${s.lu}`}
                onPress={() => {
                  if (!desactive && roles.ambassadeur !== s.statut) changerAmbassadeur(s.statut);
                }}
              />
            ))}
          </View>
        </View>
      ) : null}

      {!majeur ? (
        <View className="mt-3 flex-row gap-3 rounded-carte border-2 border-encre bg-jaune-clair p-4">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-xl">
            🔞
          </Text>
          <Text className="flex-1 font-texte text-sm leading-5 text-encre">{lierPonctuation(TEXTE_MINEUR)}</Text>
        </View>
      ) : null}

      {modesOuverts.includes("pro") || modesOuverts.includes("ambassadeur") ? (
        <View className="mt-4 gap-3">
          <Text className="font-texte text-sm leading-5 text-gris">
            {lierPonctuation("Pour de vrai, l'équipe d'un lieu ne valide pas ses propres visites. Ici, tu joues les deux rôles pour essayer.")}
          </Text>
          {modesOuverts.includes("pro") ? (
            <Bouton libelle={`Ouvrir le mode pro · ${nomLieu}`} variante="blanc" petit indice="Ouvre le comptoir du lieu" onPress={() => entrerEnModePro(LIEU_JOUE_ID)} />
          ) : null}
          {modesOuverts.includes("ambassadeur") ? (
            <Bouton libelle="Ouvrir l'espace ambassadeur" variante="blanc" petit onPress={entrerEnModeAmbassadeur} />
          ) : null}
        </View>
      ) : null}
    </SectionReglages>
  );
}
