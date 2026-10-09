import { useCallback, useEffect, useRef, useState } from "react";

import { lireAlertes, type Alertes } from "~/services/alertes.ts";
import { notifier } from "~/services/systeme.ts";

/** BIG SOS déjà annoncés (« démarre demain ») : gardés sur ce PC pour ne pas le redire à chaque ouverture */
const CLE_BIG_SOS = "sosmiam-gestion:big-sos-annonces";
const lireAnnonces = (): number[] => {
  try {
    return JSON.parse(localStorage.getItem(CLE_BIG_SOS) ?? "[]") as number[];
  } catch {
    return [];
  }
};
const garderAnnonces = (ids: number[]) => {
  try {
    localStorage.setItem(CLE_BIG_SOS, JSON.stringify(ids.slice(-50)));
  } catch {
    // Pas grave : au pire, l'annonce sera refaite
  }
};

/** Ce qui déclenche une notification Windows quand le nombre monte d'une minute à l'autre */
const NOUVEAUTES: { lire: (a: Alertes) => number; titre: string; texte: string }[] = [
  { lire: (a) => a.moderation.urgents, titre: "🚨 Publication masquée pour tous", texte: "Un signalement grave attend ta décision dans la modération." },
  { lire: (a) => a.moderation.contestes, titre: "⚖️ Décision contestée", texte: "Une décision de modération est à réexaminer (onglet « Contestés »)." },
  { lire: (a) => a.demandes.aTraiter, titre: "📬 Nouvelle demande de lieu", texte: "Un lieu veut rejoindre SOS Miam, ou une pépite a été proposée." },
  { lire: (a) => a.ambassadeurs.enAttente, titre: "🙋 Nouvel ambassadeur", texte: "Une inscription à l'espace ambassadeur attend ta validation." },
  { lire: (a) => a.ambassadeurs.candidatures, titre: "🏅 Nouvelle candidature fondateur", texte: "Une candidature fondateur vient d'arriver." },
  { lire: (a) => a.ambassadeurs.certifications ?? 0, titre: "✅ Nouvelle candidature « certifié »", texte: "Quelqu'un veut devenir ambassadeur certifié : Ambassadeurs → Certifiés." },
  { lire: (a) => a.lieux?.suggestions ?? 0, titre: "✏️ Modification de fiche proposée", texte: "Un client ou un lieu propose de modifier une fiche : ouvre Lieux pour voir l'avant et l'après." },
  { lire: (a) => a.missionsFaites, titre: "🎯 Mission faite", texte: "Un ambassadeur a envoyé son compte rendu : va le lire dans Ambassadeurs → Missions." },
  { lire: (a) => a.bigSos.aTraiter, titre: "🛟 BIG SOS à étudier", texte: "Un BIG SOS attend ton attention." },
];

/**
 * Surveille chaque minute ce qui attend Hugo (décision du 8 octobre 2026 : l'alerte arrive dans le logiciel) : rend les
 * compteurs des pastilles du menu, et prévient par une notification Windows de chaque nouveauté et des BIG SOS qui
 * démarrent dans les 24 heures.
 */
export function utiliserAlertes(actif: boolean) {
  const [alertes, setAlertes] = useState<Alertes | null>(null);
  const precedentes = useRef<Alertes | null>(null);
  const verifierMaintenant = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (!actif) return;
    let annule = false;
    const verifier = async () => {
      try {
        const nouvelles = await lireAlertes();
        if (annule) return;
        const avant = precedentes.current;
        if (avant) {
          for (const nouveaute of NOUVEAUTES) if (nouveaute.lire(nouvelles) > nouveaute.lire(avant)) void notifier(nouveaute.titre, nouveaute.texte);
        }
        const annonces = lireAnnonces();
        for (const bigSos of nouvelles.bigSos.demarrentBientot.filter((b) => !annonces.includes(b.id))) {
          void notifier("🛟 BIG SOS demain", `${bigSos.lieu} passe à la une dans moins de 24 heures. Tout est prêt (objectif, vidéos) ?`);
          annonces.push(bigSos.id);
        }
        garderAnnonces(annonces);
        precedentes.current = nouvelles;
        setAlertes(nouvelles);
      } catch {
        // Session perdue ou serveur injoignable : on réessaie à la prochaine minute
      }
    };
    verifierMaintenant.current = verifier;
    void verifier();
    const minuteur = setInterval(verifier, 60_000);
    return () => {
      annule = true;
      verifierMaintenant.current = null;
      clearInterval(minuteur);
    };
  }, [actif]);

  /** Relit tout de suite (après une décision prise dans un écran) */
  const actualiser = useCallback(() => void verifierMaintenant.current?.(), []);
  return { alertes, actualiser };
}
