import { Check, DoorOpen, MapPin, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { PastilleEmailVerifie } from "~/composants/interface/PastilleEmailVerifie.tsx";
import { ENVIES_FONDATEUR, FONDATEURS_EN_PREPARATION, PALIERS } from "~/contenus/ambassadeurs.ts";
import { decrireNumerosFondateur } from "~/fonctions/fondateurs/decrire-numeros-fondateur.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { accepterCandidature, libererPlaceFondateur, refuserCandidature, type Candidature } from "~/services/fondateurs.ts";
import { ChoixCommune } from "./ChoixCommune.tsx";

/** onChange reçoit le bilan de l'action (« Malik devient fondateur n° 2 de Lyon · n° 14 en France ») */
type Props = { candidature: Candidature; onChange: (bilan: string) => void; onOuvrirCompte?: (compteId: number) => void };

/**
 * Une candidature fondateur, dans la ville (ou le département) de la personne : ce qu'elle a écrit, sa zone, et les
 * décisions (accepter avec les deux numéros, refuser, libérer la place après un déménagement).
 */
export function CarteCandidature({ candidature, onChange, onOuvrirCompte }: Props) {
  const [etat, setEtat] = useState<{ enCours: boolean; texte: string | null }>({ enCours: false, texte: null });
  const [choixCommune, setChoixCommune] = useState(false);
  const { compte, zone } = candidature;
  const qui = compte?.prenom ?? "La personne";
  const titre = decrireNumerosFondateur(candidature);
  const envies = candidature.envies.split(",").filter(Boolean).map((envie) => ENVIES_FONDATEUR[envie] ?? envie);
  const enPause = FONDATEURS_EN_PREPARATION;

  async function agir(action: () => Promise<string>) {
    setEtat({ enCours: true, texte: null });
    try {
      const bilan = await action();
      setEtat({ enCours: false, texte: null });
      onChange(bilan);
    } catch (probleme) {
      const erreur = probleme instanceof ErreurApi ? probleme : null;
      const complet = erreur?.code === "zone-complete" && zone
        ? `Plus de place ${zone.nomAvecDe} (${zone.places} au total) : une place se rouvre si un fondateur déménage ou quitte le programme.`
        : null;
      setEtat({ enCours: false, texte: complet ?? expliquerErreur(erreur) });
    }
  }

  const accepter = () => agir(async () => {
    const resultat = await accepterCandidature(candidature.id);
    return `${qui} devient fondateur n° ${resultat.numeroLocal} ${resultat.zone.nomAvecDe} · n° ${resultat.numeroNational} en France 🏅 Pense à lui annoncer la nouvelle !`;
  });
  const refuser = () => {
    if (!window.confirm(`Refuser la candidature de ${qui} ? Son compte d'ambassadeur ne change pas.`)) return;
    void agir(async () => (await refuserCandidature(candidature.id), `Candidature de ${qui} refusée.`));
  };
  const liberer = () => {
    const question = `${qui} a déménagé ? Sa place${zone ? ` ${zone.nomAvecDe}` : ""} se libère pour quelqu'un d'autre. ${qui} garde son titre en souvenir (${titre ?? "ses numéros"}), et ces numéros ne seront jamais redonnés.`;
    if (!window.confirm(question)) return;
    void agir(async () => {
      const resultat = await libererPlaceFondateur(candidature.id);
      const rappel = compte?.palier === "ambassadeur-ville" && !resultat.encoreFondateurDeVille
        ? ` ${qui} est encore « ambassadeur de ville » : retire-lui ce rôle dans sa fiche, il est réservé aux fondateurs d'une ville.`
        : "";
      return `Une place de fondateur${zone ? ` ${zone.nomAvecDe}` : ""} se libère : ${qui} garde son titre en souvenir.${rappel}`;
    });
  };

  return (
    <article className="grid gap-3 rounded-carte border border-ligne bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        {candidature.statut === "en-attente" && <Badge ton="jaune">À décider</Badge>}
        {candidature.statut === "acceptee" && <Badge ton="encre">🏅 {titre}</Badge>}
        {candidature.statut === "souvenir" && <Badge>🕰️ Souvenir · {titre}</Badge>}
        {candidature.statut === "refusee" && <Badge>Refusée</Badge>}
        {zone
          ? <Badge>📍 {zone.nom} · {zone.type === "ville" ? `ville, ${zone.places} place${zone.places > 1 ? "s" : ""}` : "département, 1 place"}</Badge>
          : candidature.statut === "en-attente" && <Badge ton="rouge">📍 Commune à choisir</Badge>}
        {candidature.partantRencontre && <Badge ton="vert">🎥 Partant pour la visio</Badge>}
        <span className="ml-auto text-xs text-gris">{formaterDate(candidature.creeLe, true)}</span>
      </div>
      {compte && (
        <div>
          <button type="button" className="font-titre text-xl font-extrabold hover:underline" onClick={() => onOuvrirCompte?.(compte.id)} disabled={!onOuvrirCompte}>
            {compte.prenom}
          </button>
          <p className="text-sm text-gris">
            {[compte.ambassadeur && [compte.ambassadeur.quartier, compte.ambassadeur.ville].filter(Boolean).join(", "), `${PALIERS[compte.palier]?.emoji ?? ""} ${formaterNombre(compte.points)} pts`, compte.email]
              .filter(Boolean).join(" · ")}
            {" · "}<PastilleEmailVerifie le={compte.emailVerifieLe} />
          </p>
        </div>
      )}
      <dl className="grid gap-2 text-sm">
        <div><dt className="font-semibold">Ses 3 pépites</dt><dd className="whitespace-pre-line">{candidature.pepites}</dd></div>
        <div><dt className="font-semibold">« Pourquoi toi ? »</dt><dd className="whitespace-pre-line">{candidature.motivation}</dd></div>
        {envies.length > 0 && <div><dt className="font-semibold">Envies</dt><dd>{envies.join(" · ")}</dd></div>}
        {candidature.reseaux && <div><dt className="font-semibold">Réseaux</dt><dd>{candidature.reseaux}</dd></div>}
        {candidature.connuPar && <div><dt className="font-semibold">A connu SOS Miam par</dt><dd>{candidature.connuPar}</dd></div>}
      </dl>
      {candidature.statut === "en-attente" && choixCommune && (
        <ChoixCommune
          candidatureId={candidature.id}
          onAnnuler={() => setChoixCommune(false)}
          onChoisie={(commune, nouvelleZone) => {
            setChoixCommune(false);
            onChange(`Candidature de ${qui} : ${commune}, comptée ${nouvelleZone.type === "ville" ? "dans la ville" : "dans le département"} ${nouvelleZone.nomAvecDe}.`);
          }}
        />
      )}
      {candidature.statut === "en-attente" && !choixCommune && (
        <div className="flex flex-wrap gap-2">
          <Bouton variante="principal" icone={Check} chargement={etat.enCours} desactive={enPause || !zone} onClick={accepter}
            titre={enPause ? "En pause : nouvelle version par ville en préparation" : !zone ? "Choisis d'abord sa commune" : undefined}>
            Accepter (badge Fondateur)
          </Bouton>
          <Bouton variante="danger" icone={X} desactive={etat.enCours || enPause} onClick={refuser}>Refuser</Bouton>
          <Bouton variante={zone ? "discret" : "secondaire"} icone={MapPin} desactive={etat.enCours} onClick={() => setChoixCommune(true)}>
            {zone ? "Changer de commune" : "Choisir sa commune"}
          </Bouton>
          {enPause && <p className="self-center text-[13px] text-gris">Décisions en pause : fondateurs par ville en préparation.</p>}
        </div>
      )}
      {candidature.statut === "acceptee" && (
        <div>
          <Bouton variante="secondaire" icone={DoorOpen} chargement={etat.enCours} onClick={liberer}>Libérer la place (déménagement)</Bouton>
        </div>
      )}
      {etat.texte && <p role="status" className="text-sm font-semibold">{etat.texte}</p>}
    </article>
  );
}
