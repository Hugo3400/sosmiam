import { Send } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { envoyerMessage } from "~/services/ambassadeurs.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { SelecteurAmbassadeur } from "./SelecteurAmbassadeur.tsx";

type Props = { compteId?: number; prenom?: string; onFermer: () => void; onEnvoye: () => void };

/** Un message du logiciel vers l'espace ambassadeur (puis l'app) : à une personne, ou à tous les ambassadeurs actifs. */
export function ModaleMessage({ compteId: compteImpose, prenom, onFermer, onEnvoye }: Props) {
  const [compteId, setCompteId] = useState<number | null>(compteImpose ?? null);
  const [titre, setTitre] = useState("");
  const [texte, setTexte] = useState("");
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });
  const aTous = compteId === null;

  async function envoyer() {
    if (aTous && !window.confirm("Envoyer ce message à tous les ambassadeurs actifs ?")) return;
    setEtat({ enCours: true, erreur: null });
    try {
      await envoyerMessage(compteId, titre.trim(), texte.trim());
      onEnvoye();
    } catch (probleme) {
      setEtat({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }

  return (
    <Modale
      titre={prenom ? `Un message pour ${prenom}` : "Écrire aux ambassadeurs"}
      ouverte
      onFermer={onFermer}
      actions={
        <>
          <Bouton onClick={onFermer}>Annuler</Bouton>
          <Bouton variante="principal" icone={Send} desactive={!titre.trim() || !texte.trim()} chargement={etat.enCours} onClick={envoyer}>
            {aTous ? "Envoyer à tous" : "Envoyer"}
          </Bouton>
        </>
      }
    >
      <div className="grid gap-4">
        {!compteImpose && <SelecteurAmbassadeur libelle="Pour" valeur={compteId} onChange={setCompteId} avecTous />}
        <Champ libelle="Titre" valeur={titre} onChange={setTitre} maxLength={100} placeholder="Merci pour ce premier mois 💛" className="w-full min-w-0" />
        <ZoneTexte libelle="Message" valeur={texte} onChange={setTexte} maximum={3000} lignes={7} placeholder="Tutoiement, bonne humeur, et des nouvelles concrètes." />
        <p className="text-sm text-gris">
          Il arrive dans {aTous ? "l'espace de chaque ambassadeur actif (ceux qui s'inscriront plus tard ne le verront pas)" : "son espace ambassadeur"}.
          Pas de mail envoyé : tu vois ici combien l'ont lu.
        </p>
        {etat.erreur && <p role="alert" className="text-sm font-semibold text-rouge-texte">{etat.erreur}</p>}
      </div>
    </Modale>
  );
}
