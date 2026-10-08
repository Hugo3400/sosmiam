import { Plus } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerPublications } from "~/services/publications.ts";
import { FormulairePublication } from "./FormulairePublication.tsx";
import { decrireStatutPublication } from "~/fonctions/publications/decrire-statut-publication.ts";
import { VignetteMedia } from "./VignetteMedia.tsx";

type Filtre = "" | "publiee" | "programmee" | "brouillon" | "masquee";
const FILTRES: { valeur: Filtre; libelle: string }[] = [
  { valeur: "", libelle: "Toutes" },
  { valeur: "publiee", libelle: "En ligne" },
  { valeur: "programmee", libelle: "Programmées" },
  { valeur: "brouillon", libelle: "Brouillons" },
  { valeur: "masquee", libelle: "Masquées" },
];

/** Le fil « Pour toi » : les publications des lieux et des créateurs, à créer, programmer, masquer. */
export function EcranPublications() {
  const [filtre, setFiltre] = useState<Filtre>("");
  const [ouverte, setOuverte] = useState<number | "nouvelle" | null>(null);
  const { donnees, erreur, chargement, recharger } = utiliserChargement(() => listerPublications(filtre), [filtre]);

  if (ouverte !== null) {
    return <FormulairePublication id={ouverte === "nouvelle" ? null : ouverte} onFermer={() => { setOuverte(null); recharger(); }} />;
  }
  return (
    <>
      <EnTeteEcran
        titre="Publications"
        sousTitre="Les vidéos et photos du fil « Pour toi ». Une collaboration payée ou offerte affiche toujours « Collaboration commerciale »."
        actions={<Bouton variante="principal" icone={Plus} onClick={() => setOuverte("nouvelle")}>Nouvelle publication</Bouton>}
      />
      <div className="mb-5"><Onglets libelle="Statut" valeur={filtre} onChange={setFiltre} options={FILTRES} /></div>
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {donnees && donnees.length === 0 && (
        <Carte>
          <EtatVide emoji="🎬" titre="Rien dans le fil pour l'instant" action={<Bouton variante="principal" icone={Plus} onClick={() => setOuverte("nouvelle")}>Créer une publication</Bouton>}>
            Une publication montre un lieu en vidéo ou en photos. Il faut d'abord que le lieu ait sa fiche.
          </EtatVide>
        </Carte>
      )}
      {donnees && donnees.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {donnees.map((publication) => {
            const statut = decrireStatutPublication(publication);
            const couverture = publication.medias.find((m) => m.type === "affiche") ?? publication.medias.find((m) => m.type === "photo");
            const video = publication.medias.find((m) => m.type === "video");
            return (
              <li key={publication.id}>
                <button type="button" onClick={() => setOuverte(publication.id)} className="grid w-full overflow-hidden rounded-carte border border-ligne bg-white text-left transition-colors hover:border-encre">
                  <div className="relative h-56">
                    {couverture || video ? (
                      <VignetteMedia fichier={(couverture ?? video)!.fichier} video={!couverture} className="size-full" />
                    ) : (
                      <div className="grid size-full place-items-center text-5xl" style={{ background: `linear-gradient(160deg, ${publication.lieu.couleurs[0]}, ${publication.lieu.couleurs[1]})` }} aria-hidden>
                        {publication.lieu.emoji}
                      </div>
                    )}
                    <span className="absolute top-2 left-2"><Badge ton={statut.ton}>{statut.libelle}</Badge></span>
                    {video && <span className="absolute top-2 right-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-bold text-white">Vidéo</span>}
                  </div>
                  <div className="grid gap-1 p-4">
                    <p className="truncate font-titre font-extrabold">{publication.lieu.emoji} {publication.lieu.nom}</p>
                    <p className="text-[13px] text-gris">
                      {publication.auteurType === "lieu" ? "Publiée par le lieu" : `Par @${publication.auteurPseudo}`}
                      {publication.partenariat ? " · Collaboration commerciale" : ""}
                    </p>
                    <p className="line-clamp-2 text-sm">{publication.legende}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
