import { Check } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { accepterDemande, type DemandeLieu } from "~/services/demandes.ts";
import type { SaisieLieu, TypeLieu } from "~/services/lieux.ts";

const EMOJIS: Record<string, string> = { resto: "🍽️", patisserie: "🥐", bar: "🍹", sortie: "🎳" };
const NOMS_CHAMPS: Record<string, string> = { nom: "le nom", info: "« ce que c'est »", texte: "la présentation", quartier: "le quartier", ville: "la ville", horaires: "les horaires", plat: "le plat signature", emoji: "l'emoji", siteWeb: "le site web (https://…)" };

/** Accepter une demande : la fiche est préremplie avec ce que le lieu (ou la communauté) a envoyé ; on complète l'essentiel. */
export function ModaleAccepterDemande({ demande, onFermer, onAcceptee }: { demande: DemandeLieu; onFermer: () => void; onAcceptee: () => void }) {
  const type = (["resto", "patisserie", "bar", "sortie"].includes(demande.type ?? "") ? demande.type : "resto") as TypeLieu;
  const [lieu, setLieu] = useState<SaisieLieu>({
    nom: demande.nom, type, emoji: EMOJIS[type] ?? "🍽️", info: "", texte: demande.description.slice(0, 1000), adresse: demande.adresse, quartier: "",
    ville: demande.ville, latitude: null, longitude: null, prix: "€€", prixMoyen: null, couleurs: ["#FFD60A", "#FF4D3D"], horaires: demande.horaires ?? "",
    ouverture: [], plat: demande.plat ?? "", tags: [], envies: [], reservable: false, telephone: null,
    siteWeb: demande.siteWeb?.startsWith("https://") ? demande.siteWeb : null, instagram: demande.instagram, decouvertPar: null, statut: "brouillon",
    note: `Créée depuis la demande n° ${demande.id} (${demande.origine === "lieu" ? "inscription du lieu" : "proposition Discord"}).`,
  });
  const [reponse, setReponse] = useState("");
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });
  const changer = (modif: Partial<SaisieLieu>) => setLieu({ ...lieu, ...modif });

  async function accepter() {
    setEtat({ enCours: true, erreur: null });
    try {
      await accepterDemande(demande.id, lieu, reponse);
      onAcceptee();
    } catch (probleme) {
      const erreur = probleme instanceof ErreurApi ? probleme : null;
      setEtat({ enCours: false, erreur: erreur?.champ ? `Complète ${NOMS_CHAMPS[erreur.champ] ?? erreur.champ}.` : expliquerErreur(erreur) });
    }
  }

  return (
    <Modale
      large
      titre={`Créer la fiche de « ${demande.nom} »`}
      ouverte
      onFermer={onFermer}
      actions={
        <>
          <Bouton onClick={onFermer}>Annuler</Bouton>
          <Bouton variante="principal" icone={Check} chargement={etat.enCours} onClick={accepter}>Accepter et créer la fiche</Bouton>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Champ libelle="Nom" valeur={lieu.nom} maxLength={80} onChange={(nom) => changer({ nom })} />
        <Selecteur
          libelle="Type"
          valeur={lieu.type}
          onChange={(t) => changer({ type: t, emoji: EMOJIS[t] ?? lieu.emoji })}
          options={[{ valeur: "resto", libelle: "Resto" }, { valeur: "patisserie", libelle: "Pâtisserie" }, { valeur: "bar", libelle: "Bar" }, { valeur: "sortie", libelle: "Sortie" }]}
        />
        <Champ libelle="Ce que c'est" valeur={lieu.info} maxLength={60} placeholder="Trattoria, Bar à cocktails…" onChange={(info) => changer({ info })} />
        <Champ libelle="Emoji" valeur={lieu.emoji} maxLength={16} onChange={(emoji) => changer({ emoji })} />
        <Champ libelle="Quartier" valeur={lieu.quartier} maxLength={60} onChange={(quartier) => changer({ quartier })} />
        <Champ libelle="Ville" valeur={lieu.ville} maxLength={80} onChange={(ville) => changer({ ville })} />
        <Champ libelle="Plat signature" valeur={lieu.plat} maxLength={80} onChange={(plat) => changer({ plat })} />
        <Champ libelle="Horaires, en clair" valeur={lieu.horaires} maxLength={160} onChange={(horaires) => changer({ horaires })} />
        <ZoneTexte libelle="Présentation" valeur={lieu.texte} maximum={1000} lignes={4} onChange={(texte) => changer({ texte })} className="md:col-span-2" />
        <ZoneTexte libelle="Note de décision (pour toi, facultative)" valeur={reponse} maximum={1000} lignes={2} onChange={setReponse} className="md:col-span-2" />
      </div>
      <p className="mt-3 text-sm text-gris">La fiche est créée en brouillon : complète-la (couleurs, créneaux, coordonnées…) dans « Lieux », puis passe-la « En ligne ».</p>
      {etat.erreur && <p role="alert" className="mt-3 text-sm font-semibold text-rouge-texte">{etat.erreur}</p>}
    </Modale>
  );
}
