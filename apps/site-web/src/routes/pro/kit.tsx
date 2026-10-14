import { stat } from "node:fs/promises";
import { join } from "node:path";
import { Link } from "react-router";

import type { Route } from "./+types/kit";
import { Bouton } from "~/composants/interface/Bouton";
import { ReglesKit } from "~/composants/kit-media/ReglesKit";
import { SectionKit } from "~/composants/kit-media/SectionKit";
import { TexteAPoster } from "~/composants/kit-media/TexteAPoster";
import { CarteFichiersKitLieux } from "~/composants/kit-media-lieux/CarteFichiersKitLieux";
import { SectionsMaquettesKit } from "~/composants/kit-media/SectionsMaquettesKit";
import { Section } from "~/composants/mise-en-page/Section";
import { TitreLieuPro } from "~/composants/pro/TitreLieuPro";
// Les textes et la liste des fichiers seulement : jamais les dessins (composants/kit-media-lieux/), servis en PNG et en PDF
import {
  DOSSIER_KIT_MEDIA_LIEUX, NOM_ZIP_KIT_MEDIA_LIEUX, ecrireTextesKitLieux, fichiersKitMediaLieux, groupesKitMediaLieux, reglesKitMediaLieux,
  texteMiamSafeKitLieux, visuelsKitMediaLieux, type IdVisuelKitLieux, type VisuelKitLieux,
} from "~/contenus/kit-media-lieux";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { exigerLieuPro } from "~/services/lieu-pro.server";
import { lirePoidsMaquettes } from "~/services/maquettes-kits.server";
import { lireCharteMiamSafe } from "~/services/pro.server";

export function meta({ loaderData }: Route.MetaArgs) {
  return [...creerMeta({ titre: loaderData ? `Kit média · ${loaderData.lieu.nom}` : "Kit média", description: "Le kit média de ton lieu sur SOS Miam." }), { name: "robots", content: "noindex" }];
}

const nombres = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

/** « 160 Ko », « 1,1 Mo » : le poids d'un fichier, pour savoir ce qu'on télécharge (sur mobile surtout). */
function lirePoids(octets: number): string {
  return octets < 1_000_000 ? `${Math.max(1, Math.round(octets / 1000))} Ko` : `${nombres.format(octets / 1_000_000)} Mo`;
}

/** Le lieu, s'il a signé la charte Miam Safe (null : pas pu être lu), et le poids de chaque fichier lu sur le disque. */
export async function loader({ request, params }: Route.LoaderArgs) {
  const { jeton, ip, lieu } = await exigerLieuPro(request, params.id);
  const [charte, maquettes, ...lus] = await Promise.all([
    lireCharteMiamSafe(jeton, ip, lieu.id),
    lirePoidsMaquettes("lieux", true),
    ...fichiersKitMediaLieux.map(async (fichier) => {
      const infos = await stat(join(process.cwd(), DOSSIER_KIT_MEDIA_LIEUX, fichier.chemin)).catch(() => null);
      return [fichier.nom, infos ? lirePoids(infos.size) : null] as const;
    }),
  ]);
  return {
    lieu,
    miamSafe: charte.ok ? charte.charte.signee : false,
    poids: { ...maquettes, ...Object.fromEntries(lus) } as Record<string, string | null>,
  };
}

/** Les cartes de la page : une story et un post vont ensemble ; le reste a sa propre carte. */
type CarteKit = { titre: string; texte: string; ids: IdVisuelKitLieux[]; fondSombre?: boolean };

const cartes: CarteKit[] = [
  { titre: "On est sur SOS Miam", texte: "La mascotte gourmande sur fond jaune : pour dire à tes clients qu'ils te retrouvent sur SOS Miam.", ids: ["story-on-est-sur-sos-miam", "post-on-est-sur-sos-miam"] },
  { titre: "Ici, on est Miam Safe", texte: "Pour dire que ton équipe a signé la charte, avec la phrase à dire au comptoir.", ids: ["story-lieu-miam-safe", "post-lieu-miam-safe"] },
  { titre: "Autocollant « On est sur SOS Miam »", texte: "Un rond jaune de 10 cm pour ta vitrine ou ta caisse.", ids: ["autocollant-sos-miam"] },
  { titre: "Autocollant « Lieu Miam Safe »", texte: "Un rond noir de 10 cm, avec la phrase « Le Capitaine est là ? ».", ids: ["autocollant-miam-safe"] },
  { titre: "Mémo d'équipe Miam Safe", texte: "La phrase, l'écran à reconnaître et les quatre gestes, en A5, pour l'arrière du comptoir.", ids: ["memo-equipe-miam-safe"] },
  { titre: "Logo pour fond clair", texte: "Pour ton site, tes menus ou tes réseaux, sur un fond clair.", ids: ["logo-fond-clair"] },
  { titre: "Logo pour fond sombre", texte: "La même chose, « SOS » en crème, pour un fond sombre.", ids: ["logo-fond-sombre"], fondSombre: true },
];

const classeLien = "font-semibold underline decoration-jaune decoration-[3px] underline-offset-4 hover:decoration-encre";

/**
 * Page /lieu/:id/kit : le kit média du lieu (visuels pour les réseaux, autocollants de vitrine, mémo d'équipe, logos,
 * textes prêts à poster et règles). Les visuels Miam Safe ne s'affichent que si le lieu a signé la charte.
 */
export default function PageKitLieu({ loaderData }: Route.ComponentProps) {
  const { lieu, miamSafe, poids } = loaderData;
  const poidsZip = poids[NOM_ZIP_KIT_MEDIA_LIEUX];
  const visible = (visuel: VisuelKitLieux) => miamSafe || !visuel.miamSafe;
  const textes = ecrireTextesKitLieux(lieu.nom, `https://sosmiam.fr/lieux/${lieu.id}`).filter((t) => miamSafe || !t.miamSafe);
  return (
    <Section fond="creme" className="!pt-10 md:!pt-14">
      <TitreLieuPro
        lieu={lieu}
        page="Kit média"
        chapo={lierPonctuation("De quoi dire que ton lieu est sur SOS Miam : des visuels pour tes réseaux, des autocollants pour ta vitrine, des textes prêts à poster. Tout est gratuit.")}
      />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-carte border-2 border-encre bg-jaune p-5 shadow-brut">
        <p className="flex-1 basis-60 font-semibold">{lierPonctuation("Tout le kit d'un coup : les visuels, les autocollants, les logos, les textes et les règles, dans un seul fichier.")}</p>
        <Bouton href={`/kit-media-lieux/${NOM_ZIP_KIT_MEDIA_LIEUX}`} variante="blanc">
          Tout télécharger{poidsZip ? ` (ZIP, ${poidsZip})` : " (ZIP)"}
        </Bouton>
      </div>

      {!miamSafe && (
        <p role="note" className="mt-8 rounded-2xl border-2 border-dashed border-encre bg-white px-5 py-4 font-semibold">
          🛡 {lierPonctuation(texteMiamSafeKitLieux.pasSignee)}{" "}
          <Link to={`/lieu/${lieu.id}/miam-safe`} className={classeLien}>Voir la charte Miam Safe</Link>
        </p>
      )}

      {groupesKitMediaLieux.map((groupe) => {
        const cartesGroupe = cartes.filter((carte) => {
          const visuels = carte.ids.map((id) => visuelsKitMediaLieux.find((v) => v.id === id));
          return visuels.every((v) => v && v.groupe === groupe.groupe && visible(v));
        });
        if (cartesGroupe.length === 0) return null;
        return (
          <SectionKit key={groupe.groupe} id={groupe.groupe} titre={groupe.titre} texte={groupe.texte}>
            <ul className="grid gap-5 md:grid-cols-2">
              {cartesGroupe.map((carte) => (
                <CarteFichiersKitLieux
                  key={carte.titre}
                  titre={carte.titre}
                  texte={carte.texte}
                  visuels={carte.ids.map((id) => visuelsKitMediaLieux.find((v) => v.id === id)!)}
                  fichiers={fichiersKitMediaLieux.filter((f) => f.visuel !== null && carte.ids.includes(f.visuel))}
                  poids={poids}
                  fondSombre={carte.fondSombre}
                />
              ))}
            </ul>
          </SectionKit>
        );
      })}

      <SectionKit id="a-ton-nom" titre="À ton nom, à imprimer" texte="Avec le nom de ton lieu et un QR vers ta fiche : la page s'imprime telle quelle, ou s'enregistre en PDF pour l'imprimeur.">
        <ul className="grid gap-5 md:grid-cols-3">
          {[
            { lien: "vitrine", titre: "L'affiche de vitrine", texte: "En A4, A3 ou 40 × 60 cm, avec la pastille Miam Safe si tu as signé la charte." },
            { lien: "chevalet", titre: "Le chevalet de table", texte: "Deux faces A6 à plier, qui tiennent debout sur la table." },
            { lien: "affichette", titre: "L'affichette de table", texte: "Une seule face A6, à poser sur le comptoir." },
          ].map((page) => (
            <li key={page.lien} className="flex flex-col gap-3 rounded-carte border-2 border-encre bg-white p-5 shadow-brut">
              <h3 className="text-lg leading-tight font-extrabold">{lierPonctuation(page.titre)}</h3>
              <p className="text-gris">{lierPonctuation(page.texte)}</p>
              <Link to={`/lieu/${lieu.id}/${page.lien}`} className={`mt-auto ${classeLien}`}>
                Ouvrir et imprimer<span className="sr-only">&nbsp;: {page.titre}</span>
              </Link>
            </li>
          ))}
        </ul>
      </SectionKit>

      {/* Les maquettes validées : affiches pour ta vitrine et ta salle (A4, A3, 40 × 60 cm), stickers */}
      <SectionsMaquettesKit kit="lieux" miamSafe={miamSafe} prefixe="/kit-media-lieux" poids={poids} />

      <SectionKit id="textes" titre="Des textes prêts à poster" texte="Copie, adapte avec tes mots, et poste avec un visuel. Le lien mène à la fiche de ton lieu sur sosmiam.fr.">
        <ul className="grid gap-5 lg:grid-cols-2">
          {textes.map((t) => <TexteAPoster key={t.titre} titre={t.titre} texte={t.texte} />)}
        </ul>
      </SectionKit>

      <SectionKit id="regles" titre="Les règles du kit" texte="Quelques règles pour que ça reste juste, pour tes clients comme pour les autres lieux.">
        <ReglesKit regles={reglesKitMediaLieux} />
      </SectionKit>
    </Section>
  );
}
