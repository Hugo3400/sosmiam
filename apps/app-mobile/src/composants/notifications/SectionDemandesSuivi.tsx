import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { LigneDemandeSuivi } from "~/composants/notifications/LigneDemandeSuivi";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserCompteRequis } from "~/hooks/utiliser-compte-requis";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";

type Props = {
  onAnnoncer: (texte: string) => void;
};

/** Une ligne de la section : une demande en attente, ou acceptée pendant la visite de l'écran (elle reste jusqu'à la prochaine) */
type Ligne = { id: string; acceptee: boolean };

/** Les lignes à jour : les demandes acceptées restent à leur place, celles qui ne sont plus en attente partent, les nouvelles arrivent en tête */
const mettreAJour = (lignes: Ligne[], enAttente: readonly string[]): Ligne[] => {
  const gardees = lignes.filter((l) => l.acceptee || enAttente.includes(l.id));
  const nouvelles = enAttente.filter((id) => !gardees.some((l) => l.id === id)).map((id) => ({ id, acceptee: false }));
  const resultat = [...nouvelles, ...gardees];
  const inchange = resultat.length === lignes.length && resultat.every((l, i) => l.id === lignes[i].id && l.acceptee === lignes[i].acceptee);
  return inchange ? lignes : resultat;
};

/**
 * « Demandes d'abonnement (N) » en haut de l'écran Notifications : suit les demandes reçues en direct. Accepter laisse la
 * ligne (« … te suit maintenant », avec « Suivre ») ; refuser la retire en silence. Ne rend rien sans demande ni ligne acceptée.
 */
export function SectionDemandesSuivi({ onAnnoncer }: Props) {
  const suivis = utiliserSuivisPersonnes();
  const { trouverPote, bloques } = utiliserCommunaute();
  const exiger = utiliserCompteRequis();
  const enAttente = suivis.demandesRecues.map((d) => d.pote.id);
  const cleEnAttente = enAttente.join(",");
  const [lignes, setLignes] = useState<Ligne[]>(() => enAttente.map((id) => ({ id, acceptee: false })));

  // Comparé par contenu (pas par identité du tableau) : rien ne bouge sous le doigt sans raison
  useEffect(() => {
    setLignes((actuelles) => mettreAJour(actuelles, cleEnAttente === "" ? [] : cleEnAttente.split(",")));
  }, [cleEnAttente]);

  function accepter(id: string) {
    if (!exiger("suivre")) return;
    if (suivis.accepterDemande(id)) setLignes((actuelles) => actuelles.map((l) => (l.id === id ? { ...l, acceptee: true } : l)));
    else onAnnoncer("Cette demande n'est plus valable.");
  }

  function refuser(id: string) {
    if (!exiger("suivre")) return;
    suivis.refuserDemande(id);
    setLignes((actuelles) => actuelles.filter((l) => l.id !== id));
    onAnnoncer("Demande refusée, en toute discrétion 🤫");
  }

  // Une personne bloquée entre-temps disparaît aussi des lignes acceptées
  const affichees = lignes.flatMap((l) => {
    const pote = trouverPote(l.id);
    return pote && !bloques.some((b) => b.id === l.id) ? [{ ...l, pote }] : [];
  });
  if (affichees.length === 0) return null;

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
            acceptee={ligne.acceptee}
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
