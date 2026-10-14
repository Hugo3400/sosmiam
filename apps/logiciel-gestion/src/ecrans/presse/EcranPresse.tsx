import { Archive, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { ChoixEnPastilles } from "~/composants/interface/ChoixEnPastilles.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { formaterOctets } from "~/fonctions/texte/formater-octets.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { CANAUX_PRESSE, creerLienPresse, lireFichierPresse, listerPresse, OCTETS_MAX_LOGICIEL, type CanalPresse } from "~/services/presse.ts";
import { enregistrerFichierBinaire, ouvrirLien } from "~/services/systeme.ts";
import { CarteFichierPresse } from "./CarteFichierPresse.tsx";

/**
 * L'Espace presse (demandé par Hugo le 14 octobre 2026) : tous les kits et visuels de SOS Miam, rangés par famille
 * (affiches, réseaux, imprimés, Miam Safe, textes, kits médias du site), à enregistrer un par un ou en un zip.
 */
export function EcranPresse() {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(listerPresse, []);
  const [famille, setFamille] = useState("");
  const [canal, setCanal] = useState<CanalPresse | "">("");
  const [grande, setGrande] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (donnees && !donnees.familles.some((f) => f.id === famille)) setFamille(donnees.familles[0]?.id ?? "");
  }, [donnees, famille]);
  const actuelle = donnees?.familles.find((f) => f.id === famille);
  // Un canal choisi : ses fichiers dans toutes les familles, la famille rappelée en tête de description
  const parCanal = canal && donnees
    ? donnees.familles.flatMap((f) => f.fichiers.filter((x) => x.canaux?.includes(canal)).map((x) => ({ ...x, description: [f.titre.split(" (")[0], x.description].filter(Boolean).join(" · ") })))
    : [];
  const compterCanal = (c: CanalPresse) => donnees?.familles.reduce((total, f) => total + f.fichiers.filter((x) => x.canaux?.includes(c)).length, 0) ?? 0;

  async function enregistrer(id: string, nom: string, octets: number) {
    setMessage(`Téléchargement de ${nom}…`);
    try {
      if (octets > OCTETS_MAX_LOGICIEL) {
        // Trop lourd pour passer par le logiciel : le navigateur le télécharge avec un lien de 10 minutes
        await ouvrirLien((await creerLienPresse(id)).lien);
        setMessage(`${nom} se télécharge dans ton navigateur (lien valable 10 minutes).`);
        return;
      }
      const fait = await enregistrerFichierBinaire(nom, await lireFichierPresse(id));
      setMessage(fait ? `${nom} enregistré ✅` : null);
    } catch (probleme) {
      setMessage(String(probleme).includes("format refusé")
        ? `${nom} : ce format ne peut pas être enregistré depuis le logiciel.`
        : `${nom} n'a pas pu être téléchargé : réessaie dans un instant.`);
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
          <div className="mb-5 grid gap-3">
            <div className="grid gap-1.5">
              <p className="text-xs font-bold tracking-wider text-gris uppercase">Pour</p>
              <ChoixEnPastilles libelle="Canal" valeur={canal} onChange={setCanal}
                options={[{ valeur: "" as const, libelle: "Par famille" }, ...(Object.keys(CANAUX_PRESSE) as CanalPresse[]).map((c) => ({ valeur: c, libelle: CANAUX_PRESSE[c], compteur: compterCanal(c) }))]} />
            </div>
            {!canal && (["presse", "site"] as const).map((source) => {
              const familles = donnees.familles.filter((f) => f.source === source);
              return familles.length > 0 && (
                <div key={source} className="grid gap-1.5">
                  <p className="text-xs font-bold tracking-wider text-gris uppercase">{source === "presse" ? "Créations" : "Kits du site"}</p>
                  <ChoixEnPastilles libelle={source === "presse" ? "Créations" : "Kits du site"} valeur={famille} onChange={setFamille}
                    options={familles.map((f) => ({ valeur: f.id, libelle: f.titre.split(" (")[0]!, compteur: f.fichiers.length }))} />
                </div>
              );
            })}
          </div>
          {canal && (
            <Carte titre={`${CANAUX_PRESSE[canal]} (${parCanal.length})`}>
              {message && <p role="status" className="mb-3 text-sm font-semibold">{message}</p>}
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                {parCanal.map((fichier) => <CarteFichierPresse key={fichier.id} fichier={fichier} onEnregistrer={enregistrer} onAgrandir={setGrande} />)}
              </ul>
            </Carte>
          )}
          {!canal && actuelle && (
            <Carte
              titre={actuelle.titre}
              actions={actuelle.zip && (
                <Bouton variante="principal" icone={Archive} onClick={() => enregistrer(actuelle.zip!.id, actuelle.zip!.nom, actuelle.zip!.octets)}>
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
