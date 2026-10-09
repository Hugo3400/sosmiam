import { Copy, FileText, Mail } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { ModaleEcrireMail } from "~/composants/interface/ModaleEcrireMail.tsx";
import { CATEGORIES_REPONSES } from "~/contenus/reponses-types.ts";
import { remplirReponseType } from "~/fonctions/texte/remplir-reponse-type.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerReponsesTypes, type CategorieReponse } from "~/services/reponses-types.ts";
import { copier } from "~/services/systeme.ts";

/** compteId : écrire à un compte (son adresse est relue sur le serveur) ; sinon à l'adresse donnée */
type Props = { categorie: CategorieReponse; adresse: string | null; compteId?: number; prenom?: string | null; lieu?: string | null };

/** « Réponse type… » : choisir un modèle, rempli avec le prénom et le lieu, puis l'écrire et l'envoyer depuis le logiciel, ou le copier. */
export function BoutonReponseType({ categorie, adresse, compteId, prenom, lieu }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const [copie, setCopie] = useState<string | null>(null);
  const [brouillon, setBrouillon] = useState<{ objet: string; texte: string } | null>(null);
  const [bilan, setBilan] = useState<string | null>(null);
  const { donnees } = utiliserChargement(() => (ouvert ? listerReponsesTypes() : Promise.resolve(null)), [ouvert]);
  // Les modèles de cette catégorie d'abord, puis les autres
  const modeles = [...(donnees ?? [])].sort((a, b) => Number(b.categorie === categorie) - Number(a.categorie === categorie));

  return (
    <>
      <Bouton petit icone={FileText} onClick={() => (setBilan(null), setOuvert(true))}>Réponse type…</Bouton>
      {bilan && <span role="status" className="self-center text-[13px] font-semibold text-vert">{bilan}</span>}
      {adresse && (
        <ModaleEcrireMail
          ouverte={brouillon !== null}
          onFermer={() => setBrouillon(null)}
          destinataire={{ compteId, adresse, prenom }}
          categorie={categorie}
          lieu={lieu}
          objet={brouillon?.objet}
          texte={brouillon?.texte}
          onEnvoye={setBilan}
        />
      )}
      {ouvert && (
        <Modale large titre="Réponse type" ouverte onFermer={() => setOuvert(false)}>
          {donnees && modeles.length === 0 && <p className="text-sm text-gris">Pas encore de réponse type : crée tes modèles dans Réglages → Réponses types.</p>}
          <ul className="grid gap-3">
            {modeles.map((modele) => {
              const objet = remplirReponseType(modele.objet, { prenom, lieu });
              const texte = remplirReponseType(modele.texte, { prenom, lieu });
              return (
                <li key={modele.id} className="grid gap-2 rounded-xl border border-ligne p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex-1 font-semibold">{modele.titre}</span>
                    <span className="text-xs text-gris">{CATEGORIES_REPONSES[modele.categorie]}</span>
                  </div>
                  <p className="line-clamp-3 text-sm whitespace-pre-line text-gris">{texte}</p>
                  <div className="flex flex-wrap gap-2">
                    {adresse && (
                      <Bouton petit variante="principal" icone={Mail} onClick={() => { setBrouillon({ objet, texte }); setOuvert(false); }}>
                        Écrire avec ce modèle
                      </Bouton>
                    )}
                    <Bouton petit icone={Copy} onClick={() => copier(texte).then(() => setCopie(modele.titre))}>Copier le texte</Bouton>
                  </div>
                </li>
              );
            })}
          </ul>
          {copie && <p role="status" className="mt-3 text-sm font-semibold text-vert">« {copie} » copié ✅</p>}
          <p className="mt-3 text-[13px] text-gris">Les « [crochets] » restants sont à compléter avant d'envoyer.</p>
        </Modale>
      )}
    </>
  );
}
