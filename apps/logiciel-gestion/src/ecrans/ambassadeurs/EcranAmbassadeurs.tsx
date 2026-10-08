import { Download } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { exporterAmbassadeurs } from "~/services/ambassadeurs.ts";
import { enregistrerFichier } from "~/services/systeme.ts";
import { CarteClassement } from "./CarteClassement.tsx";
import { CarteCouverture } from "./CarteCouverture.tsx";
import { FicheAmbassadeur } from "./FicheAmbassadeur.tsx";
import { ListeCandidats } from "./ListeCandidats.tsx";
import { ListeCandidatures } from "./ListeCandidatures.tsx";
import { ListeComptes } from "./ListeComptes.tsx";
import { ListeMessages } from "./ListeMessages.tsx";
import { ListeMissions } from "./ListeMissions.tsx";

type Partie = "comptes" | "fondateurs" | "missions" | "messages" | "classement" | "villes" | "candidats";
const PARTIES: { valeur: Partie; libelle: string }[] = [
  { valeur: "comptes", libelle: "Comptes" },
  { valeur: "fondateurs", libelle: "Fondateurs" },
  { valeur: "missions", libelle: "Missions" },
  { valeur: "messages", libelle: "Messages" },
  { valeur: "classement", libelle: "Classement" },
  { valeur: "villes", libelle: "Villes" },
  { valeur: "candidats", libelle: "À inviter" },
];

/** Les ambassadeurs : leurs comptes (espace ambassadeur.sosmiam.fr), fondateurs, missions, messages, classement et villes. */
export function EcranAmbassadeurs({ onDecision }: { onDecision: () => void }) {
  const [partie, setPartie] = useState<Partie>("comptes");
  const [fiche, setFiche] = useState<number | null>(null);
  // Change à chaque modification depuis une fiche : la partie affichée se recharge
  const [tour, setTour] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const ouvrir = (compteId: number) => setFiche(compteId);
  const signalerChangement = () => {
    setTour((t) => t + 1);
    onDecision();
  };

  async function exporter() {
    const csv = await exporterAmbassadeurs();
    if (await enregistrerFichier(`ambassadeurs-sos-miam-${new Date().toISOString().slice(0, 10)}.csv`, csv)) setMessage("Ambassadeurs exportés ✅");
  }

  return (
    <>
      <EnTeteEcran
        titre="Ambassadeurs"
        sousTitre="Les passionnés qui font découvrir les pépites de leur ville. Chaque inscription à l'espace ambassadeur est validée ici."
        actions={<Bouton icone={Download} onClick={() => void exporter().catch(() => setMessage("Export impossible : réessaie dans un instant."))}>Exporter en CSV</Bouton>}
      />
      <div className="mb-5"><Onglets libelle="Partie" valeur={partie} onChange={setPartie} options={PARTIES} /></div>
      {message && <p role="status" className="mb-4 rounded-xl bg-vert-clair px-4 py-2 text-sm font-semibold text-vert">{message}</p>}
      {partie === "comptes" && <ListeComptes onOuvrirCompte={ouvrir} tour={tour} onDecision={onDecision} />}
      {partie === "fondateurs" && <ListeCandidatures onOuvrirCompte={ouvrir} tour={tour} onDecision={onDecision} />}
      {partie === "missions" && <ListeMissions onOuvrirCompte={ouvrir} tour={tour} />}
      {partie === "messages" && <ListeMessages onOuvrirCompte={ouvrir} tour={tour} />}
      {partie === "classement" && <CarteClassement onOuvrirCompte={ouvrir} tour={tour} />}
      {partie === "villes" && <CarteCouverture tour={tour} />}
      {partie === "candidats" && <ListeCandidats />}
      {fiche !== null && <FicheAmbassadeur id={fiche} onFermer={() => setFiche(null)} onChange={signalerChangement} />}
    </>
  );
}
