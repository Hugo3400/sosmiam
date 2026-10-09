import { Eye, PencilLine } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { corrigerDateNaissance, lireDateNaissance } from "~/services/comptes.ts";

type Props = { compteId: number; prenom: string; renseignee: boolean; onChange: () => void };

/**
 * La date de naissance d'un compte (chiffrée sur le serveur) : cachée, « Afficher » la montre (et l'écrit au journal),
 * « Corriger… » la change sur demande de la personne (jamais par elle-même) : 15 ans au moins, et sous 18 ans ses
 * rôles d'ambassadeur et de pro partent.
 */
export function DateNaissanceCompte({ compteId, prenom, renseignee, onChange }: Props) {
  const [affichee, setAffichee] = useState<string | null | undefined>(undefined);
  const [correction, setCorrection] = useState(false);
  const [nouvelle, setNouvelle] = useState("");
  const [etat, setEtat] = useState<{ enCours: boolean; texte: string | null }>({ enCours: false, texte: null });
  const erreurDe = (probleme: unknown) => expliquerErreur(probleme instanceof ErreurApi ? probleme : null);

  async function afficher() {
    setEtat({ enCours: true, texte: null });
    try {
      setAffichee((await lireDateNaissance(compteId)).dateNaissance);
      setEtat({ enCours: false, texte: null });
    } catch (probleme) {
      setEtat({ enCours: false, texte: erreurDe(probleme) });
    }
  }

  async function corriger() {
    setEtat({ enCours: true, texte: null });
    try {
      const resultat = await corrigerDateNaissance(compteId, nouvelle);
      const noms = resultat.rolesRetires.map((r) => (r === "pro" ? "de pro" : "d'ambassadeur"));
      const roles = noms.length === 2 ? ` ${prenom} a moins de 18 ans : ses rôles d'ambassadeur et de pro sont retirés.`
        : noms.length === 1 ? ` ${prenom} a moins de 18 ans : son rôle ${noms[0]} est retiré.` : "";
      setEtat({ enCours: false, texte: `Date de naissance corrigée.${roles}` });
      setAffichee(nouvelle);
      setCorrection(false);
      onChange();
    } catch (probleme) {
      setEtat({ enCours: false, texte: erreurDe(probleme) });
    }
  }

  return (
    <>
      <dt className="text-gris">Naissance</dt>
      <dd className="flex flex-wrap items-center gap-2">
        {affichee !== undefined ? <span className="font-semibold">{affichee ? formaterDate(affichee) : "pas renseignée"}</span> : <span className="text-gris">{renseignee ? "renseignée, cachée" : "pas renseignée"}</span>}
        {renseignee && affichee === undefined && <Bouton petit variante="discret" icone={Eye} chargement={etat.enCours} onClick={afficher}>Afficher</Bouton>}
        <Bouton petit variante="discret" icone={PencilLine} onClick={() => (setNouvelle(affichee ?? ""), setCorrection(true), setEtat({ enCours: false, texte: null }))}>Corriger…</Bouton>
        {etat.texte && !correction && <span role="status" className="text-[13px] font-semibold">{etat.texte}</span>}
      </dd>
      {correction && (
        <Modale
          titre={`Date de naissance de ${prenom}`}
          ouverte
          onFermer={() => setCorrection(false)}
          actions={
            <>
              <Bouton onClick={() => setCorrection(false)}>Annuler</Bouton>
              <Bouton variante="principal" chargement={etat.enCours} desactive={!nouvelle} onClick={corriger}>Enregistrer</Bouton>
            </>
          }
        >
          <div className="grid gap-3 text-sm">
            <p>Seulement sur demande de {prenom} (« Écris-nous »), et après avoir vérifié que c'est bien sa demande. La date reste chiffrée sur le serveur.</p>
            <Champ libelle="Nouvelle date de naissance" type="date" valeur={nouvelle} onChange={setNouvelle} />
            <p className="rounded-xl bg-jaune-clair px-3 py-2">
              15 ans au moins. <strong>Sous 18 ans</strong>, ses rôles d'ambassadeur et de pro partent tout de suite (ces espaces sont réservés aux majeurs).
            </p>
            {etat.texte && <p role="alert" className="font-semibold text-rouge-texte">{etat.texte}</p>}
          </div>
        </Modale>
      )}
    </>
  );
}
