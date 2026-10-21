import { Save } from "lucide-react";
import { useState } from "react";

import type { DonneesOffreCarriere, OffreCarriereGestion } from "../../../../../packages/commun/src/types/carriere.ts";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { DOMAINES_OFFRE, TYPES_OFFRE } from "~/contenus/carriere.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { creerOffreCarriere, modifierOffreCarriere } from "~/services/carriere.ts";
import { ErreurApi } from "~/services/client-gestion.ts";

const NOMS_CHAMPS: Record<string, string> = {
  titre: "le titre (3 à 120 caractères)", type: "le type", domaine: "le domaine", resume: "le résumé (10 à 300 caractères)",
  description: "la description (20 à 4 000 caractères)", missions: "les missions", profil: "le profil", enEchange: "« en échange »", lieu: "le lieu",
};
const enLignes = (liste: string[]) => liste.join("\n");
const enListe = (texte: string) => texte.split("\n").map((ligne) => ligne.trim()).filter(Boolean);

type Props = { offre: OffreCarriereGestion | null; onFermer: () => void; onEnregistree: (message: string) => void };

export function FormulaireOffre({ offre, onFermer, onEnregistree }: Props) {
  const [titre, setTitre] = useState(offre?.titre ?? "");
  const [type, setType] = useState(offre?.type ?? "benevolat");
  const [domaine, setDomaine] = useState(offre?.domaine ?? "moderation");
  const [resume, setResume] = useState(offre?.resume ?? "");
  const [description, setDescription] = useState(offre?.description ?? "");
  const [missions, setMissions] = useState(enLignes(offre?.missions ?? []));
  const [profil, setProfil] = useState(enLignes(offre?.profil ?? []));
  const [enEchange, setEnEchange] = useState(enLignes(offre?.enEchange ?? []));
  const [lieu, setLieu] = useState(offre?.lieu ?? "À distance, partout en France");
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });

  async function enregistrer() {
    setEtat({ enCours: true, erreur: null });
    const donnees: DonneesOffreCarriere = {
      titre: titre.trim(), type, domaine, resume: resume.trim(), description: description.trim(),
      missions: enListe(missions), profil: enListe(profil), enEchange: enListe(enEchange), lieu: lieu.trim(),
    };
    try {
      if (offre) await modifierOffreCarriere(offre.id, donnees);
      else await creerOffreCarriere(donnees);
      onEnregistree(offre ? "Offre modifiée ✅" : "Offre enregistrée en brouillon ✅ : publie-la quand elle te va.");
    } catch (probleme) {
      const erreur = probleme instanceof ErreurApi ? probleme : null;
      setEtat({ enCours: false, erreur: erreur?.champ ? `Vérifie ${NOMS_CHAMPS[erreur.champ] ?? erreur.champ}.` : expliquerErreur(erreur) });
    }
  }

  return (
    <Modale
      large
      titre={offre ? "Modifier l'offre" : "Nouvelle offre"}
      ouverte
      onFermer={onFermer}
      actions={<><Bouton onClick={onFermer}>Annuler</Bouton><Bouton variante="principal" icone={Save} chargement={etat.enCours} desactive={!titre.trim() || !resume.trim()} onClick={enregistrer}>Enregistrer</Bouton></>}
    >
      <div className="grid gap-4">
        <Champ libelle="Titre" valeur={titre} onChange={setTitre} maxLength={120} placeholder="Modérateur ou modératrice bénévole" className="w-full min-w-0" />
        <div className="grid gap-3 md:grid-cols-3">
          <Selecteur libelle="Type" valeur={type} onChange={setType} options={TYPES_OFFRE} className="w-full" />
          <Selecteur libelle="Domaine" valeur={domaine} onChange={setDomaine} options={DOMAINES_OFFRE} className="w-full" />
          <Champ libelle="Lieu" valeur={lieu} onChange={setLieu} maxLength={120} className="w-full min-w-0" />
        </div>
        <ZoneTexte libelle="Résumé (sur la liste des offres)" valeur={resume} onChange={setResume} maximum={300} lignes={2} />
        <ZoneTexte libelle="Description" valeur={description} onChange={setDescription} maximum={4000} lignes={6} />
        <div className="grid gap-3 md:grid-cols-3">
          <ZoneTexte libelle="Missions (une par ligne)" valeur={missions} onChange={setMissions} lignes={5} />
          <ZoneTexte libelle="Profil (une ligne par point)" valeur={profil} onChange={setProfil} lignes={5} />
          <ZoneTexte libelle="En échange (une ligne par point)" valeur={enEchange} onChange={setEnEchange} lignes={5} />
        </div>
        {type === "freelance" && <p className="text-[13px] text-gris">Freelance ou mission : rémunération « sur devis », jamais de montant affiché (décision de Hugo).</p>}
        {etat.erreur && <p role="alert" className="text-sm font-semibold text-rouge-texte">{etat.erreur}</p>}
      </div>
    </Modale>
  );
}
