import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { LigneDemandeSuivi, type IssueDemande } from "~/composants/notifications/LigneDemandeSuivi";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserCompteRequis } from "~/hooks/utiliser-compte-requis";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";

type Props = {
  onAnnoncer: (texte: string) => void;
  /** Vrai quand la section montre au moins une ligne : l'écran n'affiche pas « Calme plat par ici » juste dessous (fonction stable, setState par exemple) */
  onAffichee?: (affichee: boolean) => void;
};

/** Une ligne de la section : une demande en attente, ou acceptée ou refusée pendant la visite de l'écran (elle reste jusqu'à la prochaine) */
type Ligne = { id: string; issue: IssueDemande };

/**
 * Les lignes à jour : les demandes traitées restent à leur place (une refusée revient en attente si la personne redemande),
 * celles qui ne sont plus en attente partent, les nouvelles arrivent en tête
 */
const mettreAJour = (lignes: Ligne[], enAttente: readonly string[]): Ligne[] => {
  const gardees = lignes
    .filter((l) => l.issue !== "attente" || enAttente.includes(l.id))
    .map((l): Ligne => (l.issue === "refusee" && enAttente.includes(l.id) ? { ...l, issue: "attente" } : l));
  const nouvelles = enAttente.filter((id) => !gardees.some((l) => l.id === id)).map((id): Ligne => ({ id, issue: "attente" }));
  const resultat = [...nouvelles, ...gardees];
  const inchange = resultat.length === lignes.length && resultat.every((l, i) => l.id === lignes[i].id && l.issue === lignes[i].issue);
  return inchange ? lignes : resultat;
};

/**
 * « Demandes d'abonnement (N) » en haut de l'écran Notifications : suit les demandes reçues en direct. Accepter laisse la
 * ligne (« … te suit maintenant », avec « Suivre ») ; refuser aussi, en silence (« Demande refusée »), pour que VoiceOver
 * ne perde pas sa place : il se pose sur la réponse. Ne rend rien sans demande ni ligne traitée pendant la visite.
 */
export function SectionDemandesSuivi({ onAnnoncer, onAffichee }: Props) {
  const suivis = utiliserSuivisPersonnes();
  const { trouverPote, bloques } = utiliserCommunaute();
  const exiger = utiliserCompteRequis();
  const enAttente = suivis.demandesRecues.map((d) => d.pote.id);
  const cleEnAttente = enAttente.join(",");
  const [lignes, setLignes] = useState<Ligne[]>(() => enAttente.map((id) => ({ id, issue: "attente" })));

  // Comparé par contenu (pas par identité du tableau) : rien ne bouge sous le doigt sans raison
  useEffect(() => {
    setLignes((actuelles) => mettreAJour(actuelles, cleEnAttente === "" ? [] : cleEnAttente.split(",")));
  }, [cleEnAttente]);

  function accepter(id: string) {
    if (!exiger("suivre")) return;
    if (suivis.accepterDemande(id)) setLignes((actuelles) => actuelles.map((l): Ligne => (l.id === id ? { ...l, issue: "acceptee" } : l)));
    else onAnnoncer("Cette demande n'est plus valable.");
  }

  // La ligne reste et dit « Demande refusée » (LigneDemandeSuivi y pose VoiceOver) : rien n'est envoyé à l'autre
  function refuser(id: string) {
    if (!exiger("suivre")) return;
    suivis.refuserDemande(id);
    setLignes((actuelles) => actuelles.map((l): Ligne => (l.id === id ? { ...l, issue: "refusee" } : l)));
  }

  // Une personne bloquée entre-temps disparaît aussi des lignes acceptées
  const affichees = lignes.flatMap((l) => {
    const pote = trouverPote(l.id);
    return pote && !bloques.some((b) => b.id === l.id) ? [{ ...l, pote }] : [];
  });
  const visible = affichees.length > 0;
  useEffect(() => {
    onAffichee?.(visible);
  }, [visible, onAffichee]);
  if (!visible) return null;

  return (
    <View className="gap-3">
      <Text
        accessibilityRole="header"
        accessibilityLabel={`Demandes d'abonnement, ${enAttente.length > 0 ? `${enAttente.length} en attente` : "toutes traitées"}`}
        className="font-titre-gras text-xl text-encre"
      >
        📨 Demandes d'abonnement{enAttente.length > 0 ? ` (${enAttente.length})` : ""}
      </Text>
      <View className="overflow-hidden rounded-carte border-2 border-encre bg-white">
        {affichees.map((ligne, i) => (
          <LigneDemandeSuivi
            key={ligne.id}
            pote={ligne.pote}
            issue={ligne.issue}
            derniere={i === affichees.length - 1}
            onAccepter={() => accepter(ligne.id)}
            onRefuser={() => refuser(ligne.id)}
            onAnnoncer={onAnnoncer}
          />
        ))}
      </View>
    </View>
  );
}
