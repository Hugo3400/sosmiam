import { useEffect, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { corrigerIdentiteCompte, lireIdentiteCompte } from "~/services/comptes.ts";

type Props = { compteId: number; ouverte: boolean; onFermer: () => void; onCorrige: () => void };

/** Corriger le prénom et le nom d'un compte, à la demande de la personne (le nom reste chiffré sur le serveur). */
export function ModaleIdentite({ compteId, ouverte, onFermer, onCorrige }: Props) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [pret, setPret] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  useEffect(() => {
    if (!ouverte) return;
    setPret(false);
    setErreur(null);
    lireIdentiteCompte(compteId).then(
      (lu) => (setPrenom(lu.prenom), setNom(lu.nom ?? ""), setPret(true)),
      (probleme: unknown) => setErreur(expliquerErreur(probleme instanceof ErreurApi ? probleme : null)),
    );
  }, [ouverte, compteId]);

  async function enregistrer() {
    setEnvoi(true);
    setErreur(null);
    try {
      await corrigerIdentiteCompte(compteId, { prenom: prenom.trim(), nom: nom.trim() });
      onCorrige();
      onFermer();
    } catch (probleme) {
      const code = probleme instanceof ErreurApi ? probleme : null;
      setErreur(code?.code === "champ-invalide" ? "Le prénom (1 à 40 caractères, sans gros mot) ou le nom (60 au plus) ne va pas." : expliquerErreur(code));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Modale
      titre="Modifier le prénom et le nom"
      ouverte={ouverte}
      onFermer={onFermer}
      actions={<><Bouton onClick={onFermer}>Annuler</Bouton><Bouton variante="principal" chargement={envoi} desactive={!pret || !prenom.trim()} onClick={enregistrer}>Enregistrer</Bouton></>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ libelle="Prénom" valeur={prenom} maxLength={40} disabled={!pret} onChange={setPrenom} aide="Montré aux autres dans l'app." />
        <Champ libelle="Nom" valeur={nom} maxLength={60} disabled={!pret} onChange={setNom} aide="Facultatif, jamais montré ; vide : effacé." />
      </div>
      <p className="mt-3 text-[13px] text-gris">À faire à la demande de la personne. C'est noté au journal, sans les noms.</p>
      {erreur && <p role="alert" className="mt-3 text-sm font-semibold text-tomate">{erreur}</p>}
    </Modale>
  );
}
