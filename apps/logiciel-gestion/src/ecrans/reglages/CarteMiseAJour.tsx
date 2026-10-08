import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { chercherMiseAJour, lireVersion } from "~/services/mises-a-jour.ts";

/** Version installée, et recherche d'une mise à jour à la main. */
export function CarteMiseAJour() {
  const [version, setVersion] = useState<string | null>(null);
  const [etat, setEtat] = useState<{ enCours: boolean; message: string | null }>({ enCours: false, message: null });
  useEffect(() => {
    void lireVersion().then(setVersion);
  }, []);

  async function chercher() {
    setEtat({ enCours: true, message: null });
    try {
      const miseAJour = await chercherMiseAJour();
      if (!miseAJour) return setEtat({ enCours: false, message: version ? "Tu as la dernière version 👌" : "Pas de mise à jour hors du logiciel installé." });
      setEtat({ enCours: true, message: `Version ${miseAJour.version} trouvée : téléchargement…` });
      await miseAJour.installer((pourcentage) => setEtat({ enCours: true, message: `Version ${miseAJour.version} : ${pourcentage} %…` }));
    } catch {
      setEtat({ enCours: false, message: "Impossible de vérifier pour l'instant (serveur injoignable ?)." });
    }
  }

  return (
    <Carte titre="Version et mises à jour">
      <p className="text-sm">
        Version installée : <strong>{version ?? "développement"}</strong>. Le logiciel cherche une nouvelle version à chaque connexion ;
        les mises à jour sont signées, et ne sont servies qu'à un poste connecté.
      </p>
      <Bouton petit icone={RefreshCw} chargement={etat.enCours} onClick={chercher} className="mt-4">Chercher une mise à jour</Bouton>
      {etat.message && <p role="status" className="mt-3 text-sm font-semibold">{etat.message}</p>}
    </Carte>
  );
}
