import { Carte } from "~/composants/interface/Carte.tsx";
import { Badge } from "~/composants/interface/Badge.tsx";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { lireMenageManuel } from "~/services/maintenance.ts";

/**
 * Le ménage que le serveur ne fait pas tout seul (audit du 14 octobre 2026), avec ce qu'il faut faire : les durées promises
 * par la politique de confidentialité valent aussi pour ça.
 */
export function CarteMenageManuel() {
  const { donnees } = utiliserChargement(lireMenageManuel, []);
  const lignes = donnees ? [
    {
      nombre: donnees.mailsAnciens,
      titre: "Mails reçus sur bonjour@ de plus de 3 ans",
      faire: "À effacer dans le webmail de la boîte (dossier Reçus).",
    },
    {
      nombre: donnees.candidaturesMail ?? null,
      titre: "Candidatures reçues par mail de plus de 6 mois",
      faire: "À effacer dans le webmail (objet avec « candidature » ou « CV ») : une candidature ne se garde pas plus de 6 mois, CV compris.",
    },
    {
      nombre: donnees.aRelancer,
      titre: "Inscrits à la newsletter sans nouvelles depuis 3 ans",
      faire: "Newsletter → Inscrits, filtre « À relancer » : leur redemander s'ils veulent rester, sinon les désinscrire.",
    },
    {
      nombre: donnees.desinscritsSansDate,
      titre: "Lignes sans date dans la liste des désinscrits",
      faire: "Gardées par prudence (jamais réécrire à quelqu'un parti) : ajoute la date de désinscription si tu la retrouves, sinon la ligne reste.",
    },
  ] : [];
  return (
    <Carte titre="Ménage à faire à la main">
      {!donnees && <p className="text-sm text-gris">Chargement…</p>}
      <ul className="grid gap-3">
        {lignes.map((ligne) => (
          <li key={ligne.titre} className="flex items-start gap-3 text-sm">
            {ligne.nombre === null ? <Badge>?</Badge> : ligne.nombre > 0 ? <Badge ton="jaune">{ligne.nombre}</Badge> : <Badge ton="vert">0 ✓</Badge>}
            <div className="grid gap-0.5">
              <p className="font-semibold">{ligne.titre}{ligne.nombre === null ? " (la boîte ne répond pas)" : ""}</p>
              {(ligne.nombre ?? 1) > 0 && <p className="text-[13px] text-gris">{ligne.faire}</p>}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[13px] text-gris">Le reste se fait tout seul chaque nuit : demandes de lieu et désinscrits de plus de 3 ans, copies « Envoyés » et journal des mails de plus de 90 jours.</p>
    </Carte>
  );
}
