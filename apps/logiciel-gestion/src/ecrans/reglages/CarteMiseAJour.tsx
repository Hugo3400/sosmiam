import { Gift, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { chercherMiseAJour, lireVersion, type MiseAJour } from "~/services/mises-a-jour.ts";

/** Version installée, et recherche d'une mise à jour à la main : on cherche, on montre, et on installe seulement si Hugo le veut. */
export function CarteMiseAJour() {
  const [version, setVersion] = useState<string | null>(null);
  const [trouvee, setTrouvee] = useState<MiseAJour | null>(null);
  const [etat, setEtat] = useState<{ enCours: "chercher" | "installer" | null; message: string | null }>({ enCours: null, message: null });
  useEffect(() => {
    void lireVersion().then(setVersion);
  }, []);

  async function chercher() {
    setEtat({ enCours: "chercher", message: null });
    setTrouvee(null);
    try {
      const miseAJour = await chercherMiseAJour();
      setTrouvee(miseAJour);
      setEtat({ enCours: null, message: miseAJour ? null : version ? "Tu as la dernière version 👌" : "Pas de mise à jour hors du logiciel installé." });
    } catch {
      setEtat({ enCours: null, message: "Impossible de vérifier pour l'instant (serveur injoignable ?)." });
    }
  }

  async function installer() {
    if (!trouvee) return;
    setEtat({ enCours: "installer", message: "Téléchargement…" });
    try {
      await trouvee.installer((pourcentage) => setEtat({ enCours: "installer", message: `Téléchargement : ${pourcentage} %…` }));
    } catch {
      setEtat({ enCours: null, message: "Installation ratée, réessaie plus tard." });
    }
  }

  return (
    <Carte titre="Version et mises à jour">
      <p className="text-sm">
        Version installée : <strong>{version ?? "développement"}</strong>. Le logiciel cherche une nouvelle version à chaque connexion et te
        prévient (notification et bandeau jaune) ; il ne l'installe que si tu le demandes.
      </p>
      <Bouton petit icone={RefreshCw} chargement={etat.enCours === "chercher"} desactive={etat.enCours === "installer"} onClick={chercher} className="mt-4">
        Chercher une mise à jour
      </Bouton>
      {trouvee && (
        <div className="mt-4 grid gap-2 rounded-xl border-2 border-encre bg-jaune-clair p-4 text-sm">
          <p className="flex items-center gap-2 font-bold"><Gift className="size-4" aria-hidden /> Version {trouvee.version} disponible</p>
          {trouvee.notes && <p className="whitespace-pre-line">{trouvee.notes}</p>}
          <p className="text-gris">Le logiciel se ferme quelques secondes pendant l'installation, puis se rouvre à jour. Rien n'est perdu.</p>
          <Bouton variante="principal" chargement={etat.enCours === "installer"} onClick={installer} className="justify-self-start">
            Installer et redémarrer
          </Bouton>
        </div>
      )}
      {etat.message && <p role="status" className="mt-3 text-sm font-semibold">{etat.message}</p>}
    </Carte>
  );
}
