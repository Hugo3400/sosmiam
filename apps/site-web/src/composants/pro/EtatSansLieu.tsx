import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Le tableau sans aucun lieu : on donne envie de rattacher le sien (ou de l'inscrire s'il n'est pas sur SOS Miam). */
export function EtatSansLieu() {
  return (
    <div className="flex flex-col items-center rounded-carte border-2 border-encre bg-white px-6 py-10 text-center shadow-brut">
      <Mascotte expression="surprise" className="h-24 w-24" />
      <h2 className="mt-4 text-2xl font-extrabold">{lierPonctuation("Pas encore de lieu par ici !")}</h2>
      <p className="mt-2 max-w-md text-gris">
        {lierPonctuation("Cherche ton resto, ton bar, ta pâtisserie ou ta sortie : une fois que l'équipe a vérifié qu'il est à toi, sa fiche s'ouvre ici.")}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Bouton vers="/rattacher">Rattacher mon lieu</Bouton>
        <Bouton href="https://sosmiam.fr/inscrire-mon-lieu" variante="blanc">Mon lieu n'est pas sur SOS Miam</Bouton>
      </div>
    </div>
  );
}
