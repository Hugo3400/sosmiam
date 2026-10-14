import { Archive, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { formaterOctets } from "~/fonctions/texte/formater-octets.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { lireFichierPresse, listerPresse } from "~/services/presse.ts";
import { enregistrerFichierBinaire } from "~/services/systeme.ts";
import { CarteFichierPresse } from "./CarteFichierPresse.tsx";

/**
 * L'Espace presse (demandé par Hugo le 14 octobre 2026) : tous les kits et visuels de SOS Miam, rangés par famille
 * (affiches, réseaux, imprimés, Miam Safe, textes, kits médias du site), à enregistrer un par un ou en un zip.
 */
export function EcranPresse() {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(listerPresse, []);
  const [famille, setFamille] = useState("");
  const [grande, setGrande] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (donnees && !donnees.familles.some((f) => f.id === famille)) setFamille(donnees.familles[0]?.id ?? "");
  }, [donnees, famille]);
  const actuelle = donnees?.familles.find((f) => f.id === famille);

  async function enregistrer(id: string, nom: string) {
    setMessage(`Téléchargement de ${nom}…`);
    try {
      const fait = await enregistrerFichierBinaire(nom, await lireFichierPresse(id));
      setMessage(fait ? `${nom} enregistré ✅` : null);
    } catch {
      setMessage(`${nom} n'a pas pu être téléchargé : réessaie dans un instant.`);
    }
  }

  return (
    <>
      <EnTeteEcran
        titre="Espace presse"
        sousTitre={`Tous les kits et visuels de SOS Miam, prêts à envoyer à un journaliste, un lieu ou un imprimeur.${donnees?.genere ? ` Créations exportées le ${formaterDate(`${donnees.genere}T12:00:00Z`)}.` : ""}`}
        actions={<Bouton icone={RotateCw} chargement={chargement && !!donnees} onClick={recharger}>Actualiser</Bouton>}
      />
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {donnees && donnees.familles.length === 0 && <Carte><EtatVide emoji="📰" titre="Rien à télécharger pour l'instant">Le dossier presse/ et les kits du site sont vides sur le serveur.</EtatVide></Carte>}
      {donnees && donnees.familles.length > 0 && (
        <>
          <div className="mb-4">
            <Onglets libelle="Famille" valeur={famille} onChange={setFamille} options={donnees.familles.map((f) => ({ valeur: f.id, libelle: f.titre.split(" (")[0]!, compteur: f.fichiers.length }))} />
          </div>
          {actuelle && (
            <Carte
              titre={actuelle.titre}
              actions={actuelle.zip && (
                <Bouton variante="principal" icone={Archive} onClick={() => enregistrer(actuelle.zip!.id, actuelle.zip!.nom)}>
                  Tout télécharger ({formaterOctets(actuelle.zip.octets)})
                </Bouton>
              )}
            >
              {message && <p role="status" className="mb-3 text-sm font-semibold">{message}</p>}
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                {actuelle.fichiers.map((fichier) => <CarteFichierPresse key={fichier.id} fichier={fichier} onEnregistrer={enregistrer} onAgrandir={setGrande} />)}
              </ul>
            </Carte>
          )}
        </>
      )}
      {grande && (
        <button type="button" onClick={() => setGrande(null)} className="fixed inset-0 z-50 grid place-items-center bg-nuit/80 p-8" aria-label="Fermer l'aperçu">
          <img src={grande} alt="" className="max-h-full max-w-full rounded-xl" />
        </button>
      )}
    </>
  );
}
