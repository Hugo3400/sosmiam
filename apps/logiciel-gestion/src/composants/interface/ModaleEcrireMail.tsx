import { Send } from "lucide-react";
import { useEffect, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { CATEGORIES_REPONSES } from "~/contenus/reponses-types.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { remplirReponseType } from "~/fonctions/texte/remplir-reponse-type.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { ecrireCourriel } from "~/services/courriels.ts";
import { listerReponsesTypes, type CategorieReponse } from "~/services/reponses-types.ts";

/** À qui : un compte (son adresse est relue sur le serveur) ou une simple adresse ; l'adresse et le prénom sont affichés */
export type DestinataireEcrit = { compteId?: number; adresse: string; prenom?: string | null };

type Props = {
  ouverte: boolean;
  onFermer: () => void;
  destinataire: DestinataireEcrit;
  /** Réponses types de cette catégorie en tête de liste */
  categorie?: CategorieReponse;
  lieu?: string | null;
  objet?: string;
  texte?: string;
  onEnvoye?: (bilan: string) => void;
};

/**
 * Écrire un mail à une personne depuis le logiciel : il part tout de suite de bonjour@sosmiam.fr, aux couleurs de SOS
 * Miam, et la personne répond à cette adresse. Une réponse type peut servir de départ.
 */
export function ModaleEcrireMail({ ouverte, onFermer, destinataire, categorie, lieu, objet: objetDepart, texte: texteDepart, onEnvoye }: Props) {
  const { prenom, adresse, compteId } = destinataire;
  const [objet, setObjet] = useState("");
  const [texte, setTexte] = useState("");
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });
  const { donnees } = utiliserChargement(() => (ouverte ? listerReponsesTypes() : Promise.resolve(null)), [ouverte]);
  const modeles = [...(donnees ?? [])].sort((a, b) => Number(b.categorie === categorie) - Number(a.categorie === categorie));

  // À chaque ouverture : le brouillon de départ (réponse type choisie, lien à transmettre…) ou un simple bonjour
  useEffect(() => {
    if (!ouverte) return;
    setObjet(objetDepart ?? "");
    setTexte(texteDepart ?? (prenom ? `Salut ${prenom} !\n\n` : ""));
    setEtat({ enCours: false, erreur: null });
  }, [ouverte]);

  function partirDe(id: string) {
    const modele = modeles.find((m) => String(m.id) === id);
    if (!modele) return;
    if (texte.trim() && texte.trim() !== `Salut ${prenom} !` && !window.confirm("Remplacer ce que tu as déjà écrit par cette réponse type ?")) return;
    setObjet(remplirReponseType(modele.objet, { prenom, lieu }));
    setTexte(remplirReponseType(modele.texte, { prenom, lieu }));
  }

  async function envoyer() {
    if (/\[[^\]]*\]/.test(`${objet} ${texte}`) && !window.confirm("Il reste des [crochets] à compléter. Envoyer quand même ?")) return;
    setEtat({ enCours: true, erreur: null });
    try {
      await ecrireCourriel(compteId ? { compteId } : { adresse }, objet.trim(), texte);
      setEtat({ enCours: false, erreur: null });
      onEnvoye?.(`Mail envoyé à ${adresse} ✅`);
      onFermer();
    } catch (probleme) {
      setEtat({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }

  return (
    <Modale
      large
      titre="Écrire un mail"
      ouverte={ouverte}
      onFermer={onFermer}
      actions={
        <>
          <Bouton variante="discret" onClick={onFermer}>Annuler</Bouton>
          <Bouton variante="principal" icone={Send} chargement={etat.enCours} desactive={!objet.trim() || !texte.trim() || texte.length > 10_000} onClick={envoyer}>
            Envoyer
          </Bouton>
        </>
      }
    >
      <div className="grid gap-4">
        <p className="text-sm">
          <span className="text-gris">À :</span> <strong>{prenom ? `${prenom} · ` : ""}{adresse}</strong>
          <span className="text-gris"> · depuis bonjour@sosmiam.fr</span>
        </p>
        {modeles.length > 0 && (
          <Selecteur
            libelle="Partir d'une réponse type"
            valeur=""
            onChange={partirDe}
            options={[{ valeur: "", libelle: "Choisir…" }, ...modeles.map((m) => ({ valeur: String(m.id), libelle: `${m.titre} (${CATEGORIES_REPONSES[m.categorie]})` }))]}
          />
        )}
        <Champ libelle="Objet" valeur={objet} onChange={setObjet} maxLength={150} />
        <ZoneTexte
          libelle="Message"
          valeur={texte}
          onChange={setTexte}
          lignes={12}
          maximum={10_000}
          aide="Une ligne vide sépare deux paragraphes ; les adresses https:// deviennent des liens. La réponse arrive dans la boîte bonjour@sosmiam.fr."
        />
        {etat.erreur && <p role="alert" className="text-sm font-semibold text-rouge-texte">{etat.erreur}</p>}
      </div>
    </Modale>
  );
}
