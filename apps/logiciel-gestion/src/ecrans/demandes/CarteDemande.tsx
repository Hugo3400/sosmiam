import { Check, ExternalLink, UserX, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { effacerContactDemande, refuserDemande, type DemandeLieu } from "~/services/demandes.ts";
import { ouvrirLien } from "~/services/systeme.ts";
import { BoutonEcrireMail } from "~/composants/interface/BoutonEcrireMail.tsx";
import { ORIGINES_DEMANDE } from "~/contenus/origines-demandes.ts";
import { BoutonReponseType } from "~/composants/interface/BoutonReponseType.tsx";
import { ModaleAccepterDemande } from "./ModaleAccepterDemande.tsx";

const TYPES: Record<string, string> = { resto: "Resto", patisserie: "Pâtisserie", bar: "Bar", sortie: "Sortie", autre: "Autre" };

/** Une demande : ce que le lieu ou la communauté a envoyé, le contact, et la décision. */
export function CarteDemande({ demande, onChange }: { demande: DemandeLieu; onChange: () => void }) {
  const [action, setAction] = useState<"accepter" | "refuser" | null>(null);
  const [motif, setMotif] = useState("");
  const aContact = demande.contactNom || demande.contactEmail || demande.contactTelephone;

  return (
    <article className="grid gap-3 rounded-carte border border-ligne bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge ton={demande.origine === "lieu" ? "jaune" : "neutre"}>{ORIGINES_DEMANDE[demande.origine]?.badge ?? demande.origine}</Badge>
        {demande.statut === "acceptee" && <Badge ton="vert">Acceptée{demande.lieuId ? ` · fiche n° ${demande.lieuId}` : ""}</Badge>}
        {demande.statut === "refusee" && <Badge ton="rouge">Refusée</Badge>}
        <span className="ml-auto text-xs text-gris">{formaterDate(demande.creeLe, true)}</span>
      </div>
      <div>
        <p className="font-titre text-xl font-extrabold">{demande.nom}</p>
        <p className="text-sm text-gris">{[demande.type ? TYPES[demande.type] : null, demande.adresse, demande.ville].filter(Boolean).join(" · ")}</p>
      </div>
      <p className="text-sm whitespace-pre-line">{demande.description}</p>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
        {demande.plat && <><dt className="text-gris">Plat signature</dt><dd>{demande.plat}</dd></>}
        {demande.horaires && <><dt className="text-gris">Horaires</dt><dd>{demande.horaires}</dd></>}
        {demande.siteWeb && <><dt className="text-gris">Site</dt><dd><button type="button" className="underline" onClick={() => ouvrirLien(demande.siteWeb!)}>{demande.siteWeb}</button></dd></>}
        {demande.instagram && <><dt className="text-gris">Instagram</dt><dd>@{demande.instagram}</dd></>}
        {aContact && (
          <>
            <dt className="text-gris">Contact</dt>
            <dd>{[demande.contactNom, demande.contactEmail, demande.contactTelephone].filter(Boolean).join(" · ")}</dd>
          </>
        )}
        {demande.reponse && <><dt className="text-gris">Ta note</dt><dd>{demande.reponse}</dd></>}
      </dl>
      <div className="flex flex-wrap gap-2">
        {demande.statut === "a-traiter" && (
          <>
            <Bouton variante="principal" icone={Check} onClick={() => setAction("accepter")}>Créer la fiche</Bouton>
            <Bouton variante="danger" icone={X} onClick={() => setAction("refuser")}>Refuser</Bouton>
          </>
        )}
        {demande.contactEmail && (
          <BoutonEcrireMail petit={false} libelle="Répondre par mail" destinataire={{ adresse: demande.contactEmail, prenom: demande.contactNom }} categorie="demande" lieu={demande.nom} objet={`Ta demande pour ${demande.nom} sur SOS Miam`} />
        )}
        {demande.contactEmail && <BoutonReponseType categorie="demande" adresse={demande.contactEmail} prenom={demande.contactNom} lieu={demande.nom} />}
        {demande.lienDiscord && <Bouton icone={ExternalLink} onClick={() => ouvrirLien(demande.lienDiscord!)}>Voir sur Discord</Bouton>}
        {aContact && demande.statut !== "a-traiter" && (
          <Bouton variante="discret" icone={UserX} onClick={() => window.confirm("Effacer le nom, l'e-mail et le téléphone de ce contact ?") && effacerContactDemande(demande.id).then(onChange)}>
            Effacer le contact
          </Bouton>
        )}
      </div>
      {action === "accepter" && <ModaleAccepterDemande demande={demande} onFermer={() => setAction(null)} onAcceptee={() => { setAction(null); onChange(); }} />}
      <Modale
        titre={`Refuser « ${demande.nom} » ?`}
        ouverte={action === "refuser"}
        onFermer={() => setAction(null)}
        actions={
          <>
            <Bouton onClick={() => setAction(null)}>Annuler</Bouton>
            <Bouton variante="danger" onClick={() => refuserDemande(demande.id, motif).then(() => { setAction(null); onChange(); })}>Refuser</Bouton>
          </>
        }
      >
        <ZoneTexte libelle="Pourquoi (pour toi, facultatif)" valeur={motif} onChange={setMotif} maximum={1000} lignes={3} />
        {demande.contactEmail && <p className="mt-3 text-sm text-gris">Pense à prévenir le lieu avec « Répondre par mail » : un refus expliqué avec bienveillance, ça compte.</p>}
      </Modale>
    </article>
  );
}
