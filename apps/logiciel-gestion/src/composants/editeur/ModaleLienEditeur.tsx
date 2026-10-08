import { Check } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { adresseSure } from "~/fonctions/editeur/rendre-html-courriel.ts";

type Props = {
  mode: "lien" | "bouton";
  texteInitial: string;
  adresseInitiale: string;
  /** Lien posé sur une sélection : le texte est déjà là, on ne demande que l'adresse */
  avecTexte: boolean;
  onValider: (texte: string, adresse: string) => void;
  onRetirer?: () => void;
  onFermer: () => void;
};

/** Ajouter ou changer un lien (ou un bouton) : son texte et son adresse (https://…, ou mailto: pour un e-mail). */
export function ModaleLienEditeur({ mode, texteInitial, adresseInitiale, avecTexte, onValider, onRetirer, onFermer }: Props) {
  const [texte, setTexte] = useState(texteInitial);
  const [adresse, setAdresse] = useState(adresseInitiale || "https://");
  // Une adresse e-mail tapée seule devient un lien « mailto: »
  const adresseFinale = /^[^\s@/:]+@[^\s@]+\.[^\s@]+$/.test(adresse.trim()) ? `mailto:${adresse.trim()}` : adresse.trim();
  const valide = !!adresseSure(adresseFinale) && (!avecTexte || texte.trim().length > 0);

  return (
    <Modale
      titre={mode === "bouton" ? (adresseInitiale ? "Modifier le bouton" : "Ajouter un bouton") : adresseInitiale ? "Modifier le lien" : "Ajouter un lien"}
      ouverte
      onFermer={onFermer}
      actions={
        <>
          {onRetirer && <Bouton variante="danger" onClick={onRetirer}>{mode === "bouton" ? "Supprimer le bouton" : "Retirer le lien"}</Bouton>}
          <Bouton onClick={onFermer}>Annuler</Bouton>
          <Bouton variante="principal" icone={Check} desactive={!valide} onClick={() => onValider(texte.trim(), adresseFinale)}>Valider</Bouton>
        </>
      }
    >
      <div className="grid gap-4">
        {avecTexte && (
          <Champ libelle={mode === "bouton" ? "Texte du bouton" : "Texte du lien"} valeur={texte} onChange={setTexte} maxLength={80} placeholder={mode === "bouton" ? "Découvrir le lieu" : ""} className="w-full" />
        )}
        <Champ
          libelle="Adresse"
          valeur={adresse}
          onChange={setAdresse}
          placeholder="https://sosmiam.fr"
          aide="Une page (https://…) ou une adresse e-mail. Rien d'autre n'est accepté dans un mail."
          className="w-full"
        />
      </div>
    </Modale>
  );
}
